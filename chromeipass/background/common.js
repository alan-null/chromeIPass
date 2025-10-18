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

/**
 * Safely sends a message to a specified Chrome tab, with protocol and tab validation,
 * and retries once if the content script is not yet injected.
 *
 * @param {number} tabId - The ID of the tab to send the message to.
 * @param {*} payload - The message payload to send to the content script.
 * @param {number} [retryDelay=120] - Optional delay in milliseconds before retrying if the first attempt fails.
 * @returns {Promise<boolean|*>} Resolves with the response from the content script, or false if the tab is invalid, not found, unsupported protocol, or both attempts fail.
 */
function safeSendMessage(tabId, payload, retryDelay = 120) {
    return new Promise(resolve => {
        if (!tabId || tabId < 0) {
            debugLog('safeSendMessage: invalid tabId', tabId);
            return resolve(false);
        }

        chrome.tabs.get(tabId, tab => {
            if (!tab) {
                debugLog('safeSendMessage: tab not found', tabId);
                return resolve(false);
            }
            const url = tab.url || '';
            if (!/^https?:|^ftp:|^sftp:/.test(url)) { // protocols where content script is declared
                debugLog('safeSendMessage: unsupported protocol, skip', url);
                return resolve(false);
            }
            const attempt = (second) => {
                chrome.tabs.sendMessage(tabId, payload, resp => {
                    if (chrome.runtime.lastError) {
                        debugLog('safeSendMessage error:', chrome.runtime.lastError.message, 'payload:', payload);
                        if (!second) {
                            // Retry once (content script may not yet be injected)
                            return setTimeout(() => attempt(true), retryDelay);
                        }
                        return resolve(false);
                    }
                    resolve(resp === undefined ? true : resp);
                });
            };
            attempt(false);
        });
    });
}