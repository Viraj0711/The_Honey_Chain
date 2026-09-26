# HoneyChain

HoneyChain is a full-stack traceability and hive-health platform for modern beekeeping. It brings together:

- IoT hive monitoring
- Edge AI analysis for colony health
- Lab report verification
- Blockchain-backed traceability
- Consumer-facing honey origin visibility

The goal is simple: help beekeepers, labs, and consumers trust the origin and quality of honey from hive to bottle.

---

## What this repo contains

This project is organized into a few main parts:

- `frontend/` — the modern dashboard UI for live hive status and telemetry
- `apps/web/` — a React web app for the older web interface
- `apps/api/` — Express API with MongoDB-backed business logic and auth
- `contracts/` — Hardhat smart contracts for blockchain functionality
- `docs/` — product, design, and architecture documentation

---

## Quick start

### 1) Install dependencies

```bash
cd "c:/Honeychain/The_Honey_Chain"
npm install
```

### 2) Set up environment variables

The API reads `backend/api/.env`, so create it from the example in that folder:

```bash
cd backend/api
copy .env.example .env
```

If you are on macOS/Linux:

```bash
cd backend/api
cp .env.example .env
```

The main values are:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_STORAGE_BUCKET`
- `JWT_SECRET`
- `PORT`
- `CHAIN_RPC_URL`

---

## Run the dashboard

### Dashboard frontend

```bash
cd "c:/Honeychain/The_Honey_Chain/frontend"
npm run dev -- --host 0.0.0.0
```

Then open the local Vite URL, usually:

```text
http://localhost:5173/
```

If that port is busy, Vite will pick the next available one.

---

## Run the API

```bash
cd "c:/Honeychain/The_Honey_Chain"
npm run dev:api
```

The API listens on port `4000` by default and expects MongoDB to be available locally.

---

## Run the older web app

```bash
cd "c:/Honeychain/The_Honey_Chain"
npm run dev:web
```

---

## Run everything together

```bash
cd "c:/Honeychain/The_Honey_Chain"
npm run dev
```

This runs the API and the older web app together.

---

## Firebase live telemetry

The dashboard has been connected to Firebase Realtime Database for live hive data. The app listens for data from the RTDB and updates the UI in real time.

The Firebase config is stored in:

- `frontend/src/lib/firebase.ts`

The live telemetry mapping lives in:

- `frontend/src/lib/telemetry.ts`

The app reads the data from the Firebase branch and maps it to the dashboard fields automatically.

---

## Demo users

The API includes demo seed data for quick testing.

Example login credentials include:

- Farmer: `9000000001` / `farmer123`
- Admin: `9000000002` / `admin123`

These are created by the demo seed flow in the API.

---

## Blockchain / contracts

The smart contracts are in the `contracts/` folder.

```bash
cd "c:/Honeychain/The_Honey_Chain/contracts"
npm run node
```

To compile and test:

```bash
cd "c:/Honeychain/The_Honey_Chain/contracts"
npm run compile
npm run test
```

---

## Type checking

Run the workspace typecheck:

```bash
cd "c:/Honeychain/The_Honey_Chain"
npm run typecheck
```

---

## Repository workflow

This project uses feature branches. Do not merge directly into `main` unless your team specifically wants that flow.

Typical flow:

```bash
git checkout -b feature/my-change
git add .
git commit -m "feat: describe your change"
git push origin feature/my-change
```

Then open a pull request on GitHub.

---

## Project intent

HoneyChain is designed to make beekeeping more data-driven, more transparent, and more trustworthy:

- detect hive stress before it becomes a serious colony problem
- validate the quality of honey through reports and AI checks
- store trustworthy data on-chain when needed
- give consumers clear, verifiable origin information

---

## Need help?

If you want to run only the dashboard, use the `frontend` commands. If you want the full app, use the root `npm run dev` flow. If you want blockchain features, start the Hardhat node first.

Built for a real-world beekeeping ecosystem — from hive sensor to verified consumer trust.
