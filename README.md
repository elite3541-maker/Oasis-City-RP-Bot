# Oasis City RP Bot

Custom Discord bot for **Oasis City RP** (Wanted Roblox Roleplay).

## Features

### Welcome System
- Automatically gives **Applicant** role when someone joins
- Sends a welcome embed + pings the new member in `#welcome`

### Member Application System
- Use `/application-panel` to post a nice panel with an **Apply Now** button
- Clicking the button opens a form
- Public status message: `{username}'s application is being looked over`
- Staff get Accept / Deny buttons
- On Accept → gives Verified role + pings the user
- On Deny → asks for reason + pings the user with the reason + 48h wait message

### Host Application System
- Use `/host-panel` to post a panel with an **Apply Now** button for hosts
- Only Verified members can apply
- Same Accept / Deny flow as member applications
- Public status shows it is a Host application

### Ticket System
- `/ticket-panel` sends a Create Ticket button
- Pings the Staff role when a ticket is opened

### Moderation
- `/warn` `/warnings` `/clearwarns`
- `/kick` `/ban` `/timeout`

## How to set up the panels

1. Go to `#member-applications` and run:
   ```
   /application-panel
   ```
2. Go to `#host-applications` and run:
   ```
   /host-panel
   ```

That’s it. Members just click the **Apply Now** buttons.

## Setup

1. `npm install`
2. Fill in `.env` (TOKEN, CLIENT_ID, GUILD_ID)
3. Fill in all IDs in `config.js`
4. `node deploy-commands.js`
5. `node index.js`
