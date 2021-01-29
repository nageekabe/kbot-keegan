const Discord = require('discord.js');

/**
 * Names of moderator roles.
 */
const MOD_ROLES = ['MOD', 'MODS', 'MODERATOR', 'MODERATORS', 'ADMIN', 'ADMINS', 'ADMINISTRATOR', 'ADMINISTRATORS'];
/**
 * Moderator-only permissions.
 * @type {Discord.PermissionResolvable[]}
 */
const MOD_PERMISSIONS = ['ADMINISTRATOR'];

/**
 * Checks if a member is considered a moderator.
 * @param {Discord.GuildMember} member
 * @throws {TypeError} If `member` is not a GuildMember.
 * @returns {boolean}
 * @requires discord.js
 */
function isMod(member) {
	if (!(member instanceof Discord.GuildMember))
		throw new TypeError('Member must be a GuildMember object.');

	return MOD_PERMISSIONS.some((permission) => member.hasPermission(permission)) ||
		MOD_ROLES.some((role) => member.roles.some(({ name }) => name.toUpperCase() === role));
}

module.exports = isMod;
