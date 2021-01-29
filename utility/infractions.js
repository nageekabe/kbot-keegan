const { client } = require('../load/database');
const objects = [];

/**
 * @typedef InfractionObject
 * @property {'ban'|'mute'|'kick'|'softban'|'warn'} type The type of punishment the user received.
 * @property {?string} reason The reason supplied by the committer, null if no reason.
 * @property {string} committer The user id of the person who punished the user.
 * @property {?number} length If a mute, the length of the mute.
 * @property {?number} date The timestamp representing when the punishment was taken out.
 * @property {?number} id The incremental id of the infraction, limited per each guild
 */
class Infractions {
	static infractionsOf(member, guildID) {
		guildID = (guildID && guildID.id || guildID) || member.guild.id;

		return objects.find((inf) => inf.member.id === member.id && inf.guildID === guildID) || new Infractions(member, guildID);
	}

	/**
	 * Gets the total amount of infractions in the database.
	 * @returns {number} The count.
	 */
	static count() {
		return client.query('SELECT COUNT(*) FROM public.infractions')
			.then((result) => parseInt(result.rows[0].count));
	}

	/**
	 * Gets the all of the infractions in the database.
	 * @returns {InfractionObject[]} The infractions.
	 */
	static get() {
		return client.query('SELECT "user", "type", date, reason, "id", committer, "length" FROM public.infractions')
			.then((result) => result.rows);
	}

	/**
	 * Removes all of the infractions in the database.
	 * @returns {void}
	 */
	static remove() {
		return client.query('DELETE FROM public.infractions');
	}

	/**
	 * Gets the infractions of a specified user in the specified guild.
	 * @param {string} guildID The id of the guild the user was punished in.
	 * @param {string} userID The id of the user.
	 * @returns {InfractionObject[]} The infractions of the user.
	 */
	static getInfractions(guildID, userID) {
		return client.query('SELECT "type", reason, "length", "date", "id", committer FROM public.infractions WHERE guild = $1 AND "user" = $2',
			[guildID, userID]).then((result) => result.rows);
	}

	/**
	 * Adds an infraction to a user in the specified guild.
	 * @param {string} guildID The guild ID.
	 * @param {string} userID The user ID.
	 * @param {InfractionObject} infraction The infraction.
	 * @returns {Promise<void>}
	 */
	static addInfraction(guildID, userID, { type, reason, length, date, id, committer }) {
		return client.query(`INSERT INTO public.infractions (guild, "user", "type", reason, "length", "date", "id", committer)
			VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
		[guildID, userID, type, reason, length, date, id, committer]).then(() => null);
	}

	/**
	 * Removes a infraction from a user in the specified guild.
	 * @param {string} guildID The guild ID.
	 * @param {InfractionObject} infractionID The infraction's id.
	 * @returns {Promise<void>}
	 */
	static removeInfraction(guildID, infractionID) {
		return client.query(`DELETE FROM public.infractions
			WHERE guild = $1 AND "id" = $2`, [guildID, infractionID]).then(() => null);
	}

	/**
	 * Removes all infractions from a user in the specified guild.
	 * @param {string} guildID The guild ID.
	 * @param {string} userID The user ID.
	 * @returns {Promise<void>}
	 */
	static removeAllInfractions(guildID, userID, filter) {
		return client.query(`DELETE FROM public.infractions
			WHERE guild = $1 AND "user" = $2${filter && filter !== 'all' ? ` AND "type" = '${filter}'` : ''}`, [guildID, userID]).then(() => null);
	}

	/**
	 * Increments the latest id by one for the specified guild.
	 * @param {string} guildID The guild ID.
	 * @returns {voice}
	 */
	static incrementLastID(guildID) {
		client.query('UPDATE public.last_ids SET "id" = "id" + 1 WHERE guild = $1', [guildID]);

		Infractions.ids[guildID]++;

		for (let infraction of objects.filter((inf) => inf.guildID === guildID))
			infraction.lastID++;
	}

	/**
	 * Gets the current latest infraction id in the specified guild.
	 * @param {string} guildID The id of the guild where the current infraction number is needed.
	 * @returns {number} The latest infraction id, zero if no infractions in guild.
	 */
	static async lastID(guildID) {
		let result;

		if (guildID in Infractions.ids) {
			result = Infractions.ids[guildID];
		} else {
			result = await client.query('SELECT "id" FROM public.last_ids WHERE guild = $1', [guildID])
				.then((result) => result.rows[0] && result.rows[0].id);

			if (result == null) {
				result = 0;

				client.query('INSERT INTO public.last_ids (guild, "id") VALUES($1, $2)', [guildID, result]);
			}

			Infractions.ids[guildID] = result;
		}

		return result;
	}

	constructor(member, guildID) {
		this.member = member;
		this.guildID = guildID || member.guild.id;

		(this.member.user || this.member).infractions = this;

		// Promise resolving once the object is ready to be used. Resolves immediately if called again after already resolved.
		this.ready = new Promise(async (resolve) => {
			// Can be replaced with something else if more efficient method known.
			this.current = await Infractions.getInfractions(guildID, member.id);

			// Asynchronous function, only call once when member instance created.
			this.lastID = await Infractions.lastID(guildID);

			let oldUser = objects.findIndex((inf) => inf.member.id === member.id && inf.guildID === this.guildID);

			if (oldUser >= 0)
				objects.splice(oldUser, 1);

			objects.push(this);

			resolve();
		});
	}

	/**
	 * Adds an infraction to the database under the current user.
	 * @param {InfractionObject} inf The infraction to add to the database.
	 * @todo Fix syntax error (line 3): `...inf`
	 * @see .eslintignore
	 */
	async addInfraction(inf) {
		await this.ready;

		let object = { ...inf, target: this.member.id, date: Date.now(), id: this.lastID + 1 };

		this.member.client.emit('infractionAdded', object, this.guildID);

		return Infractions.addInfraction(this.guildID, this.member.id, object).then(() => {
			Infractions.incrementLastID(this.guildID);

			this.current.push(object);
		}, () => --this.lastID);
	}

	/**
	 * Removes an infraction from the database on the current user.
	 * @param {number} id The index in this.current of the desired infraction to remove.
	 * @returns {Promise<void>}
	 */
	async removeInfraction(id) {
		await this.ready;

		let infraction = this.current[id];

		if (!infraction)
			return Promise.reject();

		// Do not decrement database value of lastID.
		return Infractions.removeInfraction(this.guildID, parseInt(infraction.id)).then(() => {
			let index = this.current.findIndex((inf) => inf.id === infraction.id);

			if (index >= 0)
				this.current.splice(index, 1);
		});
	}

	/**
	 * Removes all infractions from the database under the current user.
	 * @returns {Promise<void>}
	 */
	async clearInfractions(filter) {
		await this.ready;

		// Do not decrement database value of lastID.
		return Infractions.removeAllInfractions(this.guildID, this.member.id, filter).then(() => {
			this.current.length = 0;
		});
	}
}

Infractions.ids = {};

module.exports = Infractions;