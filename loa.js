const { SlashCommandBuilder } = require('discord.js');
const STAFF_ROLE_ID = '(Your Staff Role ID)';
const LOA_ROLE_ID = '(Your LOA Role ID)';
     module.exports = {
	data: new SlashCommandBuilder()
	.setName('loa')
	.setDescription('Toggle Active LOA (Staff Only)'),
	async execute(interaction) {
	const member = interaction.member;
	if (!member.roles.cache.has(STAFF_ROLE_ID)) {
	return interaction.reply({
	content: 'You must be Vice City Staff to use this command.',
	ephemeral: true
	});
	}
	if (member.roles.cache.has(LOA_ROLE_ID)) {
	await member.roles.remove(LOA_ROLE_ID);
	return interaction.reply({
	content: '❌ You are **no longer on Active LOA**.',
	ephemeral: true
	});
	}
	await member.roles.add(LOA_ROLE_ID);
	return interaction.reply({
	content: '✅ You have been placed on **Active LOA**.',
	ephemeral: true
});
}
};