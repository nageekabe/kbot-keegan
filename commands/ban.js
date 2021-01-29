const { GuildMember, RichEmbed } = require('discord.js');
const Infractions = require('../utility/infractions');
const isMod = require('../utility/isMod');

module.exports = {
	id: 'ban',
	desc: 'Bans the specified user.',
	channels: 'guild',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let user = call.args[0];

		if (!user)
			return call.message.channel.send(`Please specify a user to ban. e.g. \`${call.client.prefix}ban @user For bullying me!\``);

		user = await call.message.guild.fetchMember(user.replace(/\D+/g, '')).catch(() => null);

		if (!user)
			return call.message.channel.send(`Please specify a valid user to ban. You must either mention them or supply their ID. e.g. \`${call.client.prefix}ban @user For bullying me!\``);

		let reason = call.cut.substring(call.args[0].length, 250).trim();

		if (user instanceof GuildMember &&
			call.message.author.id !== call.message.guild.ownerID &&
			user.id === call.message.guild.ownerID ||
			user.highestRole.position >= call.message.member.highestRole.position)
			return call.message.channel.send('You do not have permission to ban this user.');

		if (user instanceof GuildMember)
			user = user.user;

		call.message.guild.ban(user, `Banned by ${call.message.author.tag} for ${reason}`)
			.then(() => {
				let infractions = Infractions.infractionsOf(user, call.message.guild.id);

				infractions.addInfraction({
					type: 'ban',
					reason,
					date: Date.now(),
					committer: call.message.author.id
				});

				call.client.logChannel.send(
					new RichEmbed()
						.setColor('RED')
						.setAuthor(`${user.username} Banned`, user.displayAvatarURL)
						.addField('User Banned', user.toString())
						.addField('Banned By', call.message.author.toString())
						.addField('Reason', reason)
				).catch(() => {});

				call.message.channel.send(`Successfully banned ${user.tag}`);
			})
			.catch(() => call.message.channel.send(`Failed to ban ${user.tag}.`));
	}
};