# The Principal Architecture Audit

Date: 2026-08-06

This audit reflects the live checkout state captured on 2026-08-06. It describes what was present on disk at the time of review.

## Executive summary

- Production is a Node.js slash-command bot started from `main.js` and supervised by PM2 under `pm2-root.service`.
- The live process is listening on the production port assigned by the host environment, while the code falls back to port `5000` if `PORT` is not set.
- Active production commands are `/join`, `/memo`, `/ping`, `/poll`, `/purge`, and `/say`.
- The music stack exists in the repository, but `main.js` explicitly excludes `commands/musicPlayer.js`, so `/music` is not currently loaded into production.
- The repository contains uncommitted runtime code (`commands/memo.js` and `commands/utils/*`), a suspicious binary blob (`--Frag2`), and stale Replit metadata. No credential-bearing upload config file is present in this checkout.
- `README.md` is stale: it overstates music capabilities, omits `/memo`, and links to a missing `docs/COMMANDS.md`.

## 1. Production runtime

### Entrypoint

- Primary runtime file: `main.js`
- Package entrypoint: `main.js`
- Start script: `npm start` → `node main.js`
- PM2 `pm_exec_path`: repository-local `main.js`

### Ports

- Code listens on `process.env.PORT || 5000`
- Current live listener: production host port
- The Replit workflow still expects port `5000`

### PM2 configuration

- Systemd unit: `pm2-root.service`
- `ExecStart`: `pm2 resurrect`
- `ExecReload`: `pm2 reload all`
- `ExecStop`: `pm2 kill`
- `PM2_HOME`: managed by the host service manager
- Principal log paths: omitted from this public copy
- PM2 process metadata:
  - `exec_interpreter`: `node`
  - `status`: `online`

### Startup path

1. systemd starts the PM2 daemon
2. PM2 resurrects the `theprincipal` process
3. `main.js` reads environment variables via `dotenv`
4. Express starts a health server
5. Discord.js logs in with the configured bot token environment variable
6. Slash commands are registered globally through Discord REST

### Listeners

`main.js` currently registers:

- `client.once('ready')`
- `client.on('guildMemberAdd')`
- `client.on('interactionCreate')`

There are no scheduled jobs or cron listeners in the live runtime.

### Health endpoint

- `GET /` returns `Bot is running`
- This is the only HTTP health endpoint in the live code

## 2. Command inventory

All active commands are slash commands. There are no prefix commands in the current runtime.

| Command | File | Aliases | Permissions | Dependencies / helpers | Interface | Status | Notes |
|---|---|---|---|---|---|---|---|
| `join` | `commands/join.js` | none | `Administrator` | none | slash | active | Manually emits `guildMemberAdd` for testing the welcome flow. |
| `memo` | `commands/memo.js` | none | `Facilitator` role check in code | `axios`, `jsdom` | slash | active | Untracked in Git, but loaded by `main.js`. Posts to the configured memo channel. |
| `music` | `commands/musicPlayer.js` | none | no explicit Discord permission; voice channel required | `@discordjs/voice`, `./utils/youtube-stream`, `./utils/soundcloud`, external `yt-dlp` binary | slash with subcommands `play`, `skip`, `stop` | unused / inactive | `main.js` explicitly excludes this file from auto-loading, so it is not part of production right now. |
| `ping` | `commands/ping.js` | none | none | none | slash | active | Simple health check. |
| `poll` | `commands/poll.js` | none | none | none | slash | active | Creates a yes/no poll and adds 👍/👎 reactions. |
| `purge` | `commands/purge.js` | none | `ManageMessages` | none | slash | active | Bulk deletes messages. |
| `say` | `commands/say.js` | none | `MentionEveryone` | none | slash | active | Sends an announcement embed to the current channel. |

### Notes on permissions

- `join` is admin-gated via `setDefaultMemberPermissions`.
- `purge` is admin/mod-gated via `setDefaultMemberPermissions`.
- `say` is gated via `setDefaultMemberPermissions`.
- `memo` does not use Discord permission bits; it checks for the `Facilitator` role in code.
- `music` has no explicit Discord permission gate, but it cannot run unless the user is in a voice channel.

