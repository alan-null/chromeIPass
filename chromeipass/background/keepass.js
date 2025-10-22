var keepass = {};

keepass.associated = { "value": false, "hash": null };
keepass.isDatabaseClosed = false;
keepass.isKeePassHttpAvailable = false;
keepass.isEncryptionKeyUnrecognized = false;
keepass.currentKeePassHttp = { "version": 0, "versionParsed": 0 };
keepass.keySize = 8; // wtf? stupid cryptoHelpers
keepass.pluginUrlDefault = "http://localhost:19455/";
keepass.latestVersionUrl = "https://passifox.appspot.com/kph/latest-version.txt";
keepass.cacheTimeout = 30 * 1000; // milliseconds
keepass.databaseHash = "no-hash"; //no-hash = keepasshttp is too old and does not return a hash value
keepass.keyId = "chromeipass-cryptokey-name";
keepass.keyBody = "chromeipass-key";
keepass.to_s = cryptoHelpers.convertByteArrayToString;
keepass.to_b = cryptoHelpers.convertStringToByteArray;

// Replace naive keyRing / latestKeePassHttp initialization with async chrome.storage.local versions
keepass.keyRing = {}; // in-memory cache
keepass.latestKeePassHttp = { "version": 0, "versionParsed": 0, "lastChecked": null };

keepass._loadKeyRing = function (cb) {
	chrome.storage.local.get(['keyRing'], data => {
		try {
			keepass.keyRing = data.keyRing ? JSON.parse(data.keyRing) : {};
			if (typeof keepass.keyRing !== 'object' || Array.isArray(keepass.keyRing) || keepass.keyRing === null) {
				keepass.keyRing = {};
			}
		} catch (e) { keepass.keyRing = {}; }
		cb && cb(keepass.keyRing);
	});
};

keepass._persistKeyRing = function (cb) {
	try {
		chrome.storage.local.set({ keyRing: JSON.stringify(keepass.keyRing) }, () => cb && cb());
	} catch (e) { console.warn('keyRing persist failed', e); cb && cb(e); }
};

// Load keyRing & latestKeePassHttp asynchronously at startup
keepass._loadKeyRing();
chrome.storage.local.get(['latestKeePassHttp'], data => {
	try {
		if (data.latestKeePassHttp) {
			keepass.latestKeePassHttp = JSON.parse(data.latestKeePassHttp);
		}
	} catch (_) { }
});

// REWRITE (MV3 service worker): remove synchronous XMLHttpRequest usage.
// Added async networking helpers + association helpers.

/** Internal async POST to KeePassHttp */
keepass._sendAsync = async function (request) {
	try {
		const r = JSON.stringify(request);
		page.debug("Request: {1}", r);
		const res = await fetch(keepass.getPluginUrl(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: r
		});
		const text = await res.text();
		page.debug("Response: {1} => {2}", res.status, text);
		return [res.status, text];
	} catch (e) {
		console.log("KeePassHttp (fetch): " + e);
		return [0, ""];
	}
};

/** Async version of database hash retrieval */
keepass._getDatabaseHashAsync = async function (tab, triggerUnlock) {
	const request = {
		"RequestType": "test-associate",
		"TriggerUnlock": (triggerUnlock === true) ? "true" : false
	};
	const oldDatabaseHash = keepass.databaseHash;
	const result = await keepass._sendAsync(request);
	if (keepass.checkStatus(result[0], tab)) {
		try {
			const response = JSON.parse(result[1] || "{}");
			keepass.setCurrentKeePassHttpVersion(response.Version);
			keepass.databaseHash = response.Hash || "no-hash";
		} catch {
			keepass.databaseHash = "no-hash";
		}
	} else {
		keepass.databaseHash = "no-hash";
	}
	if (oldDatabaseHash && oldDatabaseHash != keepass.databaseHash) {
		keepass.associated.value = false;
		keepass.associated.hash = null;
	}
	return keepass.databaseHash;
};

