const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SUGGESTIONS_DIR = `(Your Suggestion Logs Path)`;
const SUGGESTION_CHANNEL = '(Your Suggestion Channel ID)';

const ROLE_PINGS = {
  dev: '(Development Role ID)',
  support: '(Support Role ID)',
  admin: '(Admin Role ID)'
};
if (!fs.existsSync(SUGGESTIONS_DIR)) fs.mkdirSync(SUGGESTIONS_DIR, { recursive: true });
module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(option =>
    option
    .setName('suggestiontype')
    .setDescription('Type of suggestion')
    .setRequired(true)
    .addChoices(
    { name: 'Development', value: 'dev' },
    { name: 'Support', value: 'support' },
    { name: 'Administration', value: 'admin' }
    )
    )
    .addStringOption(option =>
    option
    .setName('suggestion')
    .setDescription('Your suggestion')
    .setRequired(true)
    )
    .addBooleanOption(option =>
    option
    .setName('anonymous')
    .setDescription('Submit anonymously')
    .setRequired(true)
    ),
    async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const type = interaction.options.getString('suggestiontype');
    const suggestion = interaction.options.getString('suggestion');
    const anonymous = interaction.options.getBoolean('anonymous');
    const user = interaction.user;
    const timestamp = new Date().toISOString();
    const safeName = user.username.replace(/[^a-z0-9]/gi, '_');
    const fileName = `${user.id}_${safeName}.json`;
    const filePath = path.join(SUGGESTIONS_DIR, fileName);
    let userData = {
    userId: user.id,
    username: user.username,
    suggestions: []
    };
    if (fs.existsSync(filePath)) {
    userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    userData.suggestions.push({
    timestamp,
    type,
    suggestion,
    anonymous
    });
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
    const embed = new EmbedBuilder()
    .setTitle('📬 New Suggestion')
    .setColor(0x2b2d31)
    .addFields(
    { name: 'Type', value: type.toUpperCase(), inline: true },
    { name: 'Anonymous', value: anonymous ? 'Yes' : 'No', inline: true },
    { name: 'Suggestion', value: suggestion }
    )
    .setTimestamp();
    if (!anonymous) {
    embed.setFooter({
    text: `Submitted by ${user.username}`,
    iconURL: user.displayAvatarURL()
    });
    } else {
    embed.setFooter({ text: 'Submitted anonymously' });
    }
    const suggestionChannel = interaction.guild.channels.cache.get(SUGGESTION_CHANNEL);
    if (!suggestionChannel) {
    return interaction.editReply('❌ Suggestion channel not found.');
    }
    const rolePing = ROLE_PINGS[type] ? `<@&${ROLE_PINGS[type]}>` : '';
    await suggestionChannel.send({
    content: rolePing,
    embeds: [embed]
    });
    await interaction.editReply('✅ Your suggestion has been submitted.');
  }
};