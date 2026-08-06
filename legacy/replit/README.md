# Archived Replit configuration

These files are preserved for historical reference only. Production no longer uses Replit; the live bot runs from `main.js` under the host PM2/systemd setup.

## Historical overview

The Principal is a Discord bot built for the "Workshop" Discord server (CUSN community). It uses discord.js v14 with slash commands and provides music playback, polls, moderation tools, and utility commands. The bot runs as a Node.js application with a minimal Express web server for keep-alive/health-check purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Entry Point & Bot Setup
- **main.js** is the single entry point. It initializes both the Express health-check server and the Discord.js client.
- The Express server on port 5000 exists solely to keep the bot alive on hosting platforms — it serves a simple "Bot is running" response at `/`.
- The Discord client uses Gateway Intents for Guilds, Messages, MessageContent, Members, and VoiceStates.

### Command System
- **Slash commands** are used exclusively (no prefix-based commands). Commands are registered globally via Discord's REST API on bot startup using `Routes.applicationCommands()`.
- All command files live in the `/commands/` directory as flat files (no subdirectories). Each command file exports an object with a `data` property (SlashCommandBuilder) and an `execute` method.
- Commands are auto-loaded by reading all `.js` files from `/commands/` at startup and stored in a `Collection` on the client.

### Current Commands
| Command | File | Purpose |
|---------|------|---------|
| `/ping` | `ping.js` | Simple health check response |
| `/poll` | `poll.js` | Creates a yes/no poll with emoji reactions |
| `/purge` | `purge.js` | Bulk-deletes messages (admin/mod only) |
| `/say` | `say.js` | Sends an announcement embed |
| `/music` | `musicPlayer.js` | Music player with play/skip/stop subcommands |
| `/join` | `join.js` | Triggers welcome event for testing (admin only) |

### Music System
- Uses `@discordjs/voice` for voice connections and audio playback.
- Uses `play-dl` for YouTube search and streaming (replaces ytdl-core).
- Audio encoding handled by `@discordjs/opus` with `ffmpeg-static` for format conversion.
- Queue management is done via an in-memory `Map()` keyed by guild ID — there is no persistent storage for music queues.
- Encryption for voice handled by `libsodium-wrappers`.

### Permissions
- Some commands are restricted using `setDefaultMemberPermissions()`:
  - `/purge` requires `ManageMessages`
  - `/say` requires `MentionEveryone`
  - `/join` requires `Administrator`

### Data Storage
- **No database** is used. The bot is stateless — all data (like music queues) is held in memory and lost on restart.
- Configuration relies entirely on environment variables.

### Environment Variables
- Discord bot token — required for authentication.
- `PORT` — Optional. Defaults to 5000 for the Express server.

## External Dependencies

### Core Dependencies
| Package | Purpose |
|---------|---------|
| `discord.js` ^14.13.0 | Discord API client and bot framework |
| `@discordjs/voice` ^0.16.0 | Voice channel connections and audio playback |
| `@discordjs/opus` ^0.9.0 | Opus audio encoding for voice |
| `express` ^4.18.2 | Minimal web server for health checks |
| `play-dl` ^1.9.6 | YouTube/Spotify search and audio streaming |
| `ffmpeg-static` ^5.2.0 | Static FFmpeg binary for audio processing |
| `libsodium-wrappers` ^0.7.13 | Encryption for Discord voice connections |

### External Services
- **Discord API** — The bot registers slash commands globally and interacts with Discord's gateway and REST APIs.
- **YouTube** — Music search and playback via `play-dl`. No API key is configured; `play-dl` handles this internally.

### Important Notes for Development
- The bot has no build step — it runs directly with `node main.js`.
- There are no tests configured (`npm test` just exits with an error).
- The `/commands/` directory is the only place to add new commands; they are auto-discovered.
- `@discordjs/opus` requires native compilation (C++ bindings) — if installation fails, `opusscript` can be used as a pure JS fallback.
