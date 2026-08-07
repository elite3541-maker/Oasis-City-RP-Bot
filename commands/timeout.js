const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option => option.setName('user').setDescription('User to timeout').setRequired(true))
        .addIntegerOption(option => option.setName('minutes').setDescription('Duration in minutes').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client, config) {
        const target = interaction.options.getMember('user');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!target.moderatable) return interaction.reply({ content: 'I cannot timeout this user.', ephemeral: true });

        await target.timeout(minutes * 60 * 1000, reason);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('Member Timed Out')
            .addFields(
                { name: 'User', value: `${target.user.tag}` },
                { name: 'Duration', value: `${minutes} minutes` },
                { name: 'Moderator', value: `${interaction.user.tag}` },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        const logChannel = interaction.guild.channels.cache.get(config.modLogsId);
        if (logChannel) logChannel.send({ embeds: [embed] });
    }
};