## 3. Background functionality

| Feature | Source | Status | Notes |
|---|---|---|---|
| Music playback | `commands/musicPlayer.js` | inactive | The code is present, but production does not load it. |
| Memo system | `commands/memo.js` | active | Manual slash command, not scheduled. |
| Voice support | `commands/musicPlayer.js` | inactive | Only relevant if the music module is restored. |
| Timers | `commands/musicPlayer.js` | inactive | Inactivity timeout is used to tear down the queue. |
| Scheduled tasks | none found | absent | No cron-like scheduling in live code. |
| Event listeners | `main.js` | active | `ready`, `guildMemberAdd`, `interactionCreate`. |
| Channel watchers | `main.js` | active | Welcome embed is sent to `🎉・new-members` if found. |
| Role automation | none found | absent | No reaction-role or button/select-menu role automation exists in the live JS runtime. |

## 4. External integrations

| Service / API | Used by | Status | Assessment |
|---|---|---|---|
| Discord API | `main.js` and all commands | active | Core platform dependency. |
| Discord REST application-command registration | `main.js` | active | Registers slash commands globally on startup. |
| Merriam-Webster Word of the Day | `commands/memo.js` | active | Works as a live content source, but depends on page structure. |
| Conversation Starters World | `commands/memo.js` | active | Used for the memo’s random question. |
| ZenQuotes | `commands/memo.js` | active | Used for the memo’s quote content. |
| Muffin Labs history API | `commands/memo.js` | active | Used for the memo’s “today in history” item. |
| Useless Facts API | `commands/memo.js` | active | Used for the memo’s random fact. |
| JokeAPI | `commands/memo.js` | active | Used for the memo’s joke item. |
| YouTube / yt-dlp | `commands/musicPlayer.js`, `commands/utils/youtube-stream.js` | obsolete / broken if restored | Not part of production because `/music` is excluded; also depends on external binaries and scraping-style behavior. |
| SoundCloud internal endpoints | `commands/utils/soundcloud.js` | obsolete / broken if restored | Orphan helper module; no current caller. |

## 5. Dependency audit

### Why `package-lock.json` changed so heavily

The lockfile churn is consistent with a dependency-set refresh rather than a small edit:

- `package.json` was changed from the older voice stack to a newer one.
- New runtime packages were added for the memo command (`axios`, `jsdom`) and environment loading (`dotenv`).
- The lockfile was regenerated against the new dependency graph, which rewrites many transitive packages.

That is why the diff is large even though the top-level package list is comparatively small.

### Current runtime usage

Used by the live code:

- `discord.js`
- `dotenv`
- `express`
- `axios`
- `jsdom`

Declared but currently unused in the active runtime:

- `@discordjs/voice` — only relevant to the inactive music module
- `ffmpeg-static`
- `opusscript`
- `play-dl`
- `sodium-native`
- `tweetnacl`

### Development-only packages

- None are declared in `package.json`.
- `npm test` is currently a stub (`echo "Error: no test specified" && exit 1`).

### Runtime-only / host-level dependencies

- `yt-dlp` is required by the inactive music helpers, but it is not declared in `package.json`.
- `curl` is used by the YouTube/SoundCloud resolver helper.

## 6. Repository audit

### Current Git state

Tracked modifications:

- `main.js`
- `package.json`
- `package-lock.json`
- `commands/musicPlayer.js`

Untracked files:

- `commands/memo.js`
- `commands/utils/soundcloud.js`
- `commands/utils/youtube-stream.js`
- `--Frag2`

### Generated artifacts

Tracked/generated or likely generated:

- `generated-icon.png` — no code references found; likely an orphan asset
- `.breakpoints`
- `.cache/replit/__replit_disk_meta.json`
- `__pycache__/keep_alive.cpython-38.pyc`
- `__pycache__/utils.cpython-38.pyc`
- `cogs/__pycache__/ceelo.cpython-38.pyc`
- `cogs/__pycache__/finance.cpython-38.pyc`
- `cogs/__pycache__/fun.cpython-38.pyc`
- `cogs/__pycache__/media.cpython-38.pyc`
- `cogs/__pycache__/reaction_roles.cpython-38.pyc`