/** Async association test (full logic) */
keepass._testAssociationAsync = async function (tab, triggerUnlock) {
	await keepass._getDatabaseHashAsync(tab, triggerUnlock);
	if (keepass.isDatabaseClosed || !keepass.isKeePassHttpAvailable) return false;
	if (keepass.isAssociated()) return true;

	const request = {
		"RequestType": "test-associate",
		"TriggerUnlock": (triggerUnlock === true) ? "true" : false
	};
	const verifier = keepass.setVerifier(request);
	if (!verifier) {
		keepass.associated.value = false;
		keepass.associated.hash = null;
		return false;
	}
	const result = await keepass._sendAsync(request);
	const status = result[0];
	const response = result[1];

	if (keepass.checkStatus(status, tab)) {
		try {
			const r = JSON.parse(response);
			const id = verifier[0];
			const key = verifier[1];
			if (r.Version) {
				keepass.currentKeePassHttp = {
					"version": r.Version,
					"versionParsed": parseInt(r.Version.replace(/\./g, ""))
				};
			}
			keepass.isEncryptionKeyUnrecognized = false;
			if (!keepass.verifyResponse(r, key, id)) {
				const hash = r.Hash || 0;
				keepass.deleteKey(hash);
				keepass.isEncryptionKeyUnrecognized = true;
				console.log("Encryption key is not recognized!");
				if (tab && page.tabs[tab.id]) page.tabs[tab.id].errorMessage = "Encryption key is not recognized.";
				keepass.associated.value = false;
				keepass.associated.hash = null;
			} else if (!keepass.isAssociated()) {
				console.log("Association was not successful");
				if (tab && page.tabs[tab.id]) page.tabs[tab.id].errorMessage = "Association was not successful.";
			}
		} catch (e) {
			console.log("Association parse error", e);
		}
	}
	return keepass.isAssociated();
};

/** Ensure association (awaitable) */
keepass.ensureAssociation = async function (tab, triggerUnlock) {
	await keepass._testAssociationAsync(tab, triggerUnlock);
	return keepass.isAssociated();
};

keepass.addCredentials = function (callback, tab, username, password, url) {
	keepass.updateCredentials(callback, tab, null, username, password, url);
}

keepass.updateCredentials = async function (callback, tab, entryId, username, password, url) {
	page.debug("keepass.updateCredentials(callback, {1}, {2}, {3}, [password], {4})", tab.id, entryId, username, url);

	// unset error message
	page.tabs[tab.id].errorMessage = null;

	// is browser associated to keepass?
	if (!await keepass.ensureAssociation(tab)) {
		browserAction.showDefault(null, tab);
		callback("error");
		return;
	}

	// build request
	var request = {
		RequestType: "set-login"
	};
	var verifier = keepass.setVerifier(request);
	var id = verifier[0];
	var key = verifier[1];
	var iv = request.Nonce;


	request.Login = keepass.encrypt(cryptoHelpers.encode_utf8(username), key, iv);

	request.Password = keepass.encrypt(cryptoHelpers.encode_utf8(password), key, iv);
	request.Url = keepass.encrypt(url, key, iv);
	request.SubmitUrl = keepass.encrypt(url, key, iv);

	if (entryId) {
		request.Uuid = keepass.encrypt(entryId, key, iv);
	}

	// send request
	var result = await keepass._sendAsync(request);
	var status = result[0];
	var response = result[1];

	// verify response
	var code = "error";
	if (keepass.checkStatus(status, tab)) {
		var r = JSON.parse(response);
		if (keepass.verifyResponse(r, key, id)) {
			code = "success";
		}
		else {
			code = "error";
		}
	}

	callback(code);
}

keepass.retrieveCredentials = async function (callback, tab, url, submiturl, forceCallback, triggerUnlock) {
	page.debug("keepass.retrieveCredentials(callback, {1}, {2}, {3}, {4})", tab.id, url, submiturl, forceCallback);

	// unset error message
	page.tabs[tab.id].errorMessage = null;

	// is browser associated to keepass?
	if (!await keepass.ensureAssociation(tab, triggerUnlock)) {
		browserAction.showDefault(null, tab);
		if (forceCallback) {
			callback([]);
		}
		return;
	}

	// build request
	var request = {
		"RequestType": "get-logins",
		"SortSelection": "true",
		"TriggerUnlock": (triggerUnlock === true) ? "true" : "false"
	};
	var verifier = keepass.setVerifier(request);
	var id = verifier[0];
	var key = verifier[1];
	var iv = request.Nonce;
	request.Url = keepass.encrypt(url, key, iv);

	if (submiturl) {
		request.SubmitUrl = keepass.encrypt(submiturl, key, iv);
	}

	// send request
	var result = await keepass._sendAsync(request);
	var status = result[0];
	var response = result[1];
	var entries = [];

	// verify response
	if (keepass.checkStatus(status, tab)) {
		var r = JSON.parse(response);

		keepass.setCurrentKeePassHttpVersion(r.Version);

		if (keepass.verifyResponse(r, key, id)) {
			var rIv = r.Nonce;
			for (var i = 0; i < r.Entries.length; i++) {
				keepass.decryptEntry(r.Entries[i], key, rIv);
			}
			entries = r.Entries;
			keepass.updateLastUsed(keepass.databaseHash);
			if (entries.length == 0) {
				//questionmark-icon is not triggered, so we have to trigger for the normal symbol
				browserAction.showDefault(null, tab);
			}
		}
		else {
			console.log("RetrieveCredentials for " + url + " rejected");
		}
	}
	else {
		browserAction.showDefault(null, tab);
	}

	page.debug("keepass.retrieveCredentials() => entries.length = {1}", entries.length);

	callback(entries);
}

