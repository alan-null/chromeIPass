var browserAction = {};

var BLINK_TIMEOUT_DEFAULT = 7500;
var BLINK_TIMEOUT_REDIRECT_THRESHOLD_TIME_DEFAULT = -1;
var BLINK_TIMEOUT_REDIRECT_COUNT_DEFAULT = 1;

browserAction._ensureTabData = function (tabId) {
	if (!page.tabs[tabId]) {
		page.tabs[tabId] = {
			stack: [],
			loginList: [],
			credentials: {},
			errorMessage: null
		};
	}
};

browserAction.show = function (callback, tab) {
	if (!tab || !tab.id) return;
	browserAction._ensureTabData(tab.id);

	var data = {};
	if (!page.tabs[tab.id] || page.tabs[tab.id].stack.length == 0) {
		browserAction.showDefault(callback, tab);
		return;
	} else {
		data = page.tabs[tab.id].stack[page.tabs[tab.id].stack.length - 1];
	}

	try {
		chrome.action.setIcon({
			tabId: tab.id,
			path: "/icons/19x19/" + browserAction.generateIconName(data.iconType, data.icon)
		});
		if (data.popup) {
			chrome.action.setPopup({
				tabId: tab.id,
				popup: "popups/" + data.popup
			});
		}
	} catch (e) {
		console.log("Set icon/popup failed", e);
	}
};

browserAction.update = function (interval) {
	var currentId = page.currentTabId;
	if (typeof currentId === 'undefined' || currentId === -1) return;
	browserAction._ensureTabData(currentId);

	if (!page.tabs[currentId] || page.tabs[currentId].stack.length == 0) {
		return;
	}

	var data = page.tabs[currentId].stack[page.tabs[currentId].stack.length - 1];

	if (typeof data.visibleForMilliSeconds != "undefined") {
		if (data.visibleForMilliSeconds <= 0) {
			browserAction.stackPop(currentId);
			browserAction.show(null, { "id": currentId });
			page.clearCredentials(currentId);
			return;
		}
		data.visibleForMilliSeconds -= interval;
	}

	if (data.intervalIcon) {
		data.intervalIcon.counter += 1;
		if (data.intervalIcon.counter < data.intervalIcon.max) {
			return;
		}

		data.intervalIcon.counter = 0;
		data.intervalIcon.index += 1;

		if (data.intervalIcon.index > data.intervalIcon.icons.length - 1) {
			data.intervalIcon.index = 0;
		}

		try {
			chrome.action.setIcon({
				tabId: currentId,
				path: "/icons/19x19/" + browserAction.generateIconName(null, data.intervalIcon.icons[data.intervalIcon.index])
			});
		} catch (e) {
			console.log("Set interval icon failed", e);
		}
	}
};

browserAction.showDefault = function (callback, tab) {
	if (!tab || !tab.id) return;
	browserAction._ensureTabData(tab.id);

	var stackData = {
		level: 1,
		iconType: "normal",
		popup: "popup.html"
	};
	if (!keepass.isConfigured() || keepass.isDatabaseClosed || !keepass.isKeePassHttpAvailable || page.tabs[tab.id].errorMessage) {
		stackData.iconType = "cross";
	}

	if (page.tabs[tab.id].loginList.length > 0) {
		stackData.iconType = "questionmark";
		stackData.popup = "popup_login.html";
	}

	browserAction.stackUnshift(stackData, tab.id);

	browserAction.show(null, tab);
};

browserAction.stackAdd = function (callback, tab, icon, popup, level, push, visibleForMilliSeconds, visibleForPageUpdates, redirectOffset, dontShow) {
	var id = tab.id || page.currentTabId;

	if (!level) {
		level = 1;
	}

	var stackData = {
		"level": level,
		"icon": icon
	};

	if (popup) {
		stackData.popup = popup;
	}

	if (visibleForMilliSeconds) {
		stackData.visibleForMilliSeconds = visibleForMilliSeconds;
	}

	if (visibleForPageUpdates) {
		stackData.visibleForPageUpdates = visibleForPageUpdates;
	}

	if (redirectOffset) {
		stackData.redirectOffset = redirectOffset;
	}

	if (push) {
		browserAction.stackPush(stackData, id);
	}
	else {
		browserAction.stackUnshift(stackData, id);
	}

	if (!dontShow) {
		browserAction.show(null, { "id": id });
	}
};

