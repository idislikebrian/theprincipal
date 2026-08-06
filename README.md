# The Principal

The Principal is the staff-facing moderation and operations bot for the Workshop Discord server.

It runs as a Node.js application, starts from `main.js`, reads configuration from environment variables, and exposes a small Express health endpoint for the host process manager.

## Active Commands

All active commands are slash commands.

- `/join` — manually triggers the welcome event for testing. This is source-restricted to Administrators.

- `/memo` — generates and posts the daily memorandum. This is intended for Facilitators and is enforced in source by a `Facilitator` role check.

- `/ping` — lightweight health check command. Not source-tiered; it is not restricted to Facilitators or Administrators in code.

- `/poll` — creates a yes/no poll and adds reaction votes. Not source-tiered; it is not restricted to Facilitators or Administrators in code.

- `/purge` — bulk-deletes messages in the current channel. This is source-restricted to members with `ManageMessages`.

- `/say` — sends an announcement embed to the current channel. It is intended for staff announcements and is source-restricted to members with `MentionEveryone`.

## Access Model

The intended structure is staff-first:

- Facilitator: routine moderation, communication, and memo tools
- Administrator: diagnostics, configuration, and higher-impact operations

Current source-enforced permissions are narrower than that long-term model:

- `/join` requires Administrator
- `/memo` requires the `Facilitator` role
- `/purge` requires `ManageMessages`
- `/say` requires `MentionEveryone`
- `/ping` and `/poll` do not currently enforce a permission gate in source

The roadmap below tracks the remaining permission-hardening work.

## Current Features

- Global slash-command registration on startup
- Welcome-event handling for new members
- Manual memo generation with external content sources
- Poll creation with emoji reactions
- Message purge support
- Announcement embeds
- Express health endpoint at `/`

## Archived Features

The old music implementation is preserved under `legacy/music/`.

`/music` is not loaded in production. Restoring it would require a fresh compatibility and security review before it should be reintroduced.

## Project Structure

- `main.js`
- `commands/`
- `legacy/music/`
- `legacy/replit/`
- `docs/`
- `package.json`
- `package-lock.json`

Runtime-only files such as `.env` are intentionally not listed as repository source.

## Runtime

The bot is a Node.js application that starts from `main.js`.

It reads configuration from environment variables, including the Discord token and the HTTP listener port.

The Express listener uses `process.env.PORT` with a fallback to `5000`.

## Documentation

Architecture audit:

- [docs/PRINCIPAL-ARCHITECTURE-AUDIT-2026-08-06.md](docs/PRINCIPAL-ARCHITECTURE-AUDIT-2026-08-06.md)

## Roadmap — 2026-08-06

### Permissions

- [ ] Make Principal staff-only by default
- [ ] Preserve Facilitator access for routine moderation commands
- [ ] Restrict diagnostics and high-impact actions to Administrators
- [ ] Add explicit permission gates to /ping and /poll
- [ ] Review whether /say should be Facilitator or Administrator-only

### Testing

- [ ] Add slash-command registration tests
- [ ] Add permission-boundary tests
- [ ] Add /memo role-gate tests
- [ ] Add welcome-flow tests

### Future systems

- [ ] Design role assignment controls with buttons or select menus
- [ ] Keep configuration controls in Principal
- [ ] Coordinate member-facing role selection with Fred

### Maintenance

- [x] Preserve active production commands in Git
- [x] Archive inactive music implementation
- [x] Remove inactive music dependencies
- [x] Archive stale Replit configuration
- [x] Quarantine orphan binary artifact
- [x] Publish sanitized architecture audit
- [ ] Restore normal PM2 CLI management