keepass.generatePassword = async function (callback, tab, forceCallback) {
	// is browser associated to keepass?
	if (!await keepass.ensureAssociation(tab)) {
		browserAction.showDefault(null, tab);
		if (forceCallback) {
			callback([]);
		}
		return;
	}

	if (keepass.currentKeePassHttp.versionParsed < 1400) {
		callback([]);
		return;
	}

	// build request
	var request = {
		RequestType: "generate-password"
	};
	var verifier = keepass.setVerifier(request);
	var id = verifier[0];
	var key = verifier[1];

	// send request
	var result = await keepass._sendAsync(request);
	var status = result[0];
	var response = result[1];
	var passwords = [];

	// verify response
	if (keepass.checkStatus(status, tab)) {
		var r = JSON.parse(response);

		keepass.setCurrentKeePassHttpVersion(r.Version);

		if (keepass.verifyResponse(r, key, id)) {
			var rIv = r.Nonce;

			if (r.Entries) {
				for (var i = 0; i < r.Entries.length; i++) {
					keepass.decryptEntry(r.Entries[i], key, rIv);
				}
				passwords = r.Entries;
				keepass.updateLastUsed(keepass.databaseHash);
			}
			else {
				console.log("No entries returned. Is KeePassHttp up-to-date?");
			}
		}
		else {
			console.log("GeneratePassword rejected");
		}
	}
	else {
		browserAction.showDefault(null, tab);
	}

	callback(passwords);
}

keepass.associate = async function (callback, tab) {
	if (keepass.isAssociated()) return;
	await keepass._getDatabaseHashAsync(tab);
	if (keepass.isDatabaseClosed || !keepass.isKeePassHttpAvailable) return;

	page.tabs[tab.id].errorMessage = null;

	const rawKey = cryptoHelpers.generateSharedKey(keepass.keySize * 2);
	const key = keepass.b64e(rawKey);
	const request = { RequestType: "associate", Key: key };
	keepass.setVerifier(request, key);
	const result = await keepass._sendAsync(request);

	if (keepass.checkStatus(result[0], tab)) {
		try {
			const r = JSON.parse(result[1]);
			if (r.Version) {
				keepass.currentKeePassHttp = {
					"version": r.Version,
					"versionParsed": parseInt(r.Version.replace(/\./g, ""))
				};
			}
			const id = r.Id;
			if (!keepass.verifyResponse(r, key)) {
				page.tabs[tab.id].errorMessage = "KeePass association failed, try again.";
			} else {
				keepass.setCryptoKey(id, key);
				keepass.associated.value = true;
				keepass.associated.hash = r.Hash || 0;
			}
		} catch (e) {
			page.tabs[tab.id].errorMessage = "Association parse failed.";
		}
		browserAction.show(callback, tab);
	}
}

keepass.isConfigured = function () {
	// Trigger async refresh if needed; return based on current cache.
	keepass.getDatabaseHash();
	return (keepass.databaseHash in keepass.keyRing);
};

// ADDED: restore missing helper used by event.js and other modules
keepass.isAssociated = function () {
	return !!(keepass.associated.value && keepass.associated.hash && keepass.associated.hash === keepass.databaseHash);
};

keepass.send = function (request) {
	// ORIGINAL synchronous keepass.send replaced (do not use directly)
	throw new Error("keepass.send (synchronous) removed. Use keepass._sendAsync via higher level functions.");
};

