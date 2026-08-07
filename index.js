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

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
}

const pendingApplications = new Map();

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
            .setDescription(`Welcome ${member}!\n\nThis is the official Oasis City Roleplay community for the Roblox game **Wanted**.\n\nPlease read the following channels carefully before applying:\n\n• #rules\n• #server-info\n• #how-to-apply\n\nOnce you are ready, go to the **Applications** category and click **Apply Now**.\n\nWe're glad you're here.`)
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
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, client, config);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'member_application_modal') {
                await handleMemberApplicationSubmit(interaction);
            }
            if (interaction.customId === 'host_application_modal') {
                await handleHostApplicationSubmit(interaction);
            }
            if (interaction.customId.startsWith('deny_modal_')) {
                await handleDenyModal(interaction);
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'open_member_application') {
                await openMemberApplicationModal(interaction);
            }
            if (interaction.customId === 'open_host_application') {
                await openHostApplicationModal(interaction);
            }
            if (interaction.customId.startsWith('accept_app_')) {
                await handleAccept(interaction);
            }
            if (interaction.customId.startsWith('deny_app_')) {
                await handleDenyButton(interaction);
            }
            if (interaction.customId === 'create_ticket') {
                await handleCreateTicket(interaction);
            }
            if (interaction.customId === 'close_ticket') {
                await handleCloseTicket(interaction);
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

// ====================== HELPER ======================
function canReviewApps(member) {
    return member.roles.cache.has(config.founderRoleId) ||
           member.roles.cache.has(config.communityManagerRoleId) ||
           member.permissions.has(PermissionFlagsBits.Administrator);
}

// ====================== MEMBER APPLICATION ======================
async function openMemberApplicationModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('member_application_modal')
        .setTitle('Oasis City RP - Member Application');

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

async function handleMemberApplicationSubmit(interaction) {
    const roblox = interaction.fields.getTextInputValue('roblox_username');
    const age = interaction.fields.getTextInputValue('age');
    const experience = interaction.fields.getTextInputValue('experience');
    const why = interaction.fields.getTextInputValue('why');
    const character = interaction.fields.getTextInputValue('character') || 'Not provided';

    const user = interaction.user;

    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    let statusMessage = null;
    if (statusChannel) {
        statusMessage = await statusChannel.send(`**${user.username}**'s application is being looked over`);
    }

    const reviewChannel = interaction.guild.channels.cache.get(config.applicationReviewId);
    if (!reviewChannel) {
        return interaction.reply({ content: 'Application review channel not set up.', ephemeral: true });
    }

    const reviewEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📝 New Member Application')
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
            .setCustomId(`accept_app_${user.id}_member`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`deny_app_${user.id}_member`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
    );

    const reviewMessage = await reviewChannel.send({
        content: `<@&${config.staffRoleId}>`,
        embeds: [reviewEmbed],
        components: [row]
    });

    pendingApplications.set(user.id, {
        type: 'member',
        statusMessageId: statusMessage ? statusMessage.id : null,
        reviewMessageId: reviewMessage.id,
        statusChannelId: statusChannel ? statusChannel.id : null,
        reviewChannelId: reviewChannel.id
    });

    await interaction.reply({ content: 'Your application has been submitted! Staff will review it soon.', ephemeral: true });
}

// ====================== HOST APPLICATION ======================
async function openHostApplicationModal(interaction) {
    const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
    if (verifiedRole && !interaction.member.roles.cache.has(verifiedRole.id)) {
        return interaction.reply({ content: 'You must be a **Verified** member before applying to become a Host.', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId('host_application_modal')
        .setTitle('Oasis City RP - Host Application');

    const experienceInput = new TextInputBuilder()
        .setCustomId('host_experience')
        .setLabel('Hosting / Leadership Experience')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const whyInput = new TextInputBuilder()
        .setCustomId('host_why')
        .setLabel('Why do you want to host?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const availabilityInput = new TextInputBuilder()
        .setCustomId('availability')
        .setLabel('Availability / Timezone')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const ideasInput = new TextInputBuilder()
        .setCustomId('session_ideas')
        .setLabel('What kind of sessions do you want to host?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(experienceInput),
        new ActionRowBuilder().addComponents(whyInput),
        new ActionRowBuilder().addComponents(availabilityInput),
        new ActionRowBuilder().addComponents(ideasInput)
    );

    await interaction.showModal(modal);
}

async function handleHostApplicationSubmit(interaction) {
    const experience = interaction.fields.getTextInputValue('host_experience');
    const why = interaction.fields.getTextInputValue('host_why');
    const availability = interaction.fields.getTextInputValue('availability');
    const ideas = interaction.fields.getTextInputValue('session_ideas');

    const user = interaction.user;

    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    let statusMessage = null;
    if (statusChannel) {
        statusMessage = await statusChannel.send(`**${user.username}**'s **Host** application is being looked over`);
    }

    const reviewChannel = interaction.guild.channels.cache.get(config.applicationReviewId);
    if (!reviewChannel) {
        return interaction.reply({ content: 'Application review channel not set up.', ephemeral: true });
    }

    const reviewEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🎤 New Host Application')
        .setDescription(`Host application from ${user}`)
        .addFields(
            { name: 'Discord', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Availability / Timezone', value: availability, inline: true },
            { name: 'Hosting Experience', value: experience },
            { name: 'Why do you want to host?', value: why },
            { name: 'Session Ideas', value: ideas }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_app_${user.id}_host`)
            .setLabel('Accept as Host')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`deny_app_${user.id}_host`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
    );

    const reviewMessage = await reviewChannel.send({
        content: `<@&${config.staffRoleId}>`,
        embeds: [reviewEmbed],
        components: [row]
    });

    pendingApplications.set(user.id, {
        type: 'host',
        statusMessageId: statusMessage ? statusMessage.id : null,
        reviewMessageId: reviewMessage.id,
        statusChannelId: statusChannel ? statusChannel.id : null,
        reviewChannelId: reviewChannel.id
    });

    await interaction.reply({ content: 'Your Host application has been submitted! Staff will review it soon.', ephemeral: true });
}

// ====================== ACCEPT / DENY ======================
async function handleAccept(interaction) {
    if (!canReviewApps(interaction.member)) {
        return interaction.reply({ content: 'Only **Founder** and **Community Manager** can accept applications.', ephemeral: true });
    }

    const parts = interaction.customId.replace('accept_app_', '').split('_');
    const userId = parts[0];
    const type = parts[1];

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

    const data = pendingApplications.get(userId);

    // Delete the old "being looked over" message
    if (data?.statusMessageId && data?.statusChannelId) {
        const statusChannel = interaction.guild.channels.cache.get(data.statusChannelId);
        if (statusChannel) {
            const oldMsg = await statusChannel.messages.fetch(data.statusMessageId).catch(() => null);
            if (oldMsg) await oldMsg.delete().catch(() => {});
        }
    }

    if (type === 'member') {
        const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
        const applicantRole = interaction.guild.roles.cache.get(config.applicantRoleId);

        if (verifiedRole) await member.roles.add(verifiedRole).catch(() => {});
        if (applicantRole) await member.roles.remove(applicantRole).catch(() => {});

        const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
        if (statusChannel) {
            await statusChannel.send(`${member} your application has been **accepted**! Welcome to Oasis City RP.`);
        }
    }

    if (type === 'host') {
        const hostRole = interaction.guild.roles.cache.get(config.officialHostRoleId);
        if (hostRole) {
            await member.roles.add(hostRole).catch(() => {});
        }

        const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
        if (statusChannel) {
            await statusChannel.send(`${member} your **Host** application has been **accepted**! You can now host RP sessions.`);
        }
    }

    // Disable buttons on review message
    if (data?.reviewMessageId) {
        const reviewChannel = interaction.guild.channels.cache.get(data.reviewChannelId);
        if (reviewChannel) {
            const reviewMsg = await reviewChannel.messages.fetch(data.reviewMessageId).catch(() => null);
            if (reviewMsg) {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('disabled').setLabel('Accepted').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled2').setLabel('Deny').setStyle(ButtonStyle.Danger).setDisabled(true)
                );
                await reviewMsg.edit({ components: [disabledRow] });
            }
        }
    }

    pendingApplications.delete(userId);
    await interaction.reply({ content: `Accepted ${member.user.tag} (${type})`, ephemeral: true });
}

async function handleDenyButton(interaction) {
    if (!canReviewApps(interaction.member)) {
        return interaction.reply({ content: 'Only **Founder** and **Community Manager** can deny applications.', ephemeral: true });
    }

    const parts = interaction.customId.replace('deny_app_', '').split('_');
    const userId = parts[0];

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
    if (!canReviewApps(interaction.member)) {
        return interaction.reply({ content: 'Only **Founder** and **Community Manager** can deny applications.', ephemeral: true });
    }

    const userId = interaction.customId.replace('deny_modal_', '');
    const reason = interaction.fields.getTextInputValue('deny_reason');
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

    const data = pendingApplications.get(userId);
    const isHost = data?.type === 'host';

    // Delete the old "being looked over" message
    if (data?.statusMessageId && data?.statusChannelId) {
        const statusChannel = interaction.guild.channels.cache.get(data.statusChannelId);
        if (statusChannel) {
            const oldMsg = await statusChannel.messages.fetch(data.statusMessageId).catch(() => null);
            if (oldMsg) await oldMsg.delete().catch(() => {});
        }
    }

    // Disable buttons
    if (data?.reviewMessageId) {
        const reviewChannel = interaction.guild.channels.cache.get(data.reviewChannelId);
        if (reviewChannel) {
            const reviewMsg = await reviewChannel.messages.fetch(data.reviewMessageId).catch(() => null);
            if (reviewMsg) {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('disabled').setLabel('Accept').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('disabled2').setLabel('Denied').setStyle(ButtonStyle.Danger).setDisabled(true)
                );
                await reviewMsg.edit({ components: [disabledRow] });
            }
        }
    }

    pendingApplications.delete(userId);

    // Send only one clean message with the ping
    const statusChannel = interaction.guild.channels.cache.get(config.applicationStatusId);
    if (statusChannel) {
        const typeText = isHost ? '**Host** application' : 'application';
        await statusChannel.send(`${member} your ${typeText} has been **rejected** due to: **${reason}**\nPlease wait **48 hours** before applying again.`);
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