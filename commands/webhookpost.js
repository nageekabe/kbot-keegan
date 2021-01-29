const isMod = require('../../utility/isMod');
const util = require('util');

const EXAMPLE = ' e.g. `%swebhookpost #channel [Role] I pinged you!`';

function e(call) { return util.format(EXAMPLE, call.client.prefix); }

module.exports = {
	id: 'webhookpost',
	desc: 'Posts to a channel using a webhook that looks like the poster.',
	channels: 'guild',
	exec: async (call) => {
		if (!isMod(call.message.member))
			return call.message.channel.send('You do not have permission to run this command.' + e(call));

		let channel = call.args[0];

		if (!/^<#\d+>$/.test(channel))
			return call.message.channel.send('Please rerun the command and mention a valid channel.' + e(call));

		channel = call.message.guild.channels.get(channel.match(/\d+/)[0]);

		if (!channel)
			return call.message.channel.send('Please rerun the command and mention a valid channel.' + e(call));

		let content = call.cut.substring(channel.id.length + 3);

		if (!content)
			return call.message.channel.send('Please rerun the command and supply content for the webhook to post.' + e(call));

		let webhook = await channel.createWebhook(call.message.member.displayName, call.message.author.displayAvatarURL)
			.catch((exc) => console.warn(exc.stack));

		if (!webhook)
			return call.message.channel.send('Something went wrong creating the webhook.');

		let roles = [];

		if (/\[(.*?)\]/g.test(content)) {
			for (let m of content.match(/\[(.*?)\]/g)) {
				m = m.replace(/[[\]]/g, '').toLowerCase();

				let role = call.message.guild.roles.find((r) => r.name.toLowerCase() === m);

				if (role)
					roles.push(await role.setMentionable(true));
			}
		}

		await webhook.send(content.replace(/\[(.*?)\]/g, (m) => {
			m = m.replace(/[[\]]/g, '').toLowerCase();

			let role = call.message.guild.roles.find((r) => r.name.toLowerCase() === m);

			return role ? `<@&${role.id}>` : m;
		}), { files: call.message.attachments.map((a) => a.url) })
			.then(() => call.message.channel.send('Sent the webhook post.'), () => call.message.channel.send('Something went wrong requesting the webhook to send the message.'));

		for (let role of roles)
			role.setMentionable(false);

		webhook.delete();
	}
};
