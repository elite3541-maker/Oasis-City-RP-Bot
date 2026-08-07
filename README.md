# Oasis City RP Bot

## New Features Added

### Permissions
- `/application-panel`, `/host-panel`, `/ticket-panel`, `/send-info` → **Founder only**
- `/ban`, `/clearwarns` → **Community Manager +**
- `/warn`, `/kick`, `/timeout`, `/clearwarn` → **Moderator +**

### Safety
- Cannot kick/ban the server owner
- Max 3 kicks or bans every 10 minutes (Community Manager and Founder can bypass)

### Applications
- 48-hour cooldown after a denial (both Member and Host applications)
- Public status messages + Accept/Deny buttons

### New Commands
- `/clearwarn` → Remove one specific warning by number
- `/send-info` → Send Welcome / Rules / Server Info / How to Apply messages

## Setup Reminder

1. Fill in **all** role IDs in `config.js` (especially `founderRoleId`, `communityManagerRoleId`, `moderatorRoleId`)
2. Run `node deploy-commands.js` again after pulling the new code
3. Restart the bot
