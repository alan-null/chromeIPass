function $(selector) {
	// If no CSS prefix and no spaces/punctuation, treat as raw id
	if (selector && !/[#.\s>\[:]/.test(selector)) {
		return document.getElementById(selector);
	}
	return document.querySelector(selector);
}

function hide(id) {
	const el = $(id);
	if (el) el.style.display = 'none';
}

function show(id) {
	const el = $(id);
	if (el) el.style.display = '';
}

function setHTML(id, html) {
	const el = $(id);
	if (el) el.innerHTML = html;
}

function status_response(r) {
	hide('initial-state');
	hide('error-encountered');
	hide('need-reconfigure');
	hide('not-configured');
	hide('configured-and-associated');
	hide('configured-not-associated');


	if (!r.keePassHttpAvailable || r.databaseClosed) {
		setHTML('error-message', r.error);
		show('error-encountered');
	} else if (!r.configured) {
		show('not-configured');
	} else if (r.encryptionKeyUnrecognized) {
		show('need-reconfigure');
		setHTML('need-reconfigure-message', r.error);
	} else if (!r.associated) {
		show('need-reconfigure');
		setHTML('need-reconfigure-message', r.error);
	} else if (typeof r.error !== 'undefined') {
		show('error-encountered');
		setHTML('error-message', r.error);
	} else {
		show('configured-and-associated');
		setHTML('associated-identifier', r.identifier);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const connectBtn = $('connect-button');
	if (connectBtn) {
		connectBtn.addEventListener('click', () => {
			chrome.runtime.sendMessage({ action: "associate" });
			window.close();
		});
	}

	const reconnectBtn = $('reconnect-button');
	if (reconnectBtn) {
		reconnectBtn.addEventListener('click', () => {
			chrome.runtime.sendMessage({ action: "associate" });
			window.close();
		});
	}

	const reloadBtn = $('reload-status-button');
	if (reloadBtn) {
		reloadBtn.addEventListener('click', () => {
			chrome.runtime.sendMessage({ action: "get_status" }, status_response);
		});
	}

	const redetectBtn = $('redetect-fields-button');
	if (redetectBtn) {
		redetectBtn.addEventListener('click', () => {
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
				if (tabs && tabs[0]) {
					chrome.tabs.sendMessage(tabs[0].id, { action: "redetect_fields" });
				}
			});
		});
	}

	chrome.runtime.sendMessage({ action: "get_status" }, status_response);
});