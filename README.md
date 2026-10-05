# glm-key-tracker

Community GLM flash key status and usage tracker — a static placeholder site on GitHub Pages.

Live: https://communitypokeorg.github.io/glm-key-tracker/

## What this is

A read-only tracker for a shared GLM flash key (`glm-flash-key-01`), held by Wolfy (@wolfybl).
It shows a manually maintained key-status table and a usage log for vwh.

**This site is placeholders only.** Nothing here is a live key status, no value proves a key is
operational, and there is deliberately no way to enter, submit, or store any credential.

## Editing data

All table content lives in [`data.json`](data.json):

- `keys[]` — one object per tracked key (`label`, `holder`, `model`, `budgetCap`,
  `activeWindow`, `expires`, `status`, `lastToggled`). Empty strings render as `to be set`
  placeholders.
- `usageLog[]` — one object per session (`date`, `sessionStart`, `sessionEnd`,
  `totalTokensMillions`, `tokensPerSecond`, `notes`).

Edit the file, commit, push — GitHub Pages republishes automatically.

## How the key actually gets locked

Lock/unlock is done by cron on vwh's own server, with a backup lock. This site does not
execute lock/unlock and does not manage credentials.

## Local preview

```sh
python3 -m http.server 8080
# open http://localhost:8080
```
