const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    return JSON.parse(fs.readFileSync(warningsPath));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings of a member')
        .addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client, config) {
        const target = interaction.options.getUser('user');
        const warnings = loadWarnings();
        const userWarnings = warnings[target.id] || [];

        if (userWarnings.length === 0) {
            return interaction.reply({ content: `${target.tag} has no warnings.`, ephemeral: true });
        }

        const list = userWarnings.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>`).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle(`Warnings for ${target.tag}`)
            .setDescription(list)
            .setFooter({ text: `Total: ${userWarnings.length}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};