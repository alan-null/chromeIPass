var _tab;

function _initialize(tab) {
	_tab = tab || {};
	if (!_tab.credentials || typeof _tab.credentials !== 'object') {
		_tab.credentials = { username: "", password: "", url: "", usernameExists: false, list: [] };
	}
	if (!_tab.credentials.username) {
		_close();
		return;
	}

	var btnUpdate = document.getElementById('btn-update');
	if (_tab.credentials.list.length === 0 && btnUpdate) {
		btnUpdate.disabled = true;
		btnUpdate.classList.remove('b2c-btn-warning');
	}

	var url = _tab.credentials.url || "";
	if (url.length > 50) {
		url = url.substring(0, 50) + "...";
	}
	const infoUrlSpan = document.querySelector('.information-url span');
	if (infoUrlSpan) {
		infoUrlSpan.textContent = url;
	}
	const infoUserSpan = document.querySelector('.information-username span');
	if (infoUserSpan) {
		infoUserSpan.textContent = _tab.credentials.username;
	}

	const btnNew = document.getElementById('btn-new');
	if (btnNew) {
		btnNew.addEventListener('click', () => {
			chrome.runtime.sendMessage({
				action: 'add_credentials',
				args: [_tab.credentials.username, _tab.credentials.password, _tab.credentials.url]
			}, _verifyResult);
		});
	}

	if (btnUpdate) {
		btnUpdate.addEventListener('click', e => {
			e.preventDefault();
			if (_tab.credentials.list.length === 1) {
				chrome.runtime.sendMessage({
					action: 'update_credentials',
					args: [_tab.credentials.list[0].Uuid, _tab.credentials.username, _tab.credentials.password, _tab.credentials.url]
				}, _verifyResult);
			} else {
				const credRoot = document.querySelector('.credentials');
				if (!credRoot) {
					return;
				}

				const unameNewStrong = credRoot.querySelector('.username-new strong');
				const unameExistsStrong = credRoot.querySelector('.username-exists strong');
				if (unameNewStrong) {
					unameNewStrong.textContent = _tab.credentials.username;
				}
				if (unameExistsStrong) {
					unameExistsStrong.textContent = _tab.credentials.username;
				}

				const blockNew = credRoot.querySelector('.username-new');
				const blockExists = credRoot.querySelector('.username-exists');

				if (_tab.credentials.usernameExists) {
					if (blockNew) {
						blockNew.style.display = 'none';
					}
					if (blockExists) {
						blockExists.style.display = 'block';
					}
				} else {
					if (blockNew) {
						blockNew.style.display = 'block';
					}
					if (blockExists) {
						blockExists.style.display = 'none';
					}
				}

				const ul = document.getElementById('list');
				if (ul) {
					ul.innerHTML = '';
					for (let i = 0; i < _tab.credentials.list.length; i++) {
						const entry = _tab.credentials.list[i];
						const a = document.createElement('a');
						a.href = '#';
						a.textContent = entry.Login + " (" + entry.Name + ")";
						a.dataset.entryId = String(i);
						if (_tab.credentials.usernameExists && _tab.credentials.username === entry.Login) {
							a.style.fontWeight = 'bold';
						}
						a.addEventListener('click', ev => {
							ev.preventDefault();
							const idx = parseInt(ev.currentTarget.dataset.entryId, 10);
							chrome.runtime.sendMessage({
								action: 'update_credentials',
								args: [_tab.credentials.list[idx].Uuid, _tab.credentials.username, _tab.credentials.password, _tab.credentials.url]
							}, _verifyResult);
						});
						const li = document.createElement('li');
						li.appendChild(a);
						ul.appendChild(li);
					}
				}
				credRoot.style.display = 'block';
			}
		});
	}

	const btnDismiss = document.getElementById('btn-dismiss');
	if (btnDismiss) {
		btnDismiss.addEventListener('click', e => {
			e.preventDefault();
			_close();
		});
	}
}

function _connected_database(db) {
	const section = document.querySelector('.connected-database');
	const em = section && section.querySelector('em');
	if (!section) {
		return;
	}
	if (db.count > 1 && db.identifier) {
		if (em) {
			em.textContent = db.identifier;
		}
		section.style.display = 'block';
	} else {
		section.style.display = 'none';
	}
}

function _verifyResult(code) {
	if (code === "success") {
		_close();
	}
}

function _close() {
	chrome.runtime.sendMessage({ action: 'remove_credentials_from_tab_information' });
	chrome.runtime.sendMessage({ action: 'pop_stack' });
	close();
}

document.addEventListener('DOMContentLoaded', () => {
	chrome.runtime.sendMessage({
		action: 'stack_add',
		args: ["icon_remember_red_background_19x19.png", "popup_remember.html", 10, true, 0]
	});
	chrome.runtime.sendMessage({ action: 'get_tab_information' }, _initialize);
	chrome.runtime.sendMessage({ action: 'get_connected_database' }, _connected_database);
});