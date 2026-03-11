# Carrom Multiplayer Game (Web Prototype)

A lightweight **web prototype** for a Carrom Multiplayer Game. This repository currently contains:

- A browser-based UI shell for a Carrom game experience
- A structured software specification (`SPEC.md`)
- Local development instructions for **GitHub Codespaces** on **Ubuntu 24.04.3 LTS**

---

## Project Overview

This project targets an online Carrom experience inspired by popular web-based implementations. The long-term product goals are:

- Single-player mode vs AI
- Local multiplayer mode
- Online multiplayer mode
- Leaderboards, achievements, and rewards
- Smooth physics-driven gameplay with responsive controls

The current implementation is a front-end starter app that demonstrates:

- Main menu with key game-mode actions
- Player profile summary
- Leaderboard preview
- Game board mock-up section for UI/design direction

---

## Tech Stack (Current Prototype)

- HTML5
- CSS3
- Vanilla JavaScript
- Local static server (`python3 -m http.server`)

---

## Environment

These instructions are tested for:

- **GitHub Codespaces**
- **Ubuntu 24.04.3 LTS**

---

## Installation Instructions

### 1) Open in Codespaces

1. Open this repository in GitHub.
2. Click **Code** → **Codespaces** → **Create codespace on main** (or your branch).

### 2) Verify tools

Run:

```bash
python3 --version
```

Python 3 is preinstalled in Codespaces and is enough to run the local test server.

---

## How to Run the App

From the repository root:

```bash
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080`

In GitHub Codespaces, you can also open the forwarded port URL shown in the **Ports** tab.

---

## How to Start the Test Server

Use the same local static server command:

```bash
python3 -m http.server 8080
```

Suggested quick test flow:

1. Start server on port `8080`
2. Open browser preview for `localhost:8080`
3. Verify:
   - Main menu buttons are visible
   - Board mock section renders
   - Leaderboard list and profile card appear

---

## Project Structure

```text
.
├── index.html      # Main web app UI
├── styles.css      # App styling and layout
├── app.js          # Small UI interactions
├── SPEC.md         # Software specification document
└── README.md       # Setup and usage guide
```

---

## Next Steps

- Integrate a physics engine for realistic striker/coin movement
- Add WebSocket-based online multiplayer
- Implement authentication and player progression
- Connect leaderboard and rewards to a backend database
