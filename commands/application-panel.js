const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('application-panel')
        .setDescription('Send the Member Application panel with Apply Now button')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, config) {
        // Founder only
        if (!interaction.member.roles.cache.has(config.founderRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only the **Founder** can use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📝 Member Application')
            .setDescription('Want to join **Oasis City RP**?\n\nClick the button below to submit your application.\nStaff will review it as soon as possible.')
            .setFooter({ text: 'Oasis City RP' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_member_application')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Member application panel sent.', ephemeral: true });
    }
};