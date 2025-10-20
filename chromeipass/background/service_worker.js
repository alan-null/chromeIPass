// replace previous localStorage shim with Proxy-based sync shim
if (typeof localStorage === 'undefined') {
    const _mem = {};
    const persist = (k) => chrome.storage.local.set({ [k]: _mem[k] });
    // Prime from storage (load everything we care about; fallback to full dump)
    chrome.storage.local.get(null, data => {
        Object.assign(_mem, data || {});
    });
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        for (const [k, v] of Object.entries(changes)) {
            if (v.newValue === undefined) delete _mem[k];
            else _mem[k] = v.newValue;
        }
    });

    const core = {
        getItem(k) { return Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null; },
        setItem(k, v) { _mem[k] = String(v); persist(k); },
        removeItem(k) { if (k in _mem) { delete _mem[k]; chrome.storage.local.remove(k); } },
        clear() {
            const keys = Object.keys(_mem);
            if (keys.length) chrome.storage.local.remove(keys);
            for (const k of keys) delete _mem[k];
        },
        key(i) { return Object.keys(_mem)[i] || null; },
        get length() { return Object.keys(_mem).length; }
    };

    globalThis.localStorage = new Proxy(core, {
        get(target, prop) {
            if (prop in target) return target[prop];
            return _mem[prop]; // property-style access
        },
        set(target, prop, value) {
            if (prop in target) { target[prop] = value; return true; }
            if (value === undefined) {
                if (prop in _mem) { delete _mem[prop]; chrome.storage.local.remove(prop); }
            } else {
                _mem[prop] = String(value);
                persist(prop);
            }
            return true;
        },
        deleteProperty(_t, prop) {
            if (prop in _mem) { delete _mem[prop]; chrome.storage.local.remove(prop); }
            return true;
        }
    });
}

// Load legacy modules (adjust order if dependencies differ)
importScripts(
    'aes.js',
    'common.js',
    'cryptoHelpers.js',
    'utf8.js',
    'keepass.js',
    'httpauth.js',
    'browserAction.js',
    'page.js',
    'init.js'
);

