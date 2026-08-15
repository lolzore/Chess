## Chess

Play chess right in your browser — **no downloads, no accounts, no installs.**

Play a friend on the same device, or play someone anywhere in the world over the
internet. Online games connect **peer-to-peer**, so there's no game server —
just two browsers talking to each other.

## How to play

## Local (same device)
Click **Play on this device**. Two players take turns on the same screen —
classic hotseat. Great for a quick game across the table.

## Online (two devices)
1. One player clicks **Create game** and gets a **4-letter code**.
2. The other player opens this same page, types the code, and clicks **Join**.
3. You're matched — the board appears and it's White's move.

That's it. No sign-ups. The two of you connect directly; the game relayed
between your browsers in real time.

**Tips**
- You'll always know whose turn it is (the board highlights your pieces).
- Click a piece to see its legal moves, then click a destination.
- Pawns reaching the last rank offer a promotion (queen, rook, bishop, or knight).
- **Resign** ends the game; **New game** starts a rematch with colors swapped.
- If your opponent closes the tab, you'll be told they left.

## What's implemented

Full standard chess rules:

- All piece movements and captures
- Check, **checkmate**, and **stalemate**
- **Castling** (kingside and queenside)
- **En passant**
- **Pawn promotion** with piece choice
- Draw by **50-move rule** and **insufficient material**
- Move history in standard algebraic notation (SAN)

## How it works (the fun part)

There is **no server**. When you create or join a game, your browser pairs with
your friend's browser using [PeerJS](https://peerjs.com/) and opens a direct
**WebRTC** connection. After the initial handshake, every move travels straight
from one browser to the other.

Both players run the exact same rules engine, so each side independently checks
that every incoming move is legal — the two boards can't drift out of sync.

Because the game lives entirely in your browser:
- It works from any static page (this one included) — nothing to host or run.
- It's as fast as your connection; there's no central server in the loop.

## Browser support

Any modern browser: **Chrome, Edge, Firefox, Safari** (desktop or mobile).
You'll need an internet connection for online games (for the initial handshake);
local mode works fully offline.

## A note on fair play

The game is built for playing with people you trust. Since the rules run in
your own browser, a determined player could tamper with it using developer
tools — both sides validate moves, so casual mistakes and lag never cause a
desync, but this isn't a rated or anti-cheat environment. For friends and
casual play, it's perfect.

---

*Built with vanilla JavaScript. The chess engine and the PeerJS library are
bundled locally, so the game has no external dependencies.*
