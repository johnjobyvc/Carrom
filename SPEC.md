# Software Specification for Carrom Multiplayer Game

## 1. Introduction

### 1.1 Purpose
This document defines software requirements and system specifications for an online **Carrom Multiplayer Game** inspired by games available on Poki-style web platforms.

The system supports:

- Single-player mode (against AI)
- Local multiplayer mode
- Online multiplayer mode

The game includes leaderboards, rewards, achievements, customization, and responsive controls.

---

## 2. System Overview

The Carrom Multiplayer Game is a digital board game where players flick a striker to pocket coins into corner pockets.

### Core Objectives
- Simulate real-life carrom board physics
- Enable competitive multiplayer gameplay
- Provide ranking and reward progression systems
- Support mobile and desktop platforms

---

## 3. System Architecture

### 3.1 Architecture Model
**Client–Server Architecture**

### Components
1. Game Client
2. Game Server
3. Database
4. Matchmaking System
5. Leaderboard System

### High-Level Flow

```text
Player Client
      |
      v
Game Server ---- Database
      |
      v
Matchmaking + Leaderboards
```

---

## 4. Functional Requirements

### 4.1 User Management

#### 4.1.1 Player Account
The system shall allow users to:
- Create account
- Login / logout
- Save progress
- Track statistics

#### 4.1.2 Player Profile
Profile shall display:
- Username
- Player level
- Wins / losses
- Achievements

### 4.2 Game Modes

#### 4.2.1 Single Player Mode
- Play against AI opponent
- Multiple difficulty levels
- Practice mode

#### 4.2.2 Online Multiplayer Mode
Players can:
- Join random matches
- Invite friends
- Compete globally

#### 4.2.3 Local Multiplayer Mode
- Two players on the same device

### 4.3 Gameplay Mechanics

#### 4.3.1 Controls
Players control the striker using:
- Mouse or touch
- Drag to adjust power
- Release to shoot
- Shake/screen feedback when coins fall into pockets

#### 4.3.2 Game Rules
- Players take turns striking coins.
- Goal: pocket all assigned coins.
- The queen must be covered after being pocketed.
- A player wins when all assigned coins are pocketed.

Example scoring:

| Action | Points |
|---|---:|
| Pocket coin | 1 |
| Pocket queen | 2 |
| Winning the board | Bonus |

### 4.4 Game Physics Engine
The system must simulate:
- Coin collision
- Friction
- Striker power
- Pocket detection

Physics components:
- Collision Detection
- Rigid Body Simulation
- Velocity Calculation
- Friction Model

### 4.5 Leaderboards
The system must support:
- Global ranking
- Weekly ranking
- Friend ranking

### 4.6 Rewards and Achievements
Players can earn:
- Coins
- Rewards
- Achievements

Example achievements:

| Achievement | Requirement |
|---|---|
| First Win | Win 1 match |
| Carrom Master | Win 50 matches |
| Precision Shot | Pocket 3 coins in one turn |

### 4.7 Customization System
Players can unlock:
- Strikers
- Boards
- Themes

Unlocks are tied to progression and in-game rewards.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Game response time < 100 ms
- Multiplayer latency < 200 ms
- Support 60 FPS rendering

### 5.2 Scalability
- Support thousands of concurrent users
- Use scalable server architecture

### 5.3 Security
- Secure authentication
- Encrypted player data
- Anti-cheat mechanisms

### 5.4 Compatibility
- Web browsers
- Android devices
- iOS devices
- Desktop systems

---

## 6. Database Design

### 6.1 Users
| Field | Type |
|---|---|
| UserID | INT |
| Username | VARCHAR |
| Password | VARCHAR |
| Level | INT |

### 6.2 Matches
| Field | Type |
|---|---|
| MatchID | INT |
| Player1 | INT |
| Player2 | INT |
| Winner | INT |
| Score | INT |

### 6.3 Achievements
| Field | Type |
|---|---|
| AchievementID | INT |
| UserID | INT |
| AchievementName | VARCHAR |

---

## 7. User Interface Requirements

### 7.1 Main Menu
Options:
- Play Online
- Play with Friend
- Play vs AI
- Leaderboards
- Settings

### 7.2 Game Screen
Elements:
- Carrom board
- Striker
- Coins
- Scoreboard
- Timer
- Player indicator

---

## 8. Technology Stack

| Component | Technology |
|---|---|
| Game Engine | Unity / HTML5 Canvas |
| Frontend | JavaScript / WebGL |
| Backend | Node.js |
| Database | MySQL / Firebase |
| Networking | WebSockets |

---

## 9. Future Enhancements

- Tournament mode
- Voice chat
- Spectator mode
- AR carrom mode
- Mobile offline mode
