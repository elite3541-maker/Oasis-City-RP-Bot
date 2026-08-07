require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.GuildMember, Partials.Channel, Partials.Message]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
}

// Store application message IDs so we can edit them later
const pendingApplications = new Map(); // userId -> { statusMessageId, reviewMessageId }

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('Oasis City RP', { type: 3 });
});

// ====================== WELCOME + APPLICANT ROLE ======================
client.on('guildMemberAdd', async (member) => {
    try {
        const applicantRole = member.guild.roles.cache.get(config.applicantRoleId);
        if (applicantRole) await member.roles.add(applicantRole).catch(() => {});

        const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!welcomeChannel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🏙️ Welcome to Oasis City RP')
            .setDescription(`Welcome ${member}!\n\nThis is the official Oasis City Roleplay community for the Roblox game **Wanted**.\n\nPlease read the following channels carefully before applying:\n\n• #rules\n• #server-info\n• #how-to-apply\n\nOnce you are ready, go to the **Applications** category and submit your application using </apply:0>.\n\nWe're glad you're here.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Oasis City RP' })
            .setTimestamp();

        await welcomeChannel.send({
            content: `${member}`,
            embeds: [welcomeEmbed]
        });
    } catch (error) {
        console.error('Welcome error:', error);
    }
});

// ====================== INTERACTION HANDLER ======================
client.on('interactionCreate', async (interaction) => {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, client, config);
        }

        // Modal submit (Application form)
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'application_modal') {
                await handleApplicationSubmit(interaction);
            }
            if (interaction.customId.startsWith('deny_modal_')) {
                await handleDenyModal(interaction);
            }
        }

        // Buttons
        if (interaction.isButton()) {
            if (interaction.customId === 'create_ticket') {
                await handleCreateTicket(interaction);
            }
            if (interaction.customId === 'close_ticket') {
                await handleCloseTicket(interaction);
            }
            if (interaction.customId.startsWith('accept_app_')) {
                await handleAccept(interaction);
            }
            if (interaction.customId.startsWith('deny_app_')) {
                await handleDenyButton(interaction);
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
        }
    }
});

// ====================== APPLICATION SYSTEM ======================
async function handleApplicationSubmit(interaction) {
    const roblox = interaction.fields.getTextInputValue('roblox_username');
    const age = interaction.fields.getTextInputValue('age');
    const experience = interaction.fields.getTextInputValue('experience');
    const why = interaction.fields.getTextInputValue('why');
    const character = interaction.fields.getTextInputValue('character') || 'Not provided';

    const user = interaction.user;

    // 1. Public status message
    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    let statusMessage;

    if (statusChannel) {
        statusMessage = await statusChannel.send(`**${user.username}**'s application is being looked over`);
    }

    // 2. Staff review embed with buttons
    const reviewChannel = interaction.guild.channels.cache.get(config.applicationReviewId);
    if (!reviewChannel) {
        return interaction.reply({ content: 'Application review channel not found. Contact staff.', ephemeral: true });
    }

    const reviewEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📝 New Application')
        .setDescription(`Application from ${user}`)
        .addFields(
            { name: 'Discord', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Roblox Username', value: roblox, inline: true },
            { name: 'Age', value: age, inline: true },
            { name: 'RP Experience', value: experience },
            { name: 'Why do you want to join?', value: why },
            { name: 'Character Idea', value: character }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_app_${user.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`deny_app_${user.id}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
    );

    const reviewMessage = await reviewChannel.send({
        content: `<@&${config.staffRoleId}>`,
        embeds: [reviewEmbed],
        components: [row]
    });

    // Save message IDs so we can edit them later
    pendingApplications.set(user.id, {
        statusMessageId: statusMessage ? statusMessage.id : null,
        reviewMessageId: reviewMessage.id,
        statusChannelId: statusChannel ? statusChannel.id : null,
        reviewChannelId: reviewChannel.id
    });

    await interaction.reply({
        content: 'Your application has been submitted! Staff will review it soon.',
        ephemeral: true
    });
}

async function handleAccept(interaction) {
    const userId = interaction.customId.replace('accept_app_', '');
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
        return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
    }

    // Give Verified role + remove Applicant
    const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
    const applicantRole = interaction.guild.roles.cache.get(config.applicantRoleId);

    if (verifiedRole) await member.roles.add(verifiedRole).catch(() => {});
    if (applicantRole) await member.roles.remove(applicantRole).catch(() => {});

    // Update public status
    const data = pendingApplications.get(userId);
    if (data && data.statusMessageId && data.statusChannelId) {
        const statusChannel = interaction.guild.channels.cache.get(data.statusChannelId);
        if (statusChannel) {
            const statusMsg = await statusChannel.messages.fetch(data.statusMessageId).catch(() => null);
            if (statusMsg) {
                await statusMsg.edit(`**${member.user.username}** your application has been accepted`);
            }
        }
    }

    // Disable buttons on review message
    if (data && data.reviewMessageId) {
        const reviewChannel = interaction.guild.channels.cache.get(data.reviewChannelId);
        if (reviewChannel) {
            const reviewMsg = await reviewChannel.messages.fetch(data.reviewMessageId).catch(() => null);
            if (reviewMsg) {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('disabled_accept').setLabel('Accepted').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled_deny').setLabel('Deny').setStyle(ButtonStyle.Danger).setDisabled(true)
                );
                await reviewMsg.edit({ components: [disabledRow] });
            }
        }
    }

    pendingApplications.delete(userId);

    // Ping the user in the status channel
    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    if (statusChannel) {
        await statusChannel.send(`${member} your application has been **accepted**! Welcome to Oasis City RP.`);
    }

    await interaction.reply({ content: `Accepted ${member.user.tag}`, ephemeral: true });
}

async function handleDenyButton(interaction) {
    const userId = interaction.customId.replace('deny_app_', '');

    const modal = new ModalBuilder()
        .setCustomId(`deny_modal_${userId}`)
        .setTitle('Deny Application');

    const reasonInput = new TextInputBuilder()
        .setCustomId('deny_reason')
        .setLabel('Reason for denial')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Explain why the application was denied...');

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await interaction.showModal(modal);
}

async function handleDenyModal(interaction) {
    const userId = interaction.customId.replace('deny_modal_', '');
    const reason = interaction.fields.getTextInputValue('deny_reason');
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
        return interaction.reply({ content: 'User not found.', ephemeral: true });
    }

    // Update public status
    const data = pendingApplications.get(userId);
    if (data && data.statusMessageId && data.statusChannelId) {
        const statusChannel = interaction.guild.channels.cache.get(data.statusChannelId);
        if (statusChannel) {
            const statusMsg = await statusChannel.messages.fetch(data.statusMessageId).catch(() => null);
            if (statusMsg) {
                await statusMsg.edit(`**${member.user.username}** your application has been rejected due to **${reason}**. Please wait 48 hours then apply again.`);
            }
        }
    }

    // Disable buttons
    if (data && data.reviewMessageId) {
        const reviewChannel = interaction.guild.channels.cache.get(data.reviewChannelId);
        if (reviewChannel) {
            const reviewMsg = await reviewChannel.messages.fetch(data.reviewMessageId).catch(() => null);
            if (reviewMsg) {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('disabled_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled_deny').setLabel('Denied').setStyle(ButtonStyle.Danger).setDisabled(true)
                );
                await reviewMsg.edit({ components: [disabledRow] });
            }
        }
    }

    pendingApplications.delete(userId);

    // Ping the user
    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    if (statusChannel) {
        await statusChannel.send(`${member} your application has been **rejected** due to: **${reason}**\nPlease wait **48 hours** before applying again.`);
    }

    await interaction.reply({ content: `Denied ${member.user.tag}`, ephemeral: true });
}

// ====================== TICKET SYSTEM ======================
async function handleCreateTicket(interaction) {
    const guild = interaction.guild;
    const existing = guild.channels.cache.find(c => c.topic === `ticket-${interaction.user.id}`);
    if (existing) {
        return interaction.reply({ content: `You already have an open ticket: ${existing}`, ephemeral: true });
    }

    const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        parent: config.ticketCategoryId,
        topic: `ticket-${interaction.user.id}`,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
    });

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎫 Support Ticket')
        .setDescription(`Hello ${interaction.user},\n\nPlease describe your issue and staff will assist you shortly.\n\nClick the button below to close this ticket when finished.`)
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
        content: `<@&${config.staffRoleId}> | ${interaction.user}`,
        embeds: [embed],
        components: [row]
    });

    await interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });

    const logChannel = guild.channels.cache.get(config.ticketLogsId);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('Ticket Created')
            .addFields(
                { name: 'User', value: `${interaction.user.tag}` },
                { name: 'Channel', value: `${ticketChannel}` }
            )
            .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
    }
}

async function handleCloseTicket(interaction) {
    if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    }

    await interaction.reply({ content: 'Closing ticket in 5 seconds...' });

    const logChannel = interaction.guild.channels.cache.get(config.ticketLogsId);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('Ticket Closed')
            .addFields(
                { name: 'Closed by', value: `${interaction.user.tag}` },
                { name: 'Channel', value: interaction.channel.name }
            )
            .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
    }

    setTimeout(() => {
        interaction.channel.delete().catch(() => {});
    }, 5000);
}

client.login(process.env.TOKEN);