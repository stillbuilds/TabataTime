# Tabata Timer

A simple Tabata interval timer web application with Gruvbox dark theme. Built with TypeScript and React.

## Features

- Easy and Hard difficulty presets
- Visual timer with progress ring
- Sound alerts for interval changes
- Responsive design for all screen sizes
- Broadcasts to local network and Tailscale (accessible from any device)

## Setup and Run

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory

```bash
cd tabata-timer
```

3. Install dependencies

```bash
npm install
```

4. Start the development server (will broadcast to all network interfaces)

```bash
npm run dev
```

5. Access the app:
   - On your computer: http://localhost:5173
   - From other devices on your network: http://YOUR_COMPUTER_IP:5173
   - Via Tailscale: http://YOUR_TAILSCALE_IP:5173

## Audio Files

The application requires three audio files in the `public` directory:

- `beep-short.mp3` - For countdown alerts
- `beep-start.mp3` - For phase changes
- `beep-end.mp3` - For workout completion

If these files are missing, the timer will still work, but without sound alerts.

## Build for Production

```bash
npm run build
```

This creates a `dist` directory with the production build that can be deployed to any static hosting service.

To preview the production build locally (also broadcasts to network):

```bash
npm run preview
```

## Customization

You can customize the workout parameters by modifying the `src/constants.ts` file:

```typescript
export const PRESET_SETTINGS: Record<DifficultyLevel, TabataSettings> = {
  [DifficultyLevel.EASY]: {
    workTime: 20,            // Work interval in seconds
    restTime: 40,            // Rest interval in seconds
    rounds: 8,               // Number of rounds per set
    sets: 2,                 // Number of sets
    restBetweenSets: 60      // Rest time between sets in seconds
  },
  // ...
};
```

## License

MIT
