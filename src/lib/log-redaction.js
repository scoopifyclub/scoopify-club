/**
 * Redaction helpers for anything written to persistent logs (SystemLog, local
 * exports). Pure functions with no dependencies so they work in every runtime.
 *
 * Rule of thumb: over-redacting is fine, leaking a secret is not.
 */

export const REDACTED = '[REDACTED]';
export const OMITTED = '[OMITTED]';

export const LIMITS = {
  message: 1000,
  stack: 4000,
  string: 500,
  arrayItems: 20,
  objectKeys: 50,
  depth: 4,
};

// Object keys whose values are never logged.
const SENSITIVE_KEY =
  /pass(word|wd|phrase)?|pwd|secret|token|api[-_]?key|auth|cookie|session|gate[-_]?code|access[-_]?code|card|cvc|cvv|ccv|expiry|exp[-_]?(month|year)|iban|account[-_]?number|routing|ssn|private[-_]?key|signature|otp|^pin$|credential|jwt|bearer|dsn|connection[-_]?string|database[-_]?url/i;

// Object keys that usually hold whole request payloads.
const BODY_KEY = /^(body|raw[-_]?body|request[-_]?body|req[-_]?body|form[-_]?data|payload)$/i;

// key=value / key: value / "key":"value" pairs inside free text (error messages, Prisma
// validation output, stack frames, URLs).
const TEXT_KEY_VALUE =
  /(["']?)([A-Za-z0-9_-]*(?:password|passwd|pwd|secret|token|api[_-]?key|authorization|cookie|gate[_-]?code|access[_-]?code|card[_-]?number|cardnumber|cvc|cvv|ssn|private[_-]?key)[A-Za-z0-9_-]*)\1(\s*[:=]\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s,;&)}\]]+)/gi;

const TEXT_PATTERNS = [
  [/\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^\s'"<>]+/gi, `$1://${REDACTED}`],
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, `$1 ${REDACTED}`],
  [/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g, REDACTED],
  [/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}/g, REDACTED],
  [/\b(?:whsec|re|ghp|gho|github_pat|xox[abprs])_[A-Za-z0-9_-]{10,}/g, REDACTED],
];

// Card networks issue PANs starting with 2-6; this keeps epoch-millisecond ids (1…) intact.
const CARD_CANDIDATE = /\b[2-6](?:[ -]?\d){12,18}\b/g;

function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function truncate(value, max = LIMITS.string) {
  if (typeof value !== 'string') return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…[truncated ${value.length - max} chars]`;
}

export function redactText(input, max = LIMITS.string) {
  if (input === null || input === undefined) return input;
  let text = typeof input === 'string' ? input : String(input);
  // Bound the work before running regexes over attacker-influenced text.
  if (text.length > max * 4) text = text.slice(0, max * 4);
  for (const [pattern, replacement] of TEXT_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(TEXT_KEY_VALUE, (_m, quote, key, sep) => `${quote}${key}${quote}${sep}${REDACTED}`);
  text = text.replace(CARD_CANDIDATE, (match) => {
    const digits = match.replace(/[ -]/g, '');
    return digits.length >= 13 && digits.length <= 19 && luhnValid(digits) ? '[REDACTED_CARD]' : match;
  });
  return truncate(text, max);
}

export function isSensitiveKey(key) {
  return SENSITIVE_KEY.test(String(key));
}

export function sanitize(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  const kind = typeof value;
  if (kind === 'string') return redactText(value, LIMITS.string);
  if (kind === 'number' || kind === 'boolean') return value;
  if (kind === 'bigint') return value.toString();
  if (kind === 'function' || kind === 'symbol') return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message, LIMITS.message),
      stack: redactText(value.stack, LIMITS.stack),
    };
  }
  if (depth >= LIMITS.depth) return '[MaxDepth]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    const out = value.slice(0, LIMITS.arrayItems).map((item) => sanitize(item, depth + 1, seen));
    if (value.length > LIMITS.arrayItems) out.push(`[+${value.length - LIMITS.arrayItems} more]`);
    return out;
  }

  const out = {};
  const keys = Object.keys(value);
  for (const key of keys.slice(0, LIMITS.objectKeys)) {
    if (BODY_KEY.test(key)) out[key] = OMITTED;
    else if (isSensitiveKey(key)) out[key] = REDACTED;
    else {
      const sanitized = sanitize(value[key], depth + 1, seen);
      if (sanitized !== undefined) out[key] = sanitized;
    }
  }
  if (keys.length > LIMITS.objectKeys) out['…'] = `[+${keys.length - LIMITS.objectKeys} keys]`;
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Drops the query string and fragment (reset links, OAuth codes and similar live
 * there) and masks path segments that look like tokens.
 */
export function sanitizePath(path) {
  if (typeof path !== 'string' || path === '') return null;
  let pathname = path;
  try {
    if (/^https?:\/\//i.test(path)) pathname = new URL(path).pathname;
  } catch {
    // keep the raw value; it is still cleaned below
  }
  pathname = pathname.split(/[?#]/)[0];
  const segments = pathname.split('/').map((segment) => {
    if (UUID.test(segment)) return segment;
    if (/^eyJ/.test(segment) || /^[A-Za-z0-9_.~-]{32,}$/.test(segment)) return ':redacted';
    return segment;
  });
  return truncate(redactText(segments.join('/'), 300), 300);
}

/** Request ids only ever contain a small safe alphabet; anything else is dropped. */
export function sanitizeRequestId(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^A-Za-z0-9:._-]/g, '').slice(0, 128);
  return cleaned || null;
}
