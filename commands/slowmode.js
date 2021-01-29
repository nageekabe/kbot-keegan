const isMod = require('../utility/isMod.js');
const parseTime = require('../utility/parseTime.js');
const { Collection } = require('discord.js');

let slowed = new Collection();

module.exports = {
	id: 'slowmode',
	channels: 'guild',
	desc: 'Sets the slowmode.',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let length = call.args[0];

		if (!length)
			return call.message.channel.send(`Please rerun the command with a valid slowmode interval. e.g. \`${call.client.prefix}slowmode 1m 1h\``);

		let duration = call.args[1];

		length = length.toLowerCase() === '0s' || length.toLowerCase() === '0' ? 0 : parseTime(length);

		if (!length && length !== 0)
			return call.message.channel.send(`Please rerun the command with a valid slowmode interval. e.g. \`${call.client.prefix}slowmode 1m 1h\``);

		if (length > 21600000 || length < 0)
			return call.message.channel.send(`Please rerun the command and specify a valid slowmode duration, between 0 and 6 hours. Specify none at all for an indefinite slowmode. e.g. \`${call.client.prefix}slowmode 1m 1h\``);

		duration = duration ? parseTime(duration) : 0;

		call.message.channel.setRateLimitPerUser(length / 1000).then(() => {
			call.message.channel.send('Successfully changed the slowmode for this channel.');

			let timeout = slowed.get(call.message.channel.id);

			if (timeout)
				clearTimeout(timeout);

			if (length > 0 && duration > 0)
				slowed.set(call.message.channel.id, call.client.setTimeout(() => call.message.channel.setRateLimitPerUser(0), duration));
		}, () => call.message.channel.send('Could not change the slowmode for this channel.'));
	}
};