keepass.checkStatus = function (status, tab) {
	var success = (status >= 200 && status <= 299);
	keepass.isDatabaseClosed = false;
	keepass.isKeePassHttpAvailable = true;

	if (tab && page.tabs[tab.id]) {
		delete page.tabs[tab.id].errorMessage;
	}
	if (!success) {
		keepass.associated.value = false;
		keepass.associated.hash = null;
		if (tab && page.tabs[tab.id]) {
			page.tabs[tab.id].errorMessage = "Unknown error: " + status;
		}
		console.log("Error: " + status);
		if (status == 503) {
			keepass.isDatabaseClosed = true;
			console.log("KeePass database is not opened");
			if (tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "KeePass database is not opened.";
			}
		}
		else if (status == 0) {
			keepass.isKeePassHttpAvailable = false;
			console.log("Could not connect to keepass");
			if (tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "Is KeePassHttp installed and is KeePass running?";
			}
		}
	}

	page.debug("keepass.checkStatus({1}, [tabID]) => {2}", status, success);

	return success;
}

keepass.convertKeyToKeyRing = function () {
	if (keepass.keyId in localStorage && keepass.keyBody in localStorage && !("keyRing" in localStorage)) {
		var hash = keepass.getDatabaseHash(null);
		keepass.saveKey(hash, localStorage[keepass.keyId], localStorage[keepass.keyBody]);
	}

	if ("keyRing" in localStorage) {
		delete localStorage[keepass.keyId];
		delete localStorage[keepass.keyBody];
	}
}

keepass.saveKey = function (hash, id, key) {
	if (!(hash in keepass.keyRing)) {
		keepass.keyRing[hash] = {
			"id": id,
			"key": key,
			"icon": "blue",
			"created": new Date(),
			"last-used": new Date()
		}
	}
	else {
		keepass.keyRing[hash].id = id;
		keepass.keyRing[hash].key = key;
	}
	keepass._persistKeyRing();
}

keepass.updateLastUsed = function (hash) {
	if ((hash in keepass.keyRing)) {
		keepass.keyRing[hash].lastUsed = new Date();
		keepass._persistKeyRing();
	}
}

keepass.deleteKey = function (hash) {
	delete keepass.keyRing[hash];
	keepass._persistKeyRing();
}

keepass.getIconColor = function () {
	return ((keepass.databaseHash in keepass.keyRing) && keepass.keyRing[keepass.databaseHash].icon) ? keepass.keyRing[keepass.databaseHash].icon : "blue";
}

keepass.getPluginUrl = function () {
	if (page.settings.hostname && page.settings.port) {
		return "http://" + page.settings.hostname + ":" + page.settings.port;
	}
	return keepass.pluginUrlDefault;
}

keepass.setCurrentKeePassHttpVersion = function (version) {
	if (version) {
		keepass.currentKeePassHttp = {
			"version": version,
			"versionParsed": parseInt(version.replace(/\./g, ""))
		};
	}
}

keepass.keePassHttpUpdateAvailable = function () {
	if (page.settings.checkUpdateKeePassHttp && page.settings.checkUpdateKeePassHttp > 0) {
		var lastChecked = (keepass.latestKeePassHttp.lastChecked) ? new Date(keepass.latestKeePassHttp.lastChecked) : new Date("11/21/1986");
		var daysSinceLastCheck = Math.floor(((new Date()).getTime() - lastChecked.getTime()) / 86400000);
		if (daysSinceLastCheck >= page.settings.checkUpdateKeePassHttp) {
			keepass.checkForNewKeePassHttpVersion();
		}
	}

	return (keepass.currentKeePassHttp.versionParsed > 0 && keepass.currentKeePassHttp.versionParsed < keepass.latestKeePassHttp.versionParsed);
}

keepass.checkForNewKeePassHttpVersion = async function () {
	try {
		const res = await fetch(keepass.latestVersionUrl, { method: "GET" });
		const txt = await res.text();
		let $version = txt;
		if ($version.substring(0, 1) == ":") {
			$version = $version.substring(txt.indexOf("KeePassHttp") + 12);
			$version = $version.substring(0, $version.indexOf(":") - 1);
			keepass.latestKeePassHttp.version = $version;
			keepass.latestKeePassHttp.versionParsed = parseInt($version.replace(/\./g, ""));
		}
		keepass.latestKeePassHttp.lastChecked = new Date();
		chrome.storage.local.set({ latestKeePassHttp: JSON.stringify(keepass.latestKeePassHttp) });
	} catch (e) {
		console.log("Error (version check): " + e);
	}
}

