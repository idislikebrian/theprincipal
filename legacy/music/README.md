# Archived Music Implementation

This directory contains the inactive music implementation that used to power `/music`.

It is preserved for historical reference only and is not loaded in production.

Historically, it supported:

- `play`
- `skip`
- `stop`

It depended on Discord voice packages, `yt-dlp`, `curl`, and external YouTube / SoundCloud resolution helpers.

Any restoration would require a fresh compatibility and security review before it could be reintroduced into production.

The current production bot runs without this module.
