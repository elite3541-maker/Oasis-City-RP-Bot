const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-info')
        .setDescription('Send the server information messages (Founder only)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Which message to send')
                .setRequired(true)
                .addChoices(
                    { name: 'Welcome', value: 'welcome' },
                    { name: 'Rules', value: 'rules' },
                    { name: 'Server Info', value: 'server-info' },
                    { name: 'How to Apply', value: 'how-to-apply' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, config) {
        if (!interaction.member.roles.cache.has(config.founderRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only the Founder can use this command.', ephemeral: true });
        }

        const type = interaction.options.getString('type');
        let embed;

        if (type === 'welcome') {
            embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('🏙️ WELCOME TO OASIS CITY RP')
                .setDescription(`Welcome to the official Oasis City Roleplay community.\n\nThis is a private Wanted RP server focused on high-quality roleplay in Oasis City.\nHere you can roleplay as a Civilian, join the Syndicate, become a Police Officer, or apply to host your own RP sessions.\n\nPlease make sure you read the following channels before applying:\n\n• #rules\n• #server-info\n• #how-to-apply\n\nOnce you’ve finished reading, head over to the Applications category to get started.\n\nWe’re glad you’re here.`);
        }

        if (type === 'rules') {
            embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📜 OASIS CITY RP | SERVER RULES')
                .setDescription(`These rules apply to every member. Breaking them may result in warnings, mutes, kicks, or bans.\n\n**1. Respect**\nTreat everyone with respect. Harassment, toxicity, discrimination, or personal attacks are not allowed.\n\n**2. No NSFW Content**\nAny form of NSFW, inappropriate, or graphic content is strictly forbidden and will result in an instant ban.\n\n**3. No Spamming**\nDo not spam messages, emojis, pings, or links.\n\n**4. No Advertising**\nAdvertising other Discord servers, groups, or external links without permission is not allowed.\n\n**5. Stay On Topic**\nUse channels only for their intended purpose.\n\n**6. No Dangerous Links**\nIP loggers, viruses, or any malicious links will result in an immediate ban.\n\n**7. Nickname Rule**\nYour Discord nickname must match your Roblox username at all times.\n\n**8. No Controversial Topics**\nAvoid real-world controversial topics (politics, religion, etc.).\n\n**9. Follow Staff**\nStaff decisions are final. Publicly arguing with staff will result in punishment.\n\n**10. Use Common Sense**\nIf something feels wrong or against the community standards, don’t do it.`);
        }

        if (type === 'server-info') {
            embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('ℹ️ OASIS CITY RP | SERVER INFORMATION')
                .setDescription(`**What is this server?**\nOasis City RP is a private roleplay community for the Roblox game Wanted. We focus on organized, high-quality roleplay sessions.\n\n**How RP Works**\n• You must apply and get verified to join RP.\n• Verified members can join sessions hosted by Official Hosts.\n• Members can also apply to become Official Hosts and run their own sessions.\n\n**Main Roles**\n• **Verified** → Full member access\n• **Official Host** → Allowed to host RP sessions\n• **Syndicate Member / Police Officer / Civilian** → Faction roles\n• Staff roles handle moderation and applications`);
        }

        if (type === 'how-to-apply') {
            embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📝 HOW TO APPLY')
                .setDescription(`There are two types of applications:\n\n**1. Member Application**\nRequired to become a Verified member and gain access to RP channels.\n\nGo to the member applications channel and click **Apply Now**.\n\n**2. Host Application**\nWant to host your own RP sessions?\n\nRequirements:\n• Must already be Verified\n• Must have good standing\n\nGo to the host applications channel and click **Apply Now**.\n\n**Notes**\n• Be honest in your application\n• Low effort applications will be denied\n• You must wait **48 hours** after a denial before applying again`);
        }

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: `Sent the **${type}** message.`, ephemeral: true });
    }
};