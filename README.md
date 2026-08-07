# Oasis City RP Bot

Custom Discord bot for the **Oasis City RP** server (Wanted Roblox Roleplay).

## Features

- ✅ Welcome message + automatic **Applicant** role on join
- ✅ Ticket system (pings Staff role)
- ✅ Warning system (`/warn`, `/warnings`, `/clearwarns`)
- ✅ Moderation (`/kick`, `/ban`, `/timeout`)
- ✅ `/accept` command → gives **Verified** role & removes Applicant
- ✅ Full logging

## Setup

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your token + IDs
4. Edit `config.js` with all your channel and role IDs
5. Run `node deploy-commands.js` to register slash commands
6. Run `node index.js`

## Required Bot Permissions

- Manage Roles
- Kick Members
- Ban Members
- Moderate Members
- Manage Channels
- Send Messages
- Embed Links
- View Channels

## Required Privileged Intents

- Server Members Intent
- Message Content Intent
