const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member')
        .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction, client, config) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!target.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

        await target.kick(reason);

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('Member Kicked')
            .addFields(
                { name: 'User', value: `${target.user.tag}` },
                { name: 'Moderator', value: `${interaction.user.tag}` },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        const logChannel = interaction.guild.channels.cache.get(config.modLogsId);
        if (logChannel) logChannel.send({ embeds: [embed] });
    }
};