const { RichEmbed } = require('discord.js');
const isMod = require('../utility/isMod');
const Infractions = require('../utility/infractions');

module.exports = {
	id: 'kick',
	desc: 'Kicks the specified user.',
	channels: 'guild',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let member = call.args[0];

		if (!member)
			return call.message.channel.send(`Please specify a user to kick. e.g. \`${call.client.prefix}kick @user For bullying me!\``);

		member = call.message.guild.member((member.match(/\d+/) || [])[0]);

		if (!member)
			return call.message.channel.send(`Please specify a valid user to kick. You must either mention them or supply their ID. e.g. \`${call.client.prefix}kick @user For bullying me!\``);

		let reason = call.cut.substring(call.args[0].length, 250).trim();

		if (call.message.author.id !== call.message.guild.ownerID &&
			member.id === call.message.guild.ownerID ||
			member.highestRole.position >= call.message.member.highestRole.position)
			return call.message.channel.send('You do not have permission to kick this user.');

		member.kick(`Kicked by ${call.message.author.tag} for ${reason}`)
			.then(() => {
				let infractions = Infractions.infractionsOf(member, call.message.guild.id);

				infractions.addInfraction({
					type: 'kick',
					reason,
					date: Date.now(),
					committer: call.message.author.id
				});

				call.client.logChannel.send(
					new RichEmbed()
						.setColor('RED')
						.setAuthor(`${member.user.username} Kicked`, member.user.displayAvatarURL)
						.addField('User Kicked', member.user.toString())
						.addField('Kicked By', call.message.author.toString())
						.addField('Reason', reason)
				).catch(() => {});

				call.message.channel.send(`Successfully kicked ${member.user.tag}`);
			})
			.catch(() => call.message.channel.send(`Failed to kick ${member.user.tag}.`));
	}
};