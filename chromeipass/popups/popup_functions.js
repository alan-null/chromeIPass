var $ = cIPJQ.noConflict(true);
var _settings = {};
chrome.storage.local.get(['settings'], d => {
	try { _settings = d.settings ? JSON.parse(d.settings) : {}; } catch(_) {}
});

function updateAvailableResponse(available) {
	if(available) {
		$("#update-available").show();
	}
	else {
		$("#update-available").hide();
	}
}

function initSettings() {
	$("#settings #btn-options").click(function() {
		close();
		chrome.tabs.create({
			url: "../options/options.html"
		})
	});

	$("#settings #btn-choose-credential-fields").click(function() {
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (tabs && tabs[0]) {
				chrome.tabs.sendMessage(tabs[0].id, { action: "choose_credential_fields" });
			}
			close();
		});
	});
}


$(function() {
	initSettings();

	chrome.runtime.sendMessage({
		action: "update_available_keepasshttp"
	}, updateAvailableResponse);
});
