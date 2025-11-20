// since version 2.0 the extension is using a keyRing instead of a single key-name-pair
keepass.convertKeyToKeyRing();
// load settings
page.initSettings();
// start watcher for settings changes
page.attachSettingsWatcher();
// create tab information structure for every opened tab
page.initOpenedTabs();
// initial connection with KeePassHttp
keepass.getDatabaseHash(null);
// set initial tab-ID
chrome.tabs.query({ "active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT }, function (tabs) {
	if (tabs.length === 0)
		return; // For example: only the background devtools or a popup are opened
	page.currentTabId = tabs[0].id;
});
// Milliseconds for intervall (e.g. to update browserAction)
var _interval = 250;


/**
 * Generate information structure for created tab and invoke all needed
 * functions if tab is created in foreground
 * @param {object} tab
 */
chrome.tabs.onCreated.addListener(function (tab) {
	if (tab.id > 0) {
		//console.log("chrome.tabs.onCreated(" + tab.id+ ")");
		if (tab.active) {
			page.currentTabId = tab.id;
			page.switchTab(null, tab);
		}
	}
});

/**
 * Remove information structure of closed tab for freeing memory
 * @param {integer} tabId
 * @param {object} removeInfo
 */
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	delete page.tabs[tabId];
	if (page.currentTabId == tabId) {
		page.currentTabId = -1;
	}
});

/**
 * Remove stored credentials on switching tabs.
 * Invoke functions to retrieve credentials for focused tab
 * @param {object} activeInfo
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
	// remove possible credentials from old tab information
	if (page.currentTabId !== -1) {
		page.clearCredentials(page.currentTabId, true);
		browserAction.removeRememberPopup(null, { "id": page.currentTabId }, true);
	}

	chrome.tabs.get(activeInfo.tabId, function (info) {
		//console.log(info.id + ": " + info.url);
		if (info && info.id) {
			page.currentTabId = info.id;
			if (info.status == "complete") {
				page.switchTab(null, info);
			}
		}
	});
});

/**
 * Update browserAction on every update of the page
 * @param {integer} tabId
 * @param {object} changeInfo
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == "complete") {
		browserAction.removeRememberPopup(null, { id: tabId }, true);
	}
});


/**
 * Retrieve Credentials and try auto-login for HTTPAuth requests
 */
chrome.webRequest.onAuthRequired.addListener(httpAuth.handleRequest,
	{ urls: ["<all_urls>"] }, ["asyncBlocking"]
);

/**
 * Add context menu entry for filling in username + password
 */
chrome.contextMenus.removeAll(() => {
	chrome.contextMenus.create({
		id: "cip_fill_user_pass",
		title: "Fill &User + Pass",
		contexts: ["editable"]
	});
	chrome.contextMenus.create({
		id: "cip_fill_pass_only",
		title: "Fill &Pass Only",
		contexts: ["editable"]
	});
	chrome.contextMenus.create({
		id: "cip_show_generator",
		title: "Show Password &Generator Icons",
		contexts: ["editable"]
	});
	chrome.contextMenus.create({
		id: "cip_save_credentials",
		title: "&Save credentials",
		contexts: ["editable"]
	});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (!tab || !tab.id) return;
	switch (info.menuItemId) {
		case "cip_fill_user_pass":
			safeSendMessage(tab.id, { action: "fill_user_pass" });
			break;
		case "cip_fill_pass_only":
			safeSendMessage(tab.id, { action: "fill_pass_only" });
			break;
		case "cip_show_generator":
			safeSendMessage(tab.id, { action: "activate_password_generator" });
			break;
		case "cip_save_credentials":
			safeSendMessage(tab.id, { action: "remember_credentials" });
			break;
	}
});

/**
 * Listen for keyboard shortcuts specified by user
 */
chrome.commands.onCommand.addListener(function (command) {

	if (command === "fill-username-password") {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			if (tabs.length) {
				safeSendMessage(tabs[0].id, { action: "fill_user_pass" });
			}
		});
	}

	if (command === "fill-password") {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			if (tabs.length) {
				safeSendMessage(tabs[0].id, { action: "fill_pass_only" });
			}
		});
	}
});

/**
 * Interval which updates the browserAction (e.g. blinking icon)
 */
setInterval(function () {
	browserAction.update(_interval);
}, _interval);