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

function refreshSources() {
	let requestURL = 'https://raw.githubusercontent.com/JeBance/StopAdwarePWA/gh-pages/servers.json';
	let request = new XMLHttpRequest();
	request.open('GET', requestURL);
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		let response = request.response;
		//console.log(response);
		//console.log(response.length);
		if (response.length > 0) {
			countSources.innerHTML = 'Известные источники: ' + response.length;
			countSources.setAttribute('style', 'color: green');
			buttonGenerate.removeAttribute('disabled');
		}
		let keys = Object.keys(response);
		//console.log(keys);
		let result = '';
		for (let i = 0, l = keys.length; i < l; i++) {
			listSources.push(response[keys[i]]);
		}
		return listSources;
	}
	request.onerror = function() {
		countSources.innerHTML = 'Ошибка! Источники не обновлены.';
		countSources.setAttribute('style', 'color: #B22222');
		buttonGenerate.setAttribute('disabled', '');
		console.log('** An error occurred during the transaction');
	}
}

let progressSource = new Object();

progressSource.loading = function(id, progress, link) {
	progressSource.id = 'progressSource-' + id;
	if (progress < 100) {
		progressSource.style.color = 'red';
	} else {
		progressSource.style.color = 'green';
	}
}

async function downloadSources(requestURL) {
	try {
		let checkURL = new Promise((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open('GET', requestURL);
			request.responseType = 'text';
			request.send();
			request.onload = (event) => {
				if (request.status != 200) {
					reject(`Error ${request.status}: ${request.statusText}`);
				} else {
					console.log(`Done! Received ${event.loaded} bytes`);
					let response = request.response;
					if (response.length > 0) resolve(response);
				}
			}
			request.onerror = () => {
				reject('Error!');
			}
			request.onprogress = (event) => {
				if (event.lengthComputable) {
					console.log(`Received ${event.loaded} of ${event.total} bytes`);
				} else {
					console.log(`Received ${event.loaded} bytes`);
				}
			};
		});

		await checkURL
			.then((response) => {
			//	parseSources(response);
				let adrList = response.split('\n');
				let keys = Object.keys(adrList);
				for (let i = 0, l = keys.length; i < l; i++) {
					if (adrList[keys[i]].includes('127.0.0.1') == true) {
						globalAddressList.push(adrList[keys[i]].slice(10));
					} else if (adrList[keys[i]].includes('0.0.0.0') == true) {
						globalAddressList.push(adrList[keys[i]].slice(8));
					}
				}
			//	console.log(globalAddressList);
			})
			.catch((error) => console.error(`${error}`));
	} catch(e) {
		console.log('Err:', requestURL);
	}
}

function parseSources(text) {
	let adrList = text.split('\n');
	let keys = Object.keys(adrList);
	for (let i = 0, l = keys.length; i < l; i++) {
		if (adrList[keys[i]].includes('127.0.0.1') == true) {
			globalAddressList.push(adrList[keys[i]].slice(10));
		} else if (adrList[keys[i]].includes('0.0.0.0') == true) {
			globalAddressList.push(adrList[keys[i]].slice(8));
		}
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
		case 'Обновить источники':
			refreshSources();
			break;

		case 'Генерация файла':
			buttonRefresh.remove();
			buttonGenerate.id = 'buttonDownload';
			buttonDownload.innerHTML = 'Скачать';
			buttonDownload.setAttribute('disabled', '');
			let p = document.createElement('p');
			p.textContent = 'Обработано: 0';
			sources.append(p);
			let keys = Object.keys(listSources);
			for (let i = 0, l = keys.length; i < l; i++) {
//			for (let i = 0, l = 4; i < l; i++) {
				console.log(listSources[keys[i]]);
				await downloadSources(listSources[keys[i]]);
				p.textContent = 'Обработано: ' + (i + 1);
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

countSources.setAttribute('style', 'color: #B22222');
buttonGenerate.setAttribute('disabled', '');

