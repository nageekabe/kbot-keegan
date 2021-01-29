const { RichEmbed } = require('discord.js');

const LOG_CHANNEL = '7115128181843558524';

function split(str, amount) {
	let matches = [];
	let match = '';

	for (let char of str) {
		match += char;

		if (match.length === amount) {
			matches.push(match);

			match = '';
		}
	}

	if (match !== '')
		matches.push(match);

	return matches;
}

module.exports = {
	id: 'logs',
	exec: (client) => {
		client.logChannel = client.channels.get(LOG_CHANNEL);

		client
			.on('messageDelete', (message) => {
				if (message.author.bot || message.channel.type === 'dm')
					return;

				let embed = new RichEmbed()
					.setColor('RED')
					.setAuthor(message.author.tag, message.author.displayAvatarURL)
					.setTitle('Message Delete')
					.setDescription(`In: ${message.channel}\`\`\`${message.content.replace(/``/g, '`\u200b`')}\`\`\``)
					.setFooter(`ID: ${message.id}`)
					.setTimestamp();

				if (message.attachments.size)
					embed.addField('Attachments', message.attachments.map((a) => `[${a.filename.substring(0, 32)}](${a.url})`).join('\n'));

				client.logChannel.send(embed);
			})
			.on('messageUpdate', (oldMessage, newMessage) => {
				if (newMessage.author.bot || newMessage.channel.type === 'dm' || oldMessage.content === newMessage.content)
					return;

				let embed = new RichEmbed()
					.setColor('ORANGE')
					.setAuthor(newMessage.author.tag, newMessage.author.displayAvatarURL)
					.setTitle('Message Edit')
					.setDescription(`In: ${newMessage.channel}`)
					.setFooter(`ID: ${newMessage.id}`)
					.setTimestamp();

				let oldContent = split(oldMessage.content, 1018);

				for (let i = 0; i < oldContent.length; ++i)
					embed.addField(i === 0 ? 'Old Content' : '\u200b', `\`\`\`${oldContent[i] || '\u200b'}\`\`\``);

				let newContent = split(newMessage.content, 1018);

				for (let i = 0; i < newContent.length; ++i)
					embed.addField(i === 0 ? 'New Content' : '\u200b', `\`\`\`${newContent[i] || '\u200b'}\`\`\``);

				client.logChannel.send(embed);
			});
	}
};