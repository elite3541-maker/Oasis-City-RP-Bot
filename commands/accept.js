const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Accept a member application and give them the Verified role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to accept')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client, config) {
        const target = interaction.options.getMember('user');

        if (!target) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
        const applicantRole = interaction.guild.roles.cache.get(config.applicantRoleId);

        if (!verifiedRole) {
            return interaction.reply({ content: 'Verified role not found. Check config.js', ephemeral: true });
        }

        try {
            await target.roles.add(verifiedRole);
            if (applicantRole) await target.roles.remove(applicantRole).catch(() => {});

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('Application Accepted')
                .setDescription(`${target} has been accepted and given the **Verified** role.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Try to DM the user
            try {
                await target.send(`🎉 Your application in **Oasis City RP** has been accepted! You now have access to the RP channels.`);
            } catch {}

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to give roles. Check bot permissions.', ephemeral: true });
        }
    }
};