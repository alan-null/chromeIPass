var _settings = {};
chrome.storage.local.get(['settings'], d => {
	try { _settings = d.settings ? JSON.parse(d.settings) : {}; } catch (_) { _settings = {}; }
});

function updateAvailableResponse(available) {
	const updateAvailableElement = document.getElementById('update-available');
	if (!updateAvailableElement) return;
	updateAvailableElement.style.display = available ? 'block' : 'none';
}

function initSettings() {
	const btnOptions = document.getElementById('btn-options');
	if (btnOptions) {
		btnOptions.addEventListener('click', () => {
			close();
			chrome.tabs.create({ url: "../options/options.html" });
		});
	}
	const btnChoose = document.getElementById('btn-choose-credential-fields');
	if (btnChoose) {
		btnChoose.addEventListener('click', () => {
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
				if (tabs && tabs[0]) {
					chrome.tabs.sendMessage(tabs[0].id, { action: "choose_credential_fields" });
				}
				close();
			});
		});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	initSettings();
	chrome.runtime.sendMessage({
		action: "update_available_keepasshttp"
	}, updateAvailableResponse);
});
