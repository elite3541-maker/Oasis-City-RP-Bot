const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply to join Oasis City RP'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('application_modal')
            .setTitle('Oasis City RP Application');

        const robloxInput = new TextInputBuilder()
            .setCustomId('roblox_username')
            .setLabel('Roblox Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ageInput = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('Age (or age range)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const experienceInput = new TextInputBuilder()
            .setCustomId('experience')
            .setLabel('Previous RP Experience')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const whyInput = new TextInputBuilder()
            .setCustomId('why')
            .setLabel('Why do you want to join?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const characterInput = new TextInputBuilder()
            .setCustomId('character')
            .setLabel('Character idea (short)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(robloxInput),
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(experienceInput),
            new ActionRowBuilder().addComponents(whyInput),
            new ActionRowBuilder().addComponents(characterInput)
        );

        await interaction.showModal(modal);
    }
};