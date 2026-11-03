# Real-Time Collaborative Canvas Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg?logo=typescript)](https://www.typescriptlang.org)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-4F46E5.svg)](https://github.com/websockets/ws)
[![CRDT](https://img.shields.io/badge/CRDT-Lamport_Ordering-brightgreen.svg)](#)
[![Author](https://img.shields.io/badge/Author-Samay_Sawal-orange.svg)](https://github.com/samaysawal24)

A distributed real-time collaborative document and canvas editor workspace powered by Block-Based Conflict-Free Replicated Data Types (CRDTs), Lamport logical timestamps, WebSocket synchronization, multi-cursor presence awareness, and markdown serialization.

---

## 🏛️ System Architecture

```mermaid
sequenceDiagram
    autonumber
    actor PeerA as Alice (Client A)
    participant WS as WebSocket Room Server
    actor PeerB as Bob (Client B)

    PeerA->>WS: Connect: /ws?roomId=spec-doc&userId=alice
    WS->>PeerA: SYNC_INITIAL_STATE (Blocks + Active Users)
    
    PeerB->>WS: Connect: /ws?roomId=spec-doc&userId=bob
    WS->>PeerA: USER_JOINED (Bob cursor awareness)
    
    PeerA->>WS: Mutation: UPDATE_BLOCK (Clock: 14)
    WS->>WS: Reconcile CRDT via Lamport Ordering
    WS->>PeerB: REMOTE_OP_BROADCAST (Clock: 15)
    
    PeerB->>WS: Heartbeat: PRESENCE_PING (Cursor at Block 3)
    WS->>PeerA: Presence update broadcast
```

---

## 🚀 Key Features

- **Conflict-Free Replicated Data Types (CRDT):** Guarantees eventual consistency across concurrent block edits without locking.
- **Lamport Logical Timestamps:** Guarantees deterministic causality tracking and collision resolution across distributed clients.
- **Live Peer Presence Awareness:** Displays dynamic participant cursors, color badges, and heartbeats with automatic stale peer pruning.
- **Modular Block Architecture:** Supports rich blocks: Headings, Paragraphs, Code snippets, Bullet lists, and Callouts.
- **Native Markdown Exporter:** Generates sanitized Github-flavored markdown files on-the-fly.

---

## 📦 Project Structure

```
collab-canvas-workspace/
├── src/
│   ├── api/
│   │   └── routes.ts         # REST API for room snapshots & export
│   ├── crdt/
│   │   ├── blockState.ts     # Lamport clock CRDT document block engine
│   │   └── presence.ts       # Peer cursor and awareness manager
│   ├── types/
│   │   └── index.ts          # Block and operation schemas
│   ├── ws/
│   │   └── roomManager.ts    # WebSocket room router & broadcast hub
│   └── server.ts             # Express & WebSocket HTTP server
├── tests/
│   └── crdt_presence.test.ts # Jest test suite
├── Dockerfile                # Production container spec
├── docker-compose.yml        # Orchestration spec
├── tsconfig.json             # TypeScript compiler settings
├── package.json              # Dependencies and scripts
├── LICENSE                   # MIT License (smay)
└── README.md
```

---

## ⚡ Quickstart

### 1. Local Setup

```bash
git clone https://github.com/samaysawal24/collab-canvas-workspace.git
cd collab-canvas-workspace

npm install
```

### 2. Start Server

```bash
npm run dev
```

### 3. Connect via WebSocket

Connect your collaborative client to:
```
ws://localhost:3002?roomId=my-project-room&userId=user_123
```

### 4. Fetch Room Snapshot via REST
`GET /api/v1/rooms/my-project-room/snapshot`

### 5. Export Document to Markdown
`GET /api/v1/rooms/my-project-room/export/markdown`

---

## 🧪 Running Tests

```bash
npm test
```

---

## 📜 License & Author

- **Author:** smay ([@samaysawal24](https://github.com/samaysawal24))
- **Email:** cricketworldsamay@gmail.com
- **License:** Released under the [MIT License](LICENSE).

