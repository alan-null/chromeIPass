document.addEventListener('DOMContentLoaded', () => {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		if (!tabs.length) return;
		const tab = tabs[0];
		chrome.runtime.sendMessage({ action: 'get_tab_information' }, info => {
			if (!info || !info.loginList) return;
			const logins = info.loginList;
			const ul = document.getElementById("login-list");
			for (let i = 0; i < logins.length; i++) {
				const display = (typeof logins[i] === 'string') ? logins[i]
					: (logins[i].Login || logins[i].Name || String(i));
				const li = document.createElement("li");
				const a = document.createElement("a");
				a.textContent = display;
				a.id = String(i);
				a.addEventListener('click', e => {
					const id = e.currentTarget.id;
					chrome.tabs.sendMessage(tab.id, {
						action: 'fill_user_pass_with_specific_login',
						id: id
					});
					close();
				});
				li.appendChild(a);
				ul.appendChild(li);
			}
		});
	});
});