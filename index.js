require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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

// ====================== READY ======================
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('Oasis City RP', { type: 3 });
});

// ====================== WELCOME + APPLICANT ROLE ======================
client.on('guildMemberAdd', async (member) => {
    try {
        // Give Applicant role
        const applicantRole = member.guild.roles.cache.get(config.applicantRoleId);
        if (applicantRole) {
            await member.roles.add(applicantRole).catch(() => {});
        }

        // Send welcome message
        const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!welcomeChannel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🏙️ Welcome to Oasis City RP')
            .setDescription(`Welcome ${member}!\n\nThis is the official Oasis City Roleplay community for the Roblox game **Wanted**.\n\nPlease read the following channels carefully before applying:\n\n• #rules\n• #server-info\n• #how-to-apply\n\nOnce you are ready, go to the **Applications** category and submit your application.\n\nWe're glad you're here.`)
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
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client, config);
        } catch (error) {
            console.error(error);
            const errorMsg = { content: 'There was an error while executing this command.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    }

    // Ticket buttons
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            await handleCreateTicket(interaction, client, config);
        }
        if (interaction.customId === 'close_ticket') {
            await handleCloseTicket(interaction, config);
        }
    }
});

// ====================== TICKET FUNCTIONS ======================
async function handleCreateTicket(interaction, client, config) {
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
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
                id: config.staffRoleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎫 Support Ticket')
        .setDescription(`Hello ${interaction.user},\n\nPlease describe your issue and staff will assist you shortly.\n\nClick the button below to close this ticket when finished.`)
        .setTimestamp();

    const row = {
        type: 1,
        components: [{
            type: 2,
            style: 4,
            label: 'Close Ticket',
            custom_id: 'close_ticket'
        }]
    };

    await ticketChannel.send({
        content: `<@&${config.staffRoleId}> | ${interaction.user}`,
        embeds: [embed],
        components: [row]
    });

    await interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });

    // Log
    const logChannel = guild.channels.cache.get(config.ticketLogsId);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('Ticket Created')
            .addFields(
                { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: 'Channel', value: `${ticketChannel}` }
            )
            .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
    }
}

async function handleCloseTicket(interaction, config) {
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