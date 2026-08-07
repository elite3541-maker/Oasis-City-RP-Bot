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
        .setName('clearwarn')
        .setDescription('Remove one specific warning from a member')
        .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
        .addIntegerOption(option => option.setName('number').setDescription('Warning number to remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client, config) {
        // Permission check - Moderator+
        if (!hasModPerms(interaction.member, config)) {
            return interaction.reply({ content: 'Only Moderators and above can use this command.', ephemeral: true });
        }

        const target = interaction.options.getUser('user');
        const number = interaction.options.getInteger('number');
        const warnings = loadWarnings();
        const userWarnings = warnings[target.id] || [];

        if (userWarnings.length === 0) {
            return interaction.reply({ content: 'This user has no warnings.', ephemeral: true });
        }

        if (number < 1 || number > userWarnings.length) {
            return interaction.reply({ content: `Please choose a number between 1 and ${userWarnings.length}.`, ephemeral: true });
        }

        const removed = userWarnings.splice(number - 1, 1)[0];
        warnings[target.id] = userWarnings;
        saveWarnings(warnings);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('Warning Removed')
            .setDescription(`Removed warning **#${number}** from ${target.tag}\n**Reason was:** ${removed.reason}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

function hasModPerms(member, config) {
    return member.roles.cache.has(config.moderatorRoleId) ||
           member.roles.cache.has(config.communityManagerRoleId) ||
           member.roles.cache.has(config.founderRoleId) ||
           member.permissions.has(PermissionFlagsBits.Administrator);
}