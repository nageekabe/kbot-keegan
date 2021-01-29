const { setTimeout, clearTimeout } = require('safe-timers');
const { client: clientPG } = require('./database');

module.exports = {
	id: 'mutes',
	mutes: [],
	exec: async function (client) {
		this.getMutes = function() {
			return clientPG.query('SELECT guild, "user", end_date FROM public.mutes').then((result) => result.rows);
		};

		this.addMute = async function(mute, add = false) {
			let existing = this.mutes.find(({ guild, user }) => guild === mute.guild && user === mute.user);

			if (existing) {
				clearTimeout(existing.timeout);

				await clientPG.query('UPDATE public.mutes SET end_date = $3 WHERE guild = $1 AND "user" = $2',
					[mute.guild, mute.user, mute.end_date]);
			}

			this.mutes.push(mute);

			if (add && !existing)
				await clientPG.query('INSERT INTO public.mutes (guild, "user", end_date) VALUES($1, $2, $3)', [mute.guild, mute.user, mute.end_date]);

			mute.timeout = setTimeout(this.removeMute.bind(null, mute), parseInt(mute.end_date) - Date.now());
		};

		this.removeMute = async function(mute) {
			clearTimeout(mute.timeout);

			await clientPG.query('DELETE FROM public.mutes WHERE guild = $1 AND "user" = $2 AND end_date = $3', [mute.guild, mute.user, mute.end_date]);

			let guild = client.guilds.get(mute.guild);

			if (!guild)
				return;

			let member = guild.member(mute.user);

			if (!member)
				return;

			member.removeRole(guild.roles.find(({ name }) => name.toLowerCase() === 'muted'));

			let index = module.exports.mutes.indexOf(module.exports.mutes.find(({ guild, user }) => guild === mute.guild && user === mute.user));
			if (index !== -1)
				module.exports.mutes.splice(index, 1);
		};

		for (let mute of await this.getMutes())
			this.addMute(mute);

		client.on('guildMemberAdd', (member) => {
			if (!this.mutes.some((mute) => mute.guild === member.guild.id && mute.user === member.id))
				return;

			member.addRole(member.guild.roles.find(({ name }) => name.toLowerCase() === 'muted'));
		});
	}
};
