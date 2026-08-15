# Chess — Local + Online (P2P)

A multiplayer chess game that runs entirely in the browser.

- **Local mode** — two players share one device (hotseat).
- **Online mode** — two players on different devices connect **peer-to-peer**
  over WebRTC (via the free PeerJS cloud). **No game server is required.**

This folder is the complete, deployable site. It is pure static files —
no build step, no backend, no database.

## Files

| File             | Purpose                                            |
|------------------|----------------------------------------------------|
| `index.html`     | The game (UI, lobby, P2P wiring)                   |
| `engine.js`      | Chess rules engine (shared by both players)        |
| `peerjs.min.js`  | PeerJS library (bundled locally, no CDN needed)    |

## How online play works

1. Player A opens the site → **Create game** → gets a 4-letter code.
2. Player B opens the same site → enters the code → **Join**.
3. The two browsers use the free PeerJS cloud only to find each other
   (signaling), then connect **directly** over a WebRTC data channel.
4. Moves are sent browser-to-browser; both sides validate with the same engine.

Players just need a modern browser and an internet connection (for the
initial handshake). No accounts, no installs.

## Deploy to GitHub Pages

You need a GitHub account. Steps:

1. **Create a repo** on GitHub (e.g. name it `chess`). Leave it empty.

2. **Push these files** to the repo root. From the folder containing these
   three files:

   ```bash
   git init
   git add index.html engine.js peerjs.min.js README.md
   git commit -m "chess game"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/chess.git
   git push -u origin main
   ```

3. **Enable Pages:**
   - Open your repo on GitHub → **Settings** → **Pages** (left sidebar).
   - Under **Build and deployment** → **Source**: choose **Deploy from a branch**.
   - **Branch**: select `main`, folder: **/ (root)** → **Save**.

4. **Wait ~1 minute.** GitHub shows your live URL:

   ```
   https://<YOUR-USERNAME>.github.io/chess/
   ```

5. **Share that URL.** One player creates a code, the other joins with it. Done.

> The game uses relative paths, so it works correctly under the
> `/<repo>/` subpath that GitHub Pages provides — no configuration needed.

## Other static hosts (same 3 files)

Any static file host works identically: **Netlify**, **Vercel**,
**Cloudflare Pages**, **play.it / playit.gg** (drag-and-drop the 3 files),
or even a plain web server. Just upload `index.html`, `engine.js`, and
`peerjs.min.js` and open the resulting URL.

## Notes & limitations

- **Free PeerJS cloud** is fine for casual play. For a serious product,
  self-host a PeerJS signaling server (still no *game* server needed).
- **NAT traversal**: PeerJS includes default STUN servers, so most networks
  connect fine. A few strict networks may need a TURN relay.
- **Trust-based**: game logic runs client-side, so a determined player could
  tamper in devtools. Both sides validate moves, preventing accidental desync.
  Great for friends; not for rated/competitive play.
- **Both players must be online** — it's real-time. If one closes the tab,
  the other sees "opponent left".

## Run locally (no deploy)

Just open `index.html` in a browser. Local (hotseat) mode works fully offline.
Online mode needs an internet connection for the PeerJS handshake.