/** Public synchronous-looking testAssociation (returns cached value, triggers async refresh) */
keepass.testAssociation = function (tab, triggerUnlock) {
	if (!keepass._assocCheckInProgress) {
		keepass._assocCheckInProgress = true;
		keepass._testAssociationAsync(tab, triggerUnlock).finally(() => { keepass._assocCheckInProgress = false; });
	}
	return keepass.isAssociated();
};

// New non-blocking wrapper replacing old getDatabaseHash:
keepass.getDatabaseHash = function (tab, triggerUnlock) {
	if (!keepass._dbHashRefreshInProgress) {
		keepass._dbHashRefreshInProgress = true;
		keepass._getDatabaseHashAsync(tab, triggerUnlock)
			.finally(() => { keepass._dbHashRefreshInProgress = false; });
	}
	return keepass.databaseHash;
};

keepass.setVerifier = function (request, inputKey) {
	var key = inputKey || null;
	var id = null;

	if (!key) {
		var info = keepass.getCryptoKey();
		if (info == null) {
			return null;
		}
		id = info[0];
		key = info[1];
	}

	if (id) {
		request.Id = id;
	}

	var iv = cryptoHelpers.generateSharedKey(keepass.keySize);
	request.Nonce = keepass.b64e(iv);

	//var decodedKey = keepass.b64d(key);
	request.Verifier = keepass.encrypt(request.Nonce, key, request.Nonce);

	return [id, key];
}

keepass.verifyResponse = function (response, key, id) {
	keepass.associated.value = response.Success;
	if (!response.Success) {
		keepass.associated.hash = null;
		return false;
	}

	keepass.associated.hash = keepass.databaseHash;

	var iv = response.Nonce;
	var value = keepass.decrypt(response.Verifier, key, iv, true);

	keepass.associated.value = (value == iv);

	if (id) {
		keepass.associated.value = (keepass.associated.value && id == response.Id);
	}

	keepass.associated.hash = (keepass.associated.value) ? keepass.databaseHash : null;

	return keepass.isAssociated();

}

keepass.b64e = function (d) {
	return btoa(keepass.to_s(d));
}

keepass.b64d = function (d) {
	return keepass.to_b(atob(d));
}

keepass.getCryptoKey = function () {
	if (!(keepass.databaseHash in keepass.keyRing)) {
		return null;
	}

	var id = keepass.keyRing[keepass.databaseHash].id;
	var key = null;

	if (id) {
		key = keepass.keyRing[keepass.databaseHash].key;
	}

	return key ? [id, key] : null;
}

keepass.setCryptoKey = function (id, key) {
	keepass.saveKey(keepass.databaseHash, id, key);
}

keepass.encrypt = function (input, key, iv) {
	return keepass.b64e(
		slowAES.encrypt(
			keepass.to_b(input),
			slowAES.modeOfOperation.CBC,
			keepass.b64d(key),
			keepass.b64d(iv)
		)
	);
}

keepass.decrypt = function (input, key, iv, toStr) {
	var output = slowAES.decrypt(
		keepass.b64d(input),
		slowAES.modeOfOperation.CBC,
		keepass.b64d(key),
		keepass.b64d(iv)
	);

	return toStr ? keepass.to_s(output) : output;
}

keepass.decryptEntry = function (e, key, iv) {
	e.Uuid = keepass.decrypt(e.Uuid, key, iv, true);
	e.Name = UTF8.decode(keepass.decrypt(e.Name, key, iv, true));
	e.Login = UTF8.decode(keepass.decrypt(e.Login, key, iv, true));
	e.Password = UTF8.decode(keepass.decrypt(e.Password, key, iv, true));

	if (e.StringFields) {
		for (var i = 0; i < e.StringFields.length; i++) {
			e.StringFields[i].Key = UTF8.decode(keepass.decrypt(e.StringFields[i].Key, key, iv, true))
			e.StringFields[i].Value = UTF8.decode(keepass.decrypt(e.StringFields[i].Value, key, iv, true))
		}
	}
}
