const isMod = require('../utility/isMod');
const sendPaged = require('../utility/sendPaged');
const Infractions = require('../utility/infractions');
const { RichEmbed } = require('discord.js');

const CLEAR_TYPES = ['ban', 'mute', 'kick', 'softban', 'warn', 'all'];

function clearInfractions(call, infractions, filter) {
	infractions.clearInfractions(filter.toLowerCase()).then(() => {
		call.message.channel.send(`Successfully cleared ${filter} infractions from the user.`);
	}, (exc) => {
		console.warn(exc.stack);
		call.message.channel.send(`Failed to clear ${filter} infractions from the user.`);
	});
}

async function asyncMap(arr, func) {
	let newArr = [];
	let i = 0;

	for (let val of arr)
		newArr.push(await func(val, i++));

	return newArr;
}

function pastTenseFilter(filter) {
	return `${filter.endsWith('ban') ? `${filter}n` : filter === 'mute' ? 'mut' : filter}ed`;
}

module.exports = {
	id: 'infractions',
	aliases: ['warnings'],
	desc: 'Shows you the false actions a user has committed.',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to use this command.');

		let option = call.args[0];

		if (!option)
			return call.message.channel.send(`Invalid option. Please specify a user to view infractions on like \`${call.client.prefix}infractions user\`, \`${call.client.prefix}infractions remove user 1\` or \`${call.client.prefix}infractions clear user <type>\`.`);

		let user;

		if (['remove', 'clear'].includes(option.toLowerCase()))
			user = call.args[1];
		else
			user = option;

		if (!user)
			return call.message.channel.send(`Please rerun the command specify a user to view/clear/remove infractions on like \`${call.client.prefix}infractions user\`, \`${call.client.prefix}infractions remove user 1\` or \`${call.client.prefix}infractions clear user <type>\`.`);

		user = call.message.guild.members.find((m) => m.displayName.toLowerCase().startsWith(user.toLowerCase())) ||
			await call.client.fetchUser((user.match(/\d+/) || [])[0]).catch(() => null);

		if (!user)
			return call.message.channel.send(`Please specify a valid user to view infractions on like \`${call.client.prefix}infractions user\`, or \`${call.client.prefix}infractions remove user 1\`.`);

		let infractions;

		user = user.user || user;
		infractions = Infractions.infractionsOf(user, call.message.guild.id);

		await infractions.ready;

		if (option === 'remove') {
			let id = call.args[2];

			if (!id || !(parseInt(id) - 1 in infractions.current))
				return call.message.channel.send(`Invalid ID. Please specify the id of the infraction seen in \`${call.client.prefix}infractions @user\`.`);

			infractions.removeInfraction(parseInt(id) - 1).then(() => {
				call.message.channel.send('Successfully removed infraction from the user.');
			}, (exc) => {
				console.warn(exc.stack);
				call.message.channel.send('Failed to remove infraction from the user.');
			});
		} else if (option === 'clear') {
			let filter = call.args[2];

			if (!CLEAR_TYPES.includes(filter && filter.toLowerCase()))
				return call.message.channel.send('Please specify a filter to define which infractions you wish to clear. Filter options: `ban`, `mute`, `kick`, `softban`, `warn` or `all`.');

			clearInfractions(call, infractions, filter);
		} else {
			let filter = call.args[1];

			if (!['ban', 'mute', 'kick', 'softban', 'warn', undefined].includes(filter && filter.toLowerCase()))
				return call.message.channel.send('Please specify a valid filter, or none at all. Filter options: `ban`, `mute`, `kick`, `softban` or `warn`.');

			filter = filter && filter.toLowerCase();

			let current = filter ? infractions.current.filter((i) => i.type === filter) : infractions.current;

			if (current.length === 0)
				return call.message.channel.send(`This user has never been ${filter ? pastTenseFilter(filter) : 'warned, muted, kicked or banned'} in this server by the bot.`);

			let embed = new RichEmbed()
				.setAuthor(`${user.username}'s Infractions`, user.displayAvatarURL)
				.setColor('BLUE');

			sendPaged(call, embed, { values: await asyncMap(current, async (i, index) => `**Infraction #${index + 1}**` +
				`\nID: \`${i.id}\`` +
				`\nType: \`${i.type}\`` +
				`\nReason: \`${typeof i.reason === 'string' ? i.reason.replace(/`/g, '').substring(0, 200) : 'None.'}\`` +
				`\nModerator: \`${await call.client.fetchUser(i.committer).then((u) => u.id === call.client.user.id ? 'Auto' : `${u.tag.replace(/`/g, '')} (${u.id})`)}\`` +
				`\nDate: \`${new Date(parseInt(i.date)).toString().substring(0, 15)}\``), valuesPerPage: 5, joinWith: '\n\n' });
		}
	}
};