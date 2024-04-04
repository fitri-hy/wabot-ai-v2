require('dotenv').config();
const { HyWaBot, HytechMessages, HytechHandle, HytechHandleGemini } = require('wabot-ai');
const data = {
    phoneNumber: process.env.PHONE,
    sessionId: 'session',
    useStore: true,
};
const bot = new HyWaBot(data);

const ApiWiki = process.env.API_URL + '/wiki';
const ApiTranslate = process.env.API_URL + '/translate?text=';
const ApiMyIP = process.env.API_URL + '/ip';
const ApiSearch = process.env.API_URL + '/search?keyword=';
const ApiLocation = process.env.API_URL + '/location';

bot.start()
    .then(sock => {
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                let m = chatUpdate.messages[0];
                if (!m.message) return;
                const result = await HytechMessages(m);
                console.log('Processed message:', result);
                let cmd;
                if (result.chatsFrom === 'private') {
                    cmd = result.message;
                } else if (result.chatsFrom === 'group') {
                    cmd = result.participant ? result.participant.message : result.message;
                }
				
                if (cmd.startsWith(process.env.PREFIX_MENU)) {
                    sock.sendMessage(result.remoteJid, { text: `
█▀▀ █░█ █▄█
█▀░ █▀█ ░█░

*MENU BOT*

★ *${process.env.PREFIX_OPENAI}* = _Tanya Openai_
★ *${process.env.PREFIX_GEMINI}* = _Tanya Gemini
★ *${process.env.PREFIX_TRANSLATE_ID}* = _Terjemahan en-id_
★ *${process.env.PREFIX_TRANSLATE_EN}* = _Terjemahan id-en_
★ *${process.env.PREFIX_WIKI_ID}* = _Pencarian Wiki id_
★ *${process.env.PREFIX_WIKI_EN}* = _Pencarian Wiki en_
★ *${process.env.PREFIX_IP}* = _Alamat IP_
★ *${process.env.PREFIX_SEARCH}* = _Cari Konten Teratas_
` });
                }
                if (cmd.startsWith(process.env.PREFIX_OPENAI)) {
                    const messageToProcess = cmd.replace(process.env.PREFIX_OPENAI, '').trim();
                    const response = await HytechHandle(messageToProcess);
                    sock.sendMessage(result.remoteJid, { text: response });
                }
                if (cmd.startsWith(process.env.PREFIX_GEMINI)) {
                    const messageToProcess = cmd.replace(process.env.PREFIX_GEMINI, '').trim();
                    const response = await HytechHandleGemini(messageToProcess);
                    sock.sendMessage(result.remoteJid, { text: response });
                }
				if (cmd.startsWith(process.env.PREFIX_TRANSLATE_EN)) { // indonesia to english
					const messageToProcess = cmd.replace(process.env.PREFIX_TRANSLATE_EN, '').trim();
					const response = await fetch(`${ApiTranslate}${encodeURIComponent(messageToProcess)}&from=id&to=en`) // adjust language code
						.then((res) => res.json())
						.then((data) => data.translation);
					sock.sendMessage(result.remoteJid, {
						text: response
					});
				}
				if (cmd.startsWith(process.env.PREFIX_TRANSLATE_ID)) { // english to indonesia
					const messageToProcess = cmd.replace(process.env.PREFIX_TRANSLATE_ID, '').trim();
					const response = await fetch(`${ApiTranslate}${encodeURIComponent(messageToProcess)}&from=en&to=id`) // adjust language code
						.then((res) => res.json())
						.then((data) => data.translation);
					sock.sendMessage(result.remoteJid, {
						text: response
					});
				}
                if (cmd.startsWith(process.env.PREFIX_WIKI_ID)) { // indonesia language
				  const messageToProcess = cmd.replace(process.env.PREFIX_WIKI_ID, '').trim();
				  const searchTerm = encodeURIComponent(messageToProcess);
				  const lang = 'id'; // Bahasa Indonesia
				  
				  try {
					const response = await fetch(`${ApiWiki}/${searchTerm}/${lang}`);
					const data = await response.json();

					if (!data.title) {
					  sock.sendMessage(result.remoteJid, { text: 'Hasil tidak ditemukan, cobalah lebih spesifik.' });
					} else {
					  const title = data.title;
					  const extract = data.extract;

					  const resultText = `
Judul: ${title}

Deskripsi: ${extract}
					  `;

					  sock.sendMessage(result.remoteJid, { text: resultText });
					}
				  } catch (error) {
					console.error(error);
					sock.sendMessage(result.remoteJid, { text: 'An error occurred while fetching data.' });
				  }
				}
                if (cmd.startsWith(process.env.PREFIX_WIKI_EN)) { // english language
				  const messageToProcess = cmd.replace(process.env.PREFIX_WIKI_EN, '').trim();
				  const searchTerm = encodeURIComponent(messageToProcess);
				  const lang = 'en'; // english Indonesia
				  
				  try {
					const response = await fetch(`${ApiWiki}/${searchTerm}/${lang}`);
					const data = await response.json();

					if (!data.title) {
					  sock.sendMessage(result.remoteJid, { text: 'No results found, try to be more specific.' });
					} else {
					  const title = data.title;
					  const extract = data.extract;

					  const resultText = `
Title: ${title}

Description: ${extract}
					  `;

					  sock.sendMessage(result.remoteJid, { text: resultText });
					}
				  } catch (error) {
					console.error(error);
					sock.sendMessage(result.remoteJid, { text: 'An error occurred while fetching data.' });
				  }
				}
                if (cmd.startsWith(process.env.PREFIX_IP)) {
					try {
						const response = await fetch(`${ApiMyIP}`);
						const data = await response.json();

						if (!data.ip) {
							sock.sendMessage(result.remoteJid, { text: 'No results found, try to be more specific.' });
						} else {
							const ip = data.ip;
							let resultText = `IP Information:
IP Address: ${data.ip}
City: ${data.city}
Region: ${data.region}
Country: ${data.country}
Country Code: ${data.countryCode}
Timezone: ${data.timezone}
ISP: ${data.isp}
Latitude: ${data.latitude}
Longitude: ${data.longitude}
Browser: ${data.browser}
Connection Type: ${data.connectionType}
OS: ${data.os}
Resolution: width ${data.resolution.width} | height ${data.resolution.height}`;
							Object.keys(data).forEach(key => {
								if (!['ip', 'city', 'region', 'country', 'countryCode', 'timezone', 'isp', 'latitude', 'longitude', 'browser', 'connectionType', 'os', 'resolution'].includes(key)) {
									resultText += `\n${key.charAt(0).toUpperCase() + key.slice(1)}: ${data[key]}`;
								}
							});

							sock.sendMessage(result.remoteJid, { text: resultText });
						}
					} catch (error) {
						console.error(error);
						sock.sendMessage(result.remoteJid, { text: 'An error occurred while fetching data.' });
					}
				}
				if (cmd.startsWith(process.env.PREFIX_SEARCH)) {
					const messageToProcess = cmd.replace(process.env.PREFIX_SEARCH, '').trim();
					const searchTerm = encodeURIComponent(messageToProcess);
					try {
						const response = await fetch(`${ApiSearch}${searchTerm}`);
						const data = await response.json();
						
						if (data.results.length === 0) {
							sock.sendMessage(result.remoteJid, { text: 'No results found, try to be more specific.' });
						} else {
							let resultText = '';
							data.results.forEach((result, index) => {
								resultText += `${result.title}
Source: ${result.source}

`;
							});
							sock.sendMessage(result.remoteJid, { text: '*Pencarian Viral Teratas*' + '\n\n' + resultText });
						}
					} catch (error) {
						console.error(error);
						sock.sendMessage(result.remoteJid, { text: 'An error occurred while fetching data.' });
					}
				}
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    })
    .catch(error => {
        console.error('Error starting bot:', error);
    });
