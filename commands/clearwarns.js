const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    return JSON.parse(fs.readFileSync(warningsPath));
}

function saveWarnings(data) {
    fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings from a member')
        .addUserOption(option => option.setName('user').setDescription('User to clear').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client, config) {
        const target = interaction.options.getUser('user');
        const warnings = loadWarnings();

        if (!warnings[target.id] || warnings[target.id].length === 0) {
            return interaction.reply({ content: 'This user has no warnings.', ephemeral: true });
        }

        delete warnings[target.id];
        saveWarnings(warnings);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`All warnings for **${target.tag}** have been cleared.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};