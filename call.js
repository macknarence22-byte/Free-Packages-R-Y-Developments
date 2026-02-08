const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

    const PHONE_ROLE_ID = '(Your Phone Role ID)';
    module.exports = {
    data: new SlashCommandBuilder()
    .setName('call')
    .setDescription('Call another user')
    .addUserOption(option =>
    option
    .setName('user')
    .setDescription('User to call')
    .setRequired(true)
    ),
    async execute(interaction) {
    const caller = interaction.member;
    const target = interaction.options.getMember('user');
    if (!caller.roles.cache.has(PHONE_ROLE_ID)) {
    return interaction.reply({
    content: '❌ You do not have access to a phone.',
    ephemeral: true
    });
    }
    if (!target || !target.roles.cache.has(PHONE_ROLE_ID)) {
    return interaction.reply({
    content: '❌ That user does not have a phone.',
    ephemeral: true
    });
    }
    if (target.user.bot) {
    return interaction.reply({
    content: '❌ You cannot call bots.',
    ephemeral: true
    });
    }
    let callerOriginalVC = null;
    let targetOriginalVC = null;
    let callActive = false;
    let cleanedUp = false;
    const existingCalls = interaction.guild.channels.cache.filter(c =>
    c.type === ChannelType.GuildVoice &&
    c.name.startsWith('📞 phone-call')
    ).size;
    const callChannel = await interaction.guild.channels.create({
    name: `📞 phone-call-${existingCalls + 1}`,
    type: ChannelType.GuildVoice,
    permissionOverwrites: [
    { id: interaction.guild.id, deny: ['ViewChannel'] },
    { id: caller.id, allow: ['ViewChannel', 'Connect', 'MoveMembers'] },
    { id: target.id, allow: ['ViewChannel', 'Connect', 'MoveMembers'] }
    ]
    });
    const embed = new EmbedBuilder()
    .setTitle('📱 Incoming Call')
    .setDescription(`${caller} is calling you.`)
    .setFooter({ text: 'Expires in 2 minutes' })
    .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('accept')
    .setLabel('Accept Call')
    .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
    .setCustomId('decline')
    .setLabel('Decline Call')
    .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
    .setCustomId('ignore')
    .setLabel('Ignore')
    .setStyle(ButtonStyle.Secondary)
    );
    const panel = await interaction.reply({
    content: `${target}`,
    embeds: [embed],
    components: [row],
    fetchReply: true
    });
    const collector = panel.createMessageComponentCollector({ time: 120000 });
    const cleanupCall = async (title) => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (caller.voice.channel?.id === callChannel.id && callerOriginalVC) {
    await caller.voice.setChannel(callerOriginalVC).catch(() => {});
      }
    if (target.voice.channel?.id === callChannel.id && targetOriginalVC) {
    await target.voice.setChannel(targetOriginalVC).catch(() => {});
      }
       await new Promise(r => setTimeout(r, 500));
    embed.setTitle(title).setDescription(null).setFooter(null);
    await panel.edit({ embeds: [embed], components: [] }).catch(() => {});
    await callChannel.delete().catch(() => {});
    interaction.client.off('voiceStateUpdate', voiceHandler);
    };
    collector.on('collect', async i => {
    if (![caller.id, target.id].includes(i.user.id)) {
    return i.reply({ content: '❌ Not your call.', ephemeral: true });
    }
    if (i.customId === 'accept' && i.user.id === target.id) {
    callActive = true;
    callerOriginalVC = caller.voice.channel;
    targetOriginalVC = target.voice.channel;
    if (callerOriginalVC) {
    await caller.voice.setChannel(callChannel).catch(() => {});
    }
    if (targetOriginalVC) {
    await target.voice.setChannel(callChannel).catch(() => {});
    }
    .setCustomId('hangup')
    .setLabel('Hang Up')
    .setStyle(ButtonStyle.Danger)
    );
    embed
    .setTitle('📞 Call Active')
    .setDescription(`Call between ${caller} and ${target}`);
    await i.update({ embeds: [embed], components: [hangupRow] });
    }
    if (i.customId === 'decline') {
    collector.stop();
    await cleanupCall('📵 Call Declined');
    }
    if (i.customId === 'ignore') {
    collector.stop();
    await cleanupCall('📴 No Response');
    }
    if (i.customId === 'hangup') {
    collector.stop();
    await cleanupCall('📴 Call Ended');
    }
    });
    collector.on('end', async () => {
    if (!callActive) {
    await cleanupCall('📴 Missed Call');
    }
    });
    const voiceHandler = async (oldState, newState) => {
    if (!callActive) return;
    if (
    oldState.channelId === callChannel.id &&
    newState.channelId !== callChannel.id
    ) {
    await cleanupCall('📴 Call Ended');
    }
    };
    interaction.client.on('voiceStateUpdate', voiceHandler);
  }
};