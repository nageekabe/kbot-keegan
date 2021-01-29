const isMod = require('../utility/isMod.js');

const purgeFilters = {
	'(<@!?)?\\d{16,19}>?': (m, _, user) => m.author.id === user.replace(/\D+/g, '') ||
		m.author.tag.toLowerCase().startsWith(user.toLowerCase()),
	'\\d+': () => true,
	images: (m) => m.attachments.size > 0 && m.attachments.first().width,
	embeds: (m) => m.embeds.length > 0,
	includes: (m, word) => m.content.toLowerCase().includes(word.toLowerCase()),
	startswith: (m, word) => m.content.toLowerCase().startsWith(word.toLowerCase()),
	endswith: (m, word) => m.content.toLowerCase().endsWith(word.toLowerCase()),
	match: (m, content) => m.content.toLowerCase() === content.toLowerCase()
};

module.exports = {
	id: 'purge',
	aliases: ['prune'],
	channels: 'guild',
	desc: 'Clears messages in the channel.',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let filter = purgeFilters[Object.keys(purgeFilters).find((f) => new RegExp(f).test(call.args[0]))];

		if (!filter)
			return call.message.channel.send(`Please rerun the command with a valid filter option, options: \`${call.client.prefix}purge (#, <user> #, images #, embeds #, startswith <word> #, endswith <word> #, includes <word> #, match <word> #)\`.`);

		let option = call.args[0],
			option1 = call.args[1],
			option2 = call.args[2],
			amount = parseInt(option) || parseInt(option1) || parseInt(option2);

		if (!amount)
			return call.message.channel.send('Please rerun the command with a number representing the amount of messages to purge.');

		await call.message.delete();

		if (!call.message.channel.beingPurged) {
			let purged = 0;
			let attempts = 0;
			let lastMessage;

			call.message.channel.beingPurged = true;

			while (amount > 0 && attempts < 5) {
				let messages = await call.message.channel.fetchMessages({ limit: 100, before: lastMessage });
				messages = messages.filter((msg) => Date.now() - msg.createdTimestamp < 1209600000 && filter(msg, option1, option));

				if (messages.size === 0)
					break;

				lastMessage = messages.last().id;
				messages = messages.first(amount);

				if (!Array.isArray(messages))
					messages = [messages];

				await call.message.channel.bulkDelete(messages, true);

				purged += messages.length;
				amount -= messages.length;
				attempts++;
			}

			call.message.channel.beingPurged = false;

			return call.message.channel.send(`Successfully purged ${purged} message${purged > 1 ? 's' : ''}.`);
		} else {
			call.message.channel.send('Please wait until the current purge in this channel finishes.');
		}
	}
};