// UNIFIED MESSAGE ROUTER (adds missing actions)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (blockIfNotMainFrame(sender, sendResponse)) {
        return;
    }

    try {
        if (!msg || typeof msg !== 'object') return;
        const action = msg.action;
        if (!action) return;

        const tab = sender.tab;

        // helpers
        const async = () => true;
        const respondNoTab = (payload) => {
            try { sendResponse(payload); } catch (_) { }
        };
        const withTab = (handler, fallbackPayload) => {
            if (tab) {
                handler(tab);
                return true; // async only if handler intends async completion
            }
            chrome.tabs.query({ active: true, currentWindow: true }, t => {
                if (t && t[0]) {
                    handler(t[0]);
                } else {
                    respondNoTab(fallbackPayload);
                }
            });
            return true; // we will either call handler (async) or have already responded in callback
        };

        switch (action) {
            case 'get_settings': {
                let settings = {};
                try { settings = JSON.parse(localStorage.settings || '{}'); } catch { }
                sendResponse({ data: settings });
                return;
            }
            case 'save_settings': {
                const settings = (msg.args && msg.args[0]) || {};
                localStorage.settings = JSON.stringify(settings);
                sendResponse({ ok: true });
                return;
            }
            case 'load_settings': {
                // broadcast not needed; just acknowledge
                let settings = {};
                try { settings = JSON.parse(localStorage.settings || '{}'); } catch { }
                if (typeof page !== 'undefined') page.settings = settings;
                sendResponse({ data: settings });
                return;
            }
            case 'load_keyring': {
                try { keepass.keyRing = JSON.parse(localStorage.keyRing || '{}'); } catch { keepass.keyRing = {}; }
                sendResponse({ ok: true });
                return;
            }
            case 'retrieve_credentials': {
                return withTab(t => {
                    keepass.retrieveCredentials(entries => {
                        if (typeof browserAction !== 'undefined') {
                            if (!page.tabs[t.id]) page.tabs[t.id] = { stack: [], loginList: [], credentials: {}, errorMessage: null };
                            page.tabs[t.id].loginList = entries || [];
                            browserAction.show(null, t);
                        }
                        sendResponse(entries);
                    }, t, ...(msg.args || []));
                }, []);
            }
            case 'generate_password': {
                return withTab(t => {
                    keepass.generatePassword(entries => sendResponse(entries || []), t, true);
                }, []);
            }
            case 'copy_password': {
                return withTab(t => {
                    const pwd = (msg.args && msg.args[0]) || '';
                    keepass.copyPassword(result => sendResponse(result), t, pwd);
                }, { ok: false });
            }
            case 'popup_login': {
                return withTab(t => {
                    if (typeof browserAction !== 'undefined') {
                        if (!page.tabs[t.id]) page.tabs[t.id] = { stack: [], loginList: [], credentials: {}, errorMessage: null };
                        page.tabs[t.id].loginList = (msg.args && msg.args[0]) ? (msg.args[0].map(u => ({ Login: u }))) : [];
                        browserAction.show(null, t);
                    }
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'show_default_browseraction': {
                return withTab(t => {
                    if (typeof browserAction !== 'undefined') browserAction.showDefault(null, t);
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'set_remember_credentials': {
                return withTab(t => {
                    const [username, password, url, usernameExists, credentialsList] = msg.args || [];
                    if (typeof browserAction !== 'undefined') {
                        browserAction.setRememberPopup(t.id, username, password, url, usernameExists, credentialsList);
                    }
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'associate': {
                return withTab(t => {
                    keepass.associate(() => sendResponse({ ok: true }), t);
                }, { ok: false });
            }
            case 'get_status': {
                return withTab(t => {
                    const status = {
                        configured: keepass.isConfigured(),
                        associated: keepass.isAssociated(),
                        identifier: (keepass.databaseHash in keepass.keyRing)
                            ? keepass.keyRing[keepass.databaseHash].id
                            : null,
                        keePassHttpAvailable: keepass.isKeePassHttpAvailable,
                        databaseClosed: keepass.isDatabaseClosed,
                        encryptionKeyUnrecognized: keepass.isEncryptionKeyUnrecognized,
                        error: (t && page.tabs[t.id] && page.tabs[t.id].errorMessage) || undefined
                    };
                    sendResponse(status);
                }, { configured: false, associated: false });
            }
            case 'check_update_keepasshttp': {
                keepass.checkForNewKeePassHttpVersion()
                    .finally(() => sendResponse({
                        current: keepass.currentKeePassHttp.version || 0,
                        latest: keepass.latestKeePassHttp.version || 0
                    }));
                return true;
            }
            case 'update_available_keepasshttp': {
                // TODO: Hardcoded response. No point to check version for now.
                return true;
            }
            case 'alert': {
                console.log('[chromeIPass alert]', (msg.args && msg.args[0]) || '');
                sendResponse({ ok: true });
                return;
            }
            case 'get_tab_information': {
                return withTab(t => {
                    if (!page.tabs[t.id]) {
                        page.tabs[t.id] = { stack: [], loginList: [], credentials: {}, errorMessage: null };
                    }
                    sendResponse(page.tabs[t.id]);
                }, {});
            }
            case 'add_credentials': {
                return withTab(t => {
                    const [user, pass, url] = msg.args || [];
                    keepass.addCredentials(result => sendResponse({ result }), t, user, pass, url);
                }, { result: 'error' });
            }
            case 'update_credentials': {
                return withTab(t => {
                    const [uuid, user, pass, url] = msg.args || [];
                    keepass.updateCredentials(result => sendResponse({ result }), t, uuid, user, pass, url);
                }, { result: 'error' });
            }
            case 'stack_add': {
                return withTab(t => {
                    const a = msg.args || [];
                    browserAction.stackAdd(null, t,
                        a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]);
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'pop_stack': {
                return withTab(t => {
                    browserAction.stackPop(t.id);
                    browserAction.show(null, t);
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'remove_credentials_from_tab_information': {
                return withTab(t => {
                    page.clearCredentials(t.id);
                    sendResponse({ ok: true });
                }, { ok: false });
            }
            case 'get_connected_database': {
                sendResponse({
                    count: Object.keys(keepass.keyRing || {}).length,
                    identifier: (keepass.keyRing && keepass.associated.hash && keepass.keyRing[keepass.associated.hash])
                        ? keepass.keyRing[keepass.associated.hash].id
                        : null
                });
                return;
            }
            default: {
                // fall back to legacy handler if present
                if (typeof handleRuntimeMessage === 'function') {
                    try {
                        const ret = handleRuntimeMessage(msg, sender, sendResponse);
                        if (ret === true) return true;
                    } catch (e) {
                        console.error('Legacy handler error', e);
                    }
                }
                sendResponse({ ok: false, error: 'unknown_action' });
                return;
            }
        }
    } catch (e) {
        console.error('Router error', e);
        try { sendResponse({ ok: false, error: e.message }); } catch { }
    }
    // default sync exit
});

// Wrap legacy init if it exists
function safeInit(context) {
    try {
        if (typeof init === 'function') {
            init(context);
        }
    } catch (e) {
        console.error('Initialization error:', e);
    }
}

// Run on install / update
chrome.runtime.onInstalled.addListener(details => {
    safeInit({ reason: details.reason });
});

// Lazy on-demand init (in case worker was cold-started)
chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => safeInit({ reason: 'startup' }));