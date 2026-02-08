const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const STAFF_ROLE_ID = '(Staff Role ID)';
const STRIKE_1 = '(Strike 1 Role ID)';
const STRIKE_2 = '(Strike 2 Role ID)';
const STRIKE_3 = '(Strike 3 Role ID)';
const LOG_CHANNEL_ID = '(Log Channel ID)';
const handledInteractions = new Set();
module.exports = {
	   data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Issue a strike to a user')
        .addUserOption(option =>
        option
        .setName('user')
        .setDescription('User to strike')
        .setRequired(true)
        )
        .addStringOption(option =>
        option
        .setName('reason')
        .setDescription('Reason for the strike')
        .setRequired(true)
        ),
        async execute(interaction) {
        if (handledInteractions.has(interaction.id)) return;
        handledInteractions.add(interaction.id);
        const member = interaction.member;
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
        });
        }
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
        return interaction.reply({
        content: '❌ User not found in this guild.',
        ephemeral: true
        });
        }
        let strikeLevel = 0;
        let roleToAdd = null;
        if (targetMember.roles.cache.has(STRIKE_3)) {
        return interaction.reply({
        content: '❌ This user already has Strike 3.',
        ephemeral: true
        });
        } else if (targetMember.roles.cache.has(STRIKE_2)) {
        roleToAdd = STRIKE_3;
        strikeLevel = 3;
        } else if (targetMember.roles.cache.has(STRIKE_1)) {
        roleToAdd = STRIKE_2;
        strikeLevel = 2;
        } else {
        roleToAdd = STRIKE_1;
        strikeLevel = 1;
        }
        await targetMember.roles.add(roleToAdd);
        const logEmbed = new EmbedBuilder()
        .setTitle('🚨 Strike Issued')
        .setColor(0xFF0000)
        .addFields(
        { name: 'User', value: `${targetUser.tag} (${targetUser.id})` },
        { name: 'Strike Level', value: `Strike ${strikeLevel}` },
        { name: 'Issued By', value: interaction.user.tag },
        { name: 'Reason', value: reason }
         )
         .setTimestamp();
        const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
        }
        return interaction.reply({
        content: `✅ **Strike ${strikeLevel}** issued to **${targetUser.tag}**.`,
        ephemeral: true
});
}
};