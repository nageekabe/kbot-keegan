const { Client } = require('discord.js');
const handler = require('d.js-command-handler');
const util = require('util');
const fs = require('fs');
const token = process.env.BOT_TOKEN;

let loaders = util.promisify(fs.readdir)('./load').then((files) => files.map((n) => require(`./load/${n}`)), () => []);
let client = new Client({ disableEveryone: true });

client.ownerID = '432650511825633317';

client.on('ready', async () => {
	loaders = await loaders;

	for (let loader of loaders)
		if (typeof loader.exec === 'function')
			loader.exec(client);

	console.log(client.user.username + ' has successfully booted up.');
});

handler(__dirname + '/commands', client, { customPrefix: '/' });
handler.promptOptionsDefaults.correct = 'Invalid input. Please retry.';

client.login(token);
