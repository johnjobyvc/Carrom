# Carrom Multiplayer Game (Web Prototype)

A playable browser prototype for a Carrom game focused on core striker + coin interaction.

## Project Overview

This project now includes a **playable single-board prototype** with:

- Canvas-based carrom board
- **20 total coins** on the board (including queen-style red coin)
- Draggable striker aiming and shooting
- Coin collision, wall bounce, friction, and pocket detection
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
2. Drag from striker and release to shoot
3. Confirm coins move/collide and can be pocketed
4. Confirm status updates coin count

## Controls

- Click/touch the striker near the bottom line
- Drag backward to set shot direction/power
- Release to flick the striker
- Press **Reset Board** to restart with 20 coins
