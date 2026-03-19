# Project Guide

## Structure
- `client/` - React frontend (Vite, port 3000)
- `server/` - Node.js Express backend (port 4000)
- `docs/` - Project documentation

## Commands
- `npm run dev` - Start both client and server
- `npm run dev:client` - Start frontend only
- `npm run dev:server` - Start backend only
- `npm run build` - Build frontend
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier

## Conventions
- Language: JavaScript (ES Modules)
- Style: Prettier (no semi, single quotes)
- API proxy: `/api/*` -> `localhost:4000`