### Secrets and sensitive files

- The environment file is not part of the tracked output shown here, but it should remain secret/local-only.
- No credential-bearing upload config file is present in this checkout. If a copy is later introduced, treat it as secret-bearing until proven otherwise.

### Suspicious files

- `--Frag2` is an untracked 202 KB binary data file with no references in the repo.
- It should be reviewed manually before any cleanup or commit decision.

### Orphan / dead code

- `commands/musicPlayer.js` is unreachable because `main.js` excludes it from auto-loading.
- `commands/utils/soundcloud.js` has no live caller.
- `commands/utils/youtube-stream.js` is only reachable from the unreachable music module.

### Deployment / config drift

- `.replit` is partially stale:
  - `run = "npm start"` is correct
  - `entrypoint = "main.js"` is correct
  - debugger `program = "./index.js"` is wrong
  - deployment `run = ["sh", "-c", "node index.js"]` is wrong
- `replit.md` still claims `/music` is active and still describes `play-dl`/`@discordjs/opus`, which no longer matches the live JS runtime.

## 7. Migration matrix

| Category | Items |
|---|---|
| Current production | `join`, `memo`, `ping`, `poll`, `purge`, `say`, `main.js`, Express health server |
| Legacy | `commands/musicPlayer.js`, `commands/utils/youtube-stream.js`, `commands/utils/soundcloud.js` |
| Needs restoration | `/music` only if the bot should regain music playback |
| Intentionally retired | none explicitly marked in source |
| Belongs in Fred instead | none identified from current Principal source |
| Future roadmap | README refresh, `.replit` path fixes, dependency cleanup, artifact cleanup, secret rotation, decide fate of `/music` |

## 8. README audit

The current `README.md` does not fully reflect reality.

What it gets right:

- It identifies The Principal as a Discord bot for the Workshop/CUSN server.
- It correctly points to a slash-command-based bot concept.

What is stale or wrong:

- It says the bot has “6 commands and counting,” but the actual active command set is different.
- It lists music as an active feature, but `commands/musicPlayer.js` is not loaded in production.
- It omits the currently active `/memo` command.
- It describes music capabilities like pause/forward/reverse that are not implemented in the current file.
- It links to `docs/COMMANDS.md`, which is not present in the repository tree.

Bottom line: the README is not authoritative for current production behavior.

## 9. Roadmap — 2026-08-06

This roadmap records the state of The Principal’s JavaScript runtime and the agreed next steps as of August 6, 2026.

### Restore or retire the music stack

- [ ] Decide whether `/music` should be restored
- [ ] If restored, wire `commands/musicPlayer.js` back into `main.js`
- [ ] If not restored, remove the inactive music helpers and dead dependency burden
- [ ] Decide whether `commands/utils/soundcloud.js` should be replaced or dropped

### Documentation

- [ ] Update `README.md` to match the live slash-command set
- [ ] Add `/memo` to the command documentation
- [ ] Remove or rewrite the stale `/music` description
- [ ] Fix the broken `docs/COMMANDS.md` link
- [ ] Update `replit.md` so it reflects the current runtime instead of the older music stack

### Repository hygiene

- [ ] Remove tracked cache / generated artifacts from the repository history
- [ ] Review `generated-icon.png` and `--Frag2` to decide whether they are legitimate assets or junk
- [ ] Clean up untracked runtime code so the working tree matches the committed source

### Runtime hardening

- [ ] Add tests for slash-command registration and permission boundaries
- [ ] Add tests for the `memo` command’s role gate and posting behavior
- [ ] Add tests for the welcome-event flow triggered by `/join`
- [ ] Consider moving the health endpoint / startup notes into a more explicit deployment doc

## 10. Manual review list

The following files deserve human review before any cleanup commit:

- `--Frag2`
- `commands/musicPlayer.js`
- `commands/utils/soundcloud.js`
- `commands/utils/youtube-stream.js`
- `generated-icon.png`
- `.replit`
- `replit.md`

## Phase 2 addendum

### 1. Credential-bearing upload config

