const __DEBUG = {
    prefix: '[chromeIPass:debug]'
};

/**
 * Checks if the sender is from the main frame or an extension page/service worker.
 * If not, logs and responds with an error.
 * Returns true if blocked, false otherwise.
 */
function blockIfNotMainFrame(sender, respond) {
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : undefined;

    // Allow:
    // - main frame (frameId === 0)
    // - extension pages / service worker (frameId === undefined)
    if (frameId !== 0 && frameId !== undefined) {
        debugLog('Blocked message from subframe:', sender.origin || sender.url, 'frameId:', frameId);
        respond({ ok: false, error: 'not_main_frame' });
        return true;
    }
    return false;
}

/**
 * Logs debug messages to the console with a specific prefix.
 *
 * @param {...any} args - The values to log to the console.
 */
function debugLog(...args) {
    console.debug(__DEBUG.prefix, ...args);
}