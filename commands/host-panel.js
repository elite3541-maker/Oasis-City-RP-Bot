const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('host-panel')
        .setDescription('Send the Host Application panel with Apply Now button')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, config) {
        // Founder only
        if (!interaction.member.roles.cache.has(config.founderRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only the **Founder** can use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎤 Host Application')
            .setDescription('Want to host your own RP sessions in **Oasis City RP**?\n\nClick the button below to apply to become an Official Host.\nYou must already be a Verified member.')
            .setFooter({ text: 'Oasis City RP' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_host_application')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎤')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Host application panel sent.', ephemeral: true });
    }
};