browserAction.removeLevelFromStack = function (callback, tab, level, type, dontShow) {
	if (!page.tabs[tab.id]) {
		return;
	}

	if (!type) {
		type = "<=";
	}

	var newStack = [];
	for (var i = 0; i < page.tabs[tab.id].stack.length; i++) {
		if (
			(type == "<" && page.tabs[tab.id].stack[i].level >= level) ||
			(type == "<=" && page.tabs[tab.id].stack[i].level > level) ||
			(type == "=" && page.tabs[tab.id].stack[i].level != level) ||
			(type == "==" && page.tabs[tab.id].stack[i].level != level) ||
			(type == "!=" && page.tabs[tab.id].stack[i].level == level) ||
			(type == ">" && page.tabs[tab.id].stack[i].level <= level) ||
			(type == ">=" && page.tabs[tab.id].stack[i].level < level)
		) {
			newStack.push(page.tabs[tab.id].stack[i]);
		}
	}

	page.tabs[tab.id].stack = newStack;

	if (!dontShow) {
		browserAction.show(callback, tab);
	}
};

browserAction.stackPop = function (tabId) {
	var id = tabId || page.currentTabId;

	page.tabs[id].stack.pop();
};

browserAction.stackPush = function (data, tabId) {
	var id = tabId || page.currentTabId;

	browserAction.removeLevelFromStack(null, { "id": id }, data.level, "<=", true);
	page.tabs[id].stack.push(data);
};

browserAction.stackUnshift = function (data, tabId) {
	var id = tabId || page.currentTabId;

	browserAction.removeLevelFromStack(null, { "id": id }, data.level, "<=", true);
	page.tabs[id].stack.unshift(data);
};

browserAction.removeRememberPopup = function (callback, tab, removeImmediately) {
	if (!tab || !tab.id) return;
	browserAction._ensureTabData(tab.id);
	if (!page.tabs[tab.id]) {
		return;
	}

	if (page.tabs[tab.id].stack.length == 0) {
		page.clearCredentials(tab.id);
		return;
	}
	var data = page.tabs[tab.id].stack[page.tabs[tab.id].stack.length - 1];

	if (removeImmediately || !isNaN(data.visibleForPageUpdates)) {
		var currentMS = Date.now();
		if (removeImmediately || (data.visibleForPageUpdates <= 0 && data.redirectOffset > 0)) {
			browserAction.stackPop(tab.id);
			browserAction.show(null, { "id": tab.id });
			page.clearCredentials(tab.id);
			return;
		}
		else if (!isNaN(data.visibleForPageUpdates) && data.redirectOffset > 0 && currentMS >= data.redirectOffset) {
			data.visibleForPageUpdates = data.visibleForPageUpdates - 1;
		}
	}
};

browserAction.setRememberPopup = function (tabId, username, password, url, usernameExists, credentialsList) {
	// Async fetch settings from chrome.storage.local instead of localStorage
	chrome.storage.local.get(['settings'], raw => {
		let settings = {};
		try { settings = raw.settings ? JSON.parse(raw.settings) : {}; } catch (_) { }
		var id = tabId || page.currentTabId;

		var timeoutMinMillis = parseInt(getValueOrDefault(settings, "blinkMinTimeout", BLINK_TIMEOUT_REDIRECT_THRESHOLD_TIME_DEFAULT, 0));
		if (timeoutMinMillis > 0) {
			timeoutMinMillis += Date.now();
		}
		var blinkTimeout = getValueOrDefault(settings, "blinkTimeout", BLINK_TIMEOUT_DEFAULT, 0);
		var pageUpdateAllowance = getValueOrDefault(settings, "allowedRedirect", BLINK_TIMEOUT_REDIRECT_COUNT_DEFAULT, 0);

		var stackData = {
			visibleForMilliSeconds: blinkTimeout,
			visibleForPageUpdates: pageUpdateAllowance,
			redirectOffset: timeoutMinMillis,
			level: 10,
			intervalIcon: {
				index: 0,
				counter: 0,
				max: 2,
				icons: ["icon_remember_red_background_19x19.png", "icon_remember_red_lock_19x19.png"]
			},
			icon: "icon_remember_red_background_19x19.png",
			popup: "popup_remember.html"
		};

		browserAction.stackPush(stackData, id);

		page.tabs[id].credentials = {
			"username": username,
			"password": password,
			"url": url,
			"usernameExists": usernameExists,
			"list": credentialsList
		};

		browserAction.show(null, { "id": id });
	});
}

function getValueOrDefault(settings, key, defaultVal, min) {
	try {
		var val = settings[key];
		if (isNaN(val) || val < min) {
			val = defaultVal;
		}
		return val;
	} catch (e) { return defaultVal; }
}

browserAction.generateIconName = function (iconType, icon) {
	if (icon) {
		return icon;
	}

	var name = "icon_";
	name += (keepass.keePassHttpUpdateAvailable()) ? "new_" : "";
	name += (!iconType || iconType == "normal") ? "normal_" : iconType + "_";
	name += keepass.getIconColor();
	name += "_19x19.png";

	return name;
};