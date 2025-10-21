document.addEventListener('DOMContentLoaded', () => {
	const global = chrome.extension.getBackgroundPage();
	chrome.tabs.getSelected(null, tab => {
		if (!tab) return;
		const data = global.page.tabs[tab.id].loginList;
		const ul = document.getElementById("login-list");
		if (!data || !data.logins) return;
		for (let i = 0; i < data.logins.length; i++) {
			const li = document.createElement("li");
			const a = document.createElement("a");
			a.textContent = data.logins[i].Login + " (" + data.logins[i].Name + ")";
			a.dataset.url = data.url.replace(/:\/\//g, "://" + data.logins[i].Login + ":" + data.logins[i].Password + "@");
			a.href = "#";
			a.addEventListener('click', ev => {
				ev.preventDefault();
				const newUrl = ev.currentTarget.dataset.url;
				chrome.tabs.update(tab.id, { url: newUrl });
				close();
			});
			li.appendChild(a);
			ul.appendChild(li);
		}
	});
});