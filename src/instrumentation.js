export async function register() {}

/**
 * Called by Next.js for every uncaught server error (route handlers, server
 * components, server actions). Next awaits this before finishing the error
 * response, so the write is time-boxed inside server-log.js and must never throw.
 * Edge runtime (middleware) errors are not persisted; they still appear in
 * Vercel's runtime logs.
 */
export async function onRequestError(error, request, context) {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { logServerError } = await import('./lib/server-log.js');
      await logServerError(error, { request, context });
    }
  } catch {
    // fail open
  }
}
