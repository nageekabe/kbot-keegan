const { RichEmbed } = require('discord.js');

module.exports = {
	id: 'help',
	desc: 'Sends you a list of commands.',
	exec: async (call) => {
		call.message.author.send(
			new RichEmbed()
				.setTitle('Commands')
				.setDescription(call.commands.sort((a, b) => a.id.localeCompare(b.id)).map((c) => `\`,${c.id}\` ➜ ${c.desc || 'Description unknown'}\n`).join('\n'))
		).then(() => call.message.channel.type === 'text' ? call.message.channel.send('Sent you a list of commands in your direct messages.') : null,
			() => call.message.channel.send('Failed to send you help, please check your privacy settings and try again.'));
	}
};
