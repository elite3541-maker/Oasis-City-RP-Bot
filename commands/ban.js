const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Simple rate limit store
const banHistory = new Map(); // userId -> timestamps[]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member (Community Manager+)')
        .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client, config) {
        // Community Manager or Founder only
        const isCM = interaction.member.roles.cache.has(config.communityManagerRoleId);
        const isFounder = interaction.member.roles.cache.has(config.founderRoleId);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isCM && !isFounder && !isAdmin) {
            return interaction.reply({ content: 'Only **Community Managers** and above can use this command.', ephemeral: true });
        }

        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (target.id === interaction.guild.ownerId) return interaction.reply({ content: 'You cannot ban the server owner.', ephemeral: true });
        if (!target.bannable) return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });

        // Rate limit (3 every 10 minutes) - CM and Founder bypass
        if (!isCM && !isFounder && !isAdmin) {
            const now = Date.now();
            const history = banHistory.get(interaction.user.id) || [];
            const recent = history.filter(t => now - t < 10 * 60 * 1000);

            if (recent.length >= 3) {
                return interaction.reply({ content: 'You can only ban **3 people every 10 minutes**.', ephemeral: true });
            }

            recent.push(now);
            banHistory.set(interaction.user.id, recent);
        }

        await target.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('Member Banned')
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