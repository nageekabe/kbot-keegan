const sendPaged = require('../utility/sendPaged');
const Infractions = require('../utility/infractions');
const { RichEmbed } = require('discord.js');

async function asyncMap(arr, func) {
	let newArr = [];
	let i = 0;

	for (let val of arr)
		newArr.push(await func(val, i++));

	return newArr;
}

module.exports = {
	id: 'myinfractions',
	aliases: ['warnings'],
	desc: 'Shows your infractions.',
	exec: async (call) => {
		let infractions;

		infractions = call.message.author.infractions || Infractions.infractionsOf(call.message.author, call.message.guild.id);

		await infractions.ready;
		let current = infractions.current;

		if (current.length === 0)
			return call.message.channel.send('This user has never been warned, muted, kicked or banned in this server by the bot.');

		let embed = new RichEmbed()
			.setAuthor(`${call.message.author.username}'s Infringements`, call.message.author.displayAvatarURL)
			.setColor('GREEN');

		sendPaged(call, embed, {
			values: await asyncMap(current, async (i, index) => `**Infringement #${index + 1}**` +
				`\nID: \`${i.id}\`` +
				`\nType: \`${i.type}\`` +
				`\nReason: \`${typeof i.reason === 'string' && i.reason ? i.reason.replace(/`/g, '').substring(0, 200) : 'None.'}\`` +
				`\nCommitter: \`${await call.client.fetchUser(i.committer).then((u) => u.id === call.client.user.id ? 'Auto' : `${u.tag.replace(/`/g, '')} (${u.id})`)}\`` +
				`\nDate: \`${new Date(parseInt(i.date)).toString().substring(0, 15)}\``), valuesPerPage: 5, joinWith: '\n\n'
		});
	}
};