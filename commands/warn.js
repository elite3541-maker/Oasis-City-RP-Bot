const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) {
        fs.mkdirSync(path.dirname(warningsPath), { recursive: true });
        fs.writeFileSync(warningsPath, '{}');
    }
    return JSON.parse(fs.readFileSync(warningsPath));
}

function saveWarnings(data) {
    fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client, config) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) return interaction.reply({ content: 'User not in the server.', ephemeral: true });

        const warnings = loadWarnings();
        if (!warnings[target.id]) warnings[target.id] = [];

        const warning = {
            reason,
            moderator: interaction.user.id,
            date: new Date().toISOString()
        };

        warnings[target.id].push(warning);
        saveWarnings(warnings);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('⚠️ Member Warned')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})` },
                { name: 'Moderator', value: `${interaction.user.tag}` },
                { name: 'Reason', value: reason },
                { name: 'Total Warnings', value: `${warnings[target.id].length}` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.warningLogsId);
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }

        // DM user
        try {
            await target.send(`You have been warned in **Oasis City RP**.\n**Reason:** ${reason}`);
        } catch {}
    }
};