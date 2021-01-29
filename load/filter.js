const { client: clientPG } = require('./database.js');
const escapeStringRegexp = require('escape-string-regexp');

function replaceBypasses(str) {
	return str
		.replace(/!|1/g, 'i')
		.replace(/\(\)|0|\[\]/g, 'o')
		.replace(/3/g, 'e')
		.replace(/4|@/g, 'a');
}

function safeBlock(str) { return str.replace(/`/g, '\u200b`\u200b'); }

let blacklist = [];

function manageMessage(message, newMessage) {
	if (newMessage)
		message = newMessage;

	if (message.author.bot || message.channel.type === 'dm')
		return;

	let content = replaceBypasses(message.content).replace(/[^\sa-zA-Z]/g, '').toLowerCase();
	let index;

	for (var word of blacklist) {
		word = word.toLowerCase();

		let wordIndex = content.indexOf(word);

		if (wordIndex !== -1) {
			index = wordIndex;

			break;
		}
	}

	if (index !== undefined) {
		message.delete();
		message.author.send(`The following message has been deleted because the bot detected bad words: \`\`\`${safeBlock(message.content).substring(0, 1000)}\`\`\`
The text that alerted the system: \`\`\`css\n${content.toLowerCase().replace(new RegExp(escapeStringRegexp(word), 'i'), `[${word}]`).substring(index - 10, (index + word.length) + 10).trim()}\`\`\``);
	}
}

module.exports = {
	id: 'filter',
	blacklist,
	exec: async (client) => {
		blacklist.push(...await clientPG.query('SELECT word FROM public.blacklist').then((res) => res.rows.map((row) => row.word)));

		client.on('message', (message) => {
			if (message.content && message.channel.messages.some((m) => {
				m.id !== message.id
						&& m.author.id === message.author.id
						&& m.content.toLowerCase() === message.content.toLowerCase()
						&& (message.createdTimestamp - m.createdTimestamp) <= 5000;
			}))
				return message.author.send('Please do not send duplicate messages so fast.');
		});
		client.on('message', manageMessage);
		client.on('messageUpdate', manageMessage);
	}
};