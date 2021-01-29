const { Message } = require('discord.js');

module.exports = {
	id: 'sudo',
	desc: 'Makes the bot think the user sent the message (with the content specified) to the current channel.',
	exec: async (call) => {

		let author = call.client.users.get((call.args[0] || '').replace(/\D+/g, ''));

		if (!author)
			return call.message.channel.send(`Invalid user to sudo. e.g. \`${call.client.prefix || '!'}sudo @user ${call.client.prefix || '!'}ping\``);

		let content = call.message.content.substring(call.prefixUsed.length).trim().substring(5 + call.args[0].length).trim();

		if (!content)
			return call.message.channel.send(`Invalid content. e.g. \`${call.client.prefix || '!'}sudo @user ${call.client.prefix || '!'}ping\``);

		await call.message.guild.fetchMember(author);

		call.client.emit('message', new Message(call.message.channel, {
			content,
			author,
			pinned: false,
			tts: false,
			embeds: [],
			attachments: [],
			timestamp: Date.now()
		}, call.client));
	}
};