const registerServiceWorker = async () => {
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register("sw.js");
			if (registration.installing) {
				console.log("Service worker installing");
			} else if (registration.waiting) {
				console.log("Service worker installed");
			} else if (registration.active) {
				console.log("Service worker active");
			}
		} catch (error) {
			console.error(`Registration failed with ${error}`);
		}
	}
};

registerServiceWorker();

let deferredPrompt;
a2hs.style.display = 'none';
github.style.display = 'block';

window.addEventListener('beforeinstallprompt', (e) => {
	e.preventDefault();
	deferredPrompt = e;
	a2hs.style.display = 'block';
	a2hs.addEventListener('click', () => {
		a2hs.style.display = 'none';
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === 'accepted') {
				console.log('User accepted the A2HS prompt');
			} else {
				console.log('User dismissed the A2HS prompt');
			}
			deferredPrompt = null;
		});
	});
});

const listSources = [];
const globalAddressList = [];
let hosts = '';

async function refreshSources() {
	try {
		let url = 'https://raw.githubusercontent.com/JeBance/StopAdwarePWA/gh-pages/servers.json';

		let response = await fetch(url);
		if (!response.ok) throw new Error('Failed to get sources list');

		let list = await response.json();
		if (list.length <= 0) throw new Error('Sources list is empty');

		let keys = Object.keys(list);
		for (let i = 0, l = keys.length; i < l; i++) {
			listSources.push(list[keys[i]]);
		}

		countSources.innerHTML = 'Известные источники: ' + list.length;
		countSources.setAttribute('style', 'color: green');
		buttonGenerate.removeAttribute('disabled');
	} catch(e) {
		countSources.innerHTML = 'Ошибка! Источники не обновлены.';
		countSources.setAttribute('style', 'color: #B22222');
		buttonGenerate.setAttribute('disabled', '');
		console.log(e);
	}
}

countSources.setAttribute('style', 'color: #B22222');
refreshSources();

async function downloadListFromSource(url = 'string') {
	try {
		let response = await fetch(url);
		if (!response.ok) throw new Error('Failed to get list from source ' + url);
		let list = await response.text();
		return list;
	} catch(e) {
		console.log(e);
		return false;
	}
}

async function parseListFromSource(list = 'string') {
	try {
		list = list.split('\n');
		let keys = Object.keys(list);
		for (let i = 0, l = keys.length; i < l; i++) {
			if (list[keys[i]].includes('127.0.0.1') === true) {
				globalAddressList.push((list[keys[i]].slice(10)).trim());
			} else if (list[keys[i]].includes('0.0.0.0') === true) {
				globalAddressList.push((list[keys[i]].slice(8)).trim());
			}
		}
	} catch(e) {
		console.log(e);
	}
}

async function generateFile() {
	let keys = Object.keys(globalAddressList);
	for (let i = 0, l = keys.length; i < l; i++) {
		hosts += ('0.0.0.0 ' + globalAddressList[keys[i]] + "\n");
	}
}

async function wrap(elem) {
	switch(elem.innerHTML) {
		case 'Генерация файла':
			buttonGenerate.id = 'buttonDownload';
			buttonDownload.innerHTML = 'Скачать';
			buttonDownload.setAttribute('disabled', '');

			let p = document.createElement('p');
			p.textContent = 'Обработано источников: 0';
			sources.append(p);

			let q = document.createElement('p');
			q.textContent = 'Всего адресов: 0';
			sources.append(q);

			let keys = Object.keys(listSources);
			for (let i = 0, l = keys.length; i < l; i++) {
				console.log(listSources[keys[i]]);
				var list = await downloadListFromSource(listSources[keys[i]]);
				if (list) await parseListFromSource(list);
				p.textContent = 'Обработано источников: ' + (i + 1);
				q.textContent = 'Всего адресов: ' + globalAddressList.length;
			}

			await generateFile();
			buttonDownload.removeAttribute('disabled');
			break;

		case 'Скачать':
			let blob = new Blob([hosts], {type: 'text/plain'});
			let link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'hosts.txt';
			link.click();
			URL.revokeObjectURL(link.href);
			break;

		default:
			break;
	}
}