- Status in this checkout: not present.
- File/service association: no repository-local evidence available because the file is absent here.
- Current production references: none found in the Principal repository.
- Rotation / removal procedure: if a credential-bearing upload config appears later, inspect it in a secret-safe environment, rotate the underlying service credentials first, then remove the file from Git only after rotation is complete.

### 2. `--Frag2`

- File type: generic data
- Size: 202,428 bytes
- SHA-256: `463000683e1e8b636f4060bb8a670ce6e2195e38900f5183d0eeee2b6d68609a`
- References: none found in code or configuration; only this audit report references it.
- Safety: ambiguous. It looks like an orphan binary blob, but provenance is unknown, so do not delete it until the owner confirms it is junk.

### 3. `generated-icon.png`

- File type: JPEG image
- Size: 14,256 bytes
- References: none found in code, README, or Replit metadata.
- Classification: orphan asset / generated artifact.
- Recommendation: preserve or archive until provenance is confirmed; deletion is probably safe but not proven.

### 4. Replit files and metadata

| File | Classification | Notes |
|---|---|---|
| `.replit` | stale deployment configuration | Still points the workflow at `node main.js`, but the debugger/deployment paths are inconsistent (`./index.js` and `node index.js`). |
| `replit.md` | useful historical documentation, but stale | Documents the older music stack and outdated dependency assumptions. |
| `replit.nix` | stale deployment configuration | Replit/Nix setup for the Node environment; useful only if the repo is revived on Replit. |
| `.cache/replit/__replit_disk_meta.json` | generated artifact | Not present in the current tree. |
| `.breakpoints` | generated artifact | Not present in the current tree. |

### 5. Archive layout for inactive music code

Recommended archive layout:

```text
legacy/music/
  musicPlayer.js
  utils/
    soundcloud.js
    youtube-stream.js
  README.md
```

### 6. Dependency cleanup recommendations

Once the inactive music stack is archived and no longer part of the live runtime, the following packages can be removed from the production manifest/lockfile:

- `@discordjs/voice`
- `ffmpeg-static`
- `opusscript`
- `play-dl`
- `sodium-native`
- `tweetnacl`

The production runtime should then be re-locked around the active surface only:

- `discord.js`
- `dotenv`
- `express`
- `axios`
- `jsdom`

### 7. Package-lock interpretation

- Active memo work contributes the `axios` and `jsdom` portion of the dependency graph.
- Inactive music work contributes the voice/audio chain (`@discordjs/voice`, `ffmpeg-static`, `opusscript`, `play-dl`, `sodium-native`, `tweetnacl`) plus their transitive packages.
- The safest future state is to keep the active manifest small and regenerate `package-lock.json` only after the music archive is separated from production code.

### 8. Proposed commit sequence

- Commit A — preserve active production functionality
  - Keep: `main.js`, `commands/memo.js`, `commands/ping.js`, `commands/poll.js`, `commands/purge.js`, `commands/say.js`, `commands/join.js`
- Commit B — archive inactive music implementation
  - Move: `commands/musicPlayer.js`, `commands/utils/soundcloud.js`, `commands/utils/youtube-stream.js`
- Commit C — remove generated and stale artifacts
  - Remove: `.breakpoints`, `.cache/replit/__replit_disk_meta.json`, any other generated cache artifacts that may appear
- Commit D — remove secret-bearing configuration after credential rotation
- Only if a secret-bearing file such as a credential-bearing upload config exists in the checkout later
- Commit E — update README and add dated roadmap
  - `README.md`
- Commit F — dependency cleanup, only after the active runtime is tested
  - `package.json`, `package-lock.json`

### 9. Permissions roadmap item

- Make Principal admin-only by default.
- Decide whether Facilitator should remain an exception for `/memo`.
- Add explicit gates to `/ping` and `/poll`.
- Do not implement these yet; this is a future behavior decision.

### 10. Risks and rollback

- Archiving the music stack without first confirming owner intent could remove a feature users still expect.
- Removing `@discordjs/voice` and audio dependencies before the archive is separated could break an inactive-but-restorable path.
- The binary blob and generated icon should be preserved until provenance is known.
- Rollback is straightforward if cleanup is staged as isolated commits: restore the archived files first, then restore the manifest and lockfile if needed.
