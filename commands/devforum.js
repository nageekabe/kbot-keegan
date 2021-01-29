const fetch = require('node-fetch');

const ALLOWED = ['oof', 'wow', 'help', 'pillow', 'lol', 'book', 'ok', 'and', 'why', 'yes'];
const DEVFORUM_FULL = '717783572748173343';
const DEVFORUM_NEW = '717783486714609750';

function getIDFromUsername(username) {
	return fetch(`https://api.roblox.com/users/get-by-username?username=${username}`)
		.then((res) => res.json())
		.then((json) => json.Id);
}

function generateCode() {
	let arr = [];

	for (let i = 0; i < 10; ++i)
		arr.push(ALLOWED[Math.floor(Math.random() * ALLOWED.length)]);

	return arr.join(' ');
}

function inStatusOrBio(user, code) {
	return fetch(`https://www.roblox.com/users/${user}/profile`)
		.then((request) => request.text())
		.then((page) => {
			return page.match(/data-statustext="?(.+?)"? (?=data-editstatusmaxlength)/)[1].trim().toLowerCase() === code ||
				page.match(/<span class="profile-about-content-text linkify" ng-non-bindable>(.+?)(?=<\/span>)/)[1].trim().toLowerCase() === code;
		});
}

module.exports = {
	id: 'devforum',
	desc: 'Gives the user the devforum role',
	channels: 'guild',
	exec: async (call) => {
		let roblox = await call.prompt('What account would you like to check the DevForum status of?',
			{ filter: (m) => getIDFromUsername(m.content), correct: 'Invalid input. Please retry with a valid roblox username.' })
			.then((m) => m.content);

		let robloxID = await getIDFromUsername(roblox);
		let code = generateCode();

		await call.message.channel.send('Please put the following code in your account bio or blurb. Then say `done`. To cancel the prompt, say `cancel`.');
		await call.prompt('```' + code + '```', {
			time: 300000,
			filter: async (m) => m.content.toLowerCase() === 'done' && await inStatusOrBio(robloxID, code),
			correct: (m) => m.content.toLowerCase() === 'done' ? m.channel.send('Failed to find the code in your status or bio. Please make sure you are directly copying and pasting the code') : null
		});

		fetch(`https://devforum.roblox.com/users/${roblox}.json`).then((res) => res.json()).then(async (res) => {
			if (!res || !res.user || !res.user.trust_level)
				return call.message.channel.send('You are not a devforum user, or your account is not public.');

			let trustLevel = res.user.trust_level;

			await call.message.member.addRole(trustLevel > 1 ? DEVFORUM_FULL : DEVFORUM_NEW);

			call.message.channel.send('Successfully given you your devforum role');
		}, () => call.message.channel.send('An error occurred. Please try again.'));
	}
};
