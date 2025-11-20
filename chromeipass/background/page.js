var page = {};

// special information for every tab
page.tabs = {};

page.currentTabId = -1;
page.settings = (typeof (localStorage.settings) == 'undefined') ? {} : JSON.parse(localStorage.settings);
const SETTINGS_BOOL_KEYS = ["autoCompleteUsernames", "autoFillAndSend", "usePasswordGenerator", "autoFillSingleEntry", "autoRetrieveCredentials"];
page.blockedTabs = {};

page.initSettings = function () {
	chrome.storage.local.get(['settings'], data => {
		page.reconcileSettings(data.settings);
		chrome.storage.local.set({ settings: JSON.stringify(page.settings) });
	});
}

page.normalizeBooleanFlags = function (settings) {
	SETTINGS_BOOL_KEYS.forEach(key => {
		if (typeof settings[key] === 'number') settings[key] = settings[key] === 1;
	});
	return settings;
}

page.initOpenedTabs = function () {
	chrome.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			page.createTabEntry(tabs[i].id);
		}
	});
}

page.isValidProtocol = function (url) {
	var protocol = url.substring(0, url.indexOf(":"));
	protocol = protocol.toLowerCase();
	return !(url.indexOf(".") == -1 || (protocol != "http" && protocol != "https" && protocol != "ftp" && protocol != "sftp"));
}

page.switchTab = function (callback, tab) {
	browserAction.showDefault(null, tab);

	safeSendMessage(tab.id, { action: "activated_tab" });
}

page.clearCredentials = function (tabId, complete) {
	if (!page.tabs[tabId]) {
		return;
	}

	page.tabs[tabId].credentials = {};
	delete page.tabs[tabId].credentials;

	if (complete) {
		page.tabs[tabId].loginList = [];

		safeSendMessage(tabId, { action: "clear_credentials" });
	}
}

page.createTabEntry = function (tabId) {
	//console.log("page.createTabEntry("+tabId+")");
	page.tabs[tabId] = {
		"stack": [],
		"errorMessage": null,
		"loginList": {}
	};
}

page.removePageInformationFromNotExistingTabs = function () {
	var rand = Math.floor(Math.random() * 1001);
	if (rand == 28) {
		chrome.tabs.query({}, function (tabs) {
			var $tabIds = {};
			var $infoIds = Object.keys(page.tabs);

			for (var i = 0; i < tabs.length; i++) {
				$tabIds[tabs[i].id] = true;
			}

			for (var i = 0; i < $infoIds.length; i++) {
				if (!($infoIds[i] in $tabIds)) {
					delete page.tabs[$infoIds[i]];
				}
			}
		});
	}
};

page.debugConsole = function () {
	if (arguments.length > 1) {
		console.log(page.sprintf(arguments[0], arguments));
	}
	else {
		console.log(arguments[0]);
	}
};

page.sprintf = function (input, args) {
	return input.replace(/{(\d+)}/g, function (match, number) {
		return typeof args[number] != 'undefined'
			? (typeof args[number] == 'object' ? JSON.stringify(args[number]) : args[number])
			: match
			;
	});
}

page.debugDummy = function () { };

page.debug = page.debugDummy;

page.setDebug = function (bool) {
	if (bool) {
		page.debug = page.debugConsole;
		return "Debug mode enabled";
	}
	else {
		page.debug = page.debugDummy;
		return "Debug mode disabled";
	}
};

page.applySettingsDefaults = function (s) {
	if (!("checkUpdateKeePassHttp" in s)) s.checkUpdateKeePassHttp = 3;
	if (!("autoCompleteUsernames" in s)) s.autoCompleteUsernames = true;
	if (!("autoFillAndSend" in s)) s.autoFillAndSend = true;
	if (!("usePasswordGenerator" in s)) s.usePasswordGenerator = true;
	if (!("autoFillSingleEntry" in s)) s.autoFillSingleEntry = true;
	if (!("autoRetrieveCredentials" in s)) s.autoRetrieveCredentials = true;
	if (!("hostname" in s)) s.hostname = "localhost";
	if (!("port" in s)) s.port = "19455";
	return s;
};

page.reconcileSettings = function (raw) {
	let parsed = {};
	try { parsed = raw ? JSON.parse(raw) : {}; } catch (_) { parsed = {}; }
	page.normalizeBooleanFlags(parsed);
	page.applySettingsDefaults(parsed);
	page.settings = parsed;
	localStorage.settings = JSON.stringify(page.settings);
};

page.attachSettingsWatcher = function () {
	if (page._settingsWatcherAttached) return;
	page._settingsWatcherAttached = true;
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === 'local' && changes.settings) {
			page.reconcileSettings(changes.settings.newValue);
		}
	});
};