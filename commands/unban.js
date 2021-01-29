const { RichEmbed } = require('discord.js');
const isMod = require('../utility/isMod');

module.exports = {
	id: 'unban',
	channels: 'guild',
	desc: 'Unbans the specified user.',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let user = call.args[0];

		if (!user)
			return call.message.channel.send(`Please rerun the command with a user to unban. e.g. \`${call.client.prefix}unban @user appealed\``);

		let bannedUsers = await call.message.guild.fetchBans();

		user = bannedUsers.find(({ id, tag }) => user.includes(id) || tag.toLowerCase().startsWith(user.toLowerCase()));

		if (!user)
			return call.message.channel.send(`Please rerun the command with a valid user to unban. e.g. \`${call.client.prefix}unban @user appealed\``);

		let reason = call.args.slice(1).join(' ');

		call.message.guild.unban(user, reason).then((unbannedUser) => {
			call.message.channel.send(`Successfully unbanned ${unbannedUser.username}.`);

			call.message.guild.channels.find((m) => m.name === 'logs').send(
				new RichEmbed()
					.setColor('RED')
					.setAuthor(`${user.username} Unbanned`, user.displayAvatarURL)
					.addField('User Unbanned', user.toString())
					.addField('Unbanned By', call.message.author.toString())
					.addField('Reason', reason)
			).catch(() => {});
		}, () => call.message.reply(`Failed to unban ${user.username}.`));
	}
};
