# Carrom Multiplayer Game (Web Prototype)

A playable browser prototype for a Carrom game focused on core striker + coin interaction, with a basic AI opponent.

## Project Overview

This project now includes a **playable single-board prototype** with:

- Canvas-based carrom board
- **20 total coins** on the board (including queen-style red coin)
- Draggable striker aiming and shooting
- Pull-strength guide line shown while dragging
- Coin collision, wall bounce, friction, and pocket detection
- Turn-based flow with a virtual AI player
- Striker auto-returns to the active player side after each shot settles
- Reset button for replay

It also includes a complete product specification in `SPEC.md` for future multiplayer/backend development.

## Environment

Validated for:

- GitHub Codespaces
- Ubuntu 24.04.3 LTS

## Installation

1. Open repository in GitHub Codespaces.
2. Verify Python is installed:

```bash
python3 --version
```

## Run the App

From repository root:

```bash
python3 -m http.server 8080
```

Open in browser:

- `http://localhost:8080`

In Codespaces, you can use the forwarded port URL from the **Ports** tab.

## Start the Test Server

Use:

```bash
python3 -m http.server 8080
```

Quick validation:

1. Load the page
2. Drag striker backward and release to shoot
3. Confirm pull-strength line appears while dragging
4. Confirm AI takes alternate turns
5. Confirm striker automatically returns to current player side after movement stops

## Controls

- On your turn, click/touch the striker on your baseline
- Drag backward to set direction and power
- A dynamic line shows pull/strike strength while dragging
- Release to flick the striker
- Wait for AI turn, then your next turn begins automatically
- After each turn settles, striker auto-resets to the active side
- Press **Reset Board** to restart with 20 coins
