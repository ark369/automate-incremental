# Cadence — Personal-Automation Satirical Incremental Game

A finite-time, darkly satirical incremental game set at an *Office Space*-style corporation. Start by manually clearing mundane workday tasks, calibrate your Digital Twin to reclaim your 9–5, expand into a 24-hour holistic calendar, and complicitly approve away every remaining bottleneck—including yourself.

## Vertical Slice Architecture
- **Declarative Content (`src/content/`)**: Tasks, upgrades, Cadence consent proposals, act transitions, and corporate/wellness pings are separated from engine and UI code for fast iteration.
- **Pure-TS Simulation (`src/engine/`)**: Fixed-clamped `requestAnimationFrame` day-sweep engine powered by Zustand with `localStorage` persistence and synthesized Web Audio cues.
- **Mobile-First Hourglass UI (`src/components/`, `src/styles/`)**: Evolves from cluttered fluorescent corporate tooling (Acts 1–2) through wellness-app optimization (Act 3) into minimalist serenity as the player approves UI removal proposals (Acts 4–5).
- **Day-1 Dev Tools**: Click the `DEV` pill in the bottom-right corner for `1x / 5x / 20x` speed controls, instant Act 1–5 jumps, resource grants, sample fill, and save export/import.

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```
