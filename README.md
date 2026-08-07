# Oasis City RP Bot

Custom Discord bot for **Oasis City RP** (Wanted Roblox Roleplay server).

## Features

### Welcome System
- Automatically gives **Applicant** role when someone joins
- Sends a welcome embed in `#welcome` and pings the new member

### Application System
- `/apply` command opens a form (modal)
- When submitted:
  - Public message in `#application-status`: **"{username}'s application is being looked over"**
  - Full application with **Accept** / **Deny** buttons sent to `#application-review` (staff only)
- **Accept** button:
  - Gives **Verified** role
  - Removes **Applicant** role
  - Updates status to: **"{username} your application has been accepted"**
  - Pings the user
- **Deny** button:
  - Asks staff for a reason
  - Updates status to: **"{username} your application has been rejected due to {reason}. Please wait 48 hours then apply again."**
  - Pings the user

### Ticket System
- `/ticket-panel` sends a button panel
- Creates private ticket channels
- Pings the **Staff** role when a ticket is created

### Moderation
- `/warn` `/warnings` `/clearwarns`
- `/kick` `/ban` `/timeout`
- Full logging

## Setup Instructions

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in:
   - `TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
4. Open `config.js` and replace all the placeholder IDs with your real:
   - Channel IDs
   - Role IDs
5. Deploy the slash commands:
   ```bash
   node deploy-commands.js
   ```
6. Start the bot:
   ```bash
   node index.js
   ```

## Required Bot Permissions
- Manage Roles
- Kick Members
- Ban Members
- Moderate Members
- Manage Channels
- Send Messages
- Embed Links
- View Channels
- Read Message History

## Required Privileged Gateway Intents
- Server Members Intent
- Message Content Intent
