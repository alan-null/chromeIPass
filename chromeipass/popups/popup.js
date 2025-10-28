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

	// Plugin unreachable
	if (!r.keePassHttpAvailable) {
		setHTML('error-message', r.error || 'Cannot reach KeePassHttp. Is KeePass running?');
		show('error-encountered');
		return;
	}

	// Database closed
	if (r.databaseClosed) {
		setHTML('error-message', r.error || 'KeePass database is closed. Open it and reload status.');
		show('error-encountered');
		return;
	}

	// Not configured (no key stored for current hash)
	if (!r.configured) {
		show('not-configured');
		return;
	}

	// Key mismatch / encryption key lost
	if (r.encryptionKeyUnrecognized) {
		show('need-reconfigure');
		setHTML('need-reconfigure-message', r.error || 'Encryption key not recognized. Please re-associate.');
		return;
	}

	// Configured but not yet associated this session
	if (!r.associated) {
		show('configured-not-associated');
		setHTML('unassociated-identifier', r.identifier);
		return;
	}

	// Any explicit error after association
	if (typeof r.error !== 'undefined' && r.error) {
		show('error-encountered');
		setHTML('error-message', r.error);
		return;
	}

	// Success
	show('configured-and-associated');
	setHTML('associated-identifier', r.identifier || '(unknown)');
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