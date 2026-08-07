const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const kickHistory = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member (Moderator+)')
        .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction, client, config) {
        const isMod = interaction.member.roles.cache.has(config.moderatorRoleId);
        const isCM = interaction.member.roles.cache.has(config.communityManagerRoleId);
        const isFounder = interaction.member.roles.cache.has(config.founderRoleId);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isMod && !isCM && !isFounder && !isAdmin) {
            return interaction.reply({ content: 'Only **Moderators** and above can use this command.', ephemeral: true });
        }

        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (target.id === interaction.guild.ownerId) return interaction.reply({ content: 'You cannot kick the server owner.', ephemeral: true });
        if (!target.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

        // Rate limit - CM and Founder bypass
        if (!isCM && !isFounder && !isAdmin) {
            const now = Date.now();
            const history = kickHistory.get(interaction.user.id) || [];
            const recent = history.filter(t => now - t < 10 * 60 * 1000);

            if (recent.length >= 3) {
                return interaction.reply({ content: 'You can only kick **3 people every 10 minutes**.', ephemeral: true });
            }

            recent.push(now);
            kickHistory.set(interaction.user.id, recent);
        }

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