/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - The options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} Returns the new debounced function
 */
export function debounce(func, wait = 300, options = {}) {
    let timeoutId;
    let lastArgs;
    let lastThis;
    let result;
    let lastCallTime = 0;
    const { leading = false, trailing = true } = options;

    function invokeFunc() {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastCallTime = Date.now();
        result = func.apply(thisArg, args);
        return result;
    }

    function startTimer(pendingFunc, wait) {
        timeoutId = setTimeout(pendingFunc, wait);
    }

    function cancelTimer() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
    }

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;

        if (isInvoking) {
            if (timeoutId === undefined && leading) {
                return leadingEdge(time);
            }
            if (trailing) {
                startTimer(timerExpired, wait);
            }
            return result;
        }
        if (timeoutId === undefined && trailing) {
            startTimer(timerExpired, wait);
        }
        return result;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        return lastCallTime === 0 || timeSinceLastCall >= wait;
    }

    function leadingEdge(time) {
        lastCallTime = time;
        startTimer(timerExpired, wait);
        return invokeFunc();
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge();
        }
        startTimer(timerExpired, remainingWait(time));
    }

    function trailingEdge() {
        timeoutId = undefined;
        if (trailing && lastArgs) {
            return invokeFunc();
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeWaiting = wait - timeSinceLastCall;
        return timeWaiting;
    }

    debounced.cancel = function() {
        cancelTimer();
        lastCallTime = 0;
        timeoutId = lastArgs = lastThis = undefined;
    };

    debounced.flush = function() {
        return timeoutId === undefined ? result : trailingEdge();
    };

    debounced.pending = function() {
        return timeoutId !== undefined;
    };

    return debounced;
}

/**
 * Creates a debounced async function that delays invoking func until after wait milliseconds
 * @param {Function} func - The async function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} Returns the new debounced function
 */
export function debounceAsync(func, wait = 300) {
    let timeout;
    let controller;

    return async function executedFunction(...args) {
        if (controller) {
            controller.abort();
        }

        controller = new AbortController();
        const signal = controller.signal;

        return new Promise((resolve, reject) => {
            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(async () => {
                try {
                    const result = await func.apply(this, [...args, signal]);
                    resolve(result);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        // Ignore aborted requests
                        return;
                    }
                    reject(error);
                }
            }, wait);
        });
    };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @returns {Function} Returns the new throttled function
 */
export function throttle(func, wait = 300) {
    let timeout = null;
    let previous = 0;

    function later(context, args) {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
    }

    return function throttled(...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);

        if (remaining <= 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => later(this, args), remaining);
        }
    };
} 