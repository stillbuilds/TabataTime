# Tabata Timer

![Tabata Timer](https://via.placeholder.com/800x400/282828/fabd2f?text=Tabata+Timer)

A minimal, customizable Tabata interval timer web application with Gruvbox dark theme. Built with TypeScript and React, designed to be broadcasted on local networks and Tailscale.

## Features

- **Simple & Focused**: Clean interface optimized for workout visibility
- **Gruvbox Dark Theme**: Easy on the eyes, perfect for low-light environments
- **Network Broadcasting**: Accessible from any device on your local network
- **Responsive Design**: Works well on TVs, desktops, tablets, and phones
- **Difficulty Presets**:
  - **Easy Mode**: 20s work / 40s rest (lower intensity)
  - **Hard Mode**: 40s work / 20s rest (higher intensity)
- **Visual Cues**:
  - Color-coded phases (work/rest/break)
  - Circular progress indicator
  - Large, readable timer display
- **Audio Alerts**: Sound cues for phase transitions and countdowns
- **Session Structure**: Properly configured Tabata protocol with sets and rounds

## Quick Start

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tabata-timer.git
   cd tabata-timer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server (broadcasts to local network):
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Access the timer:
   - From the same machine: http://localhost:5173
   - From other devices on your network: http://YOUR_IP_ADDRESS:5173

## Production Deployment

1. Build the production version:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Preview or serve the production build:
   ```bash
   npm run preview
   # or
   yarn preview
   ```

## Usage Guide

### Basic Controls

- **Start/Pause**: Begin or pause the current workout
- **Reset**: Reset the timer to the beginning
- **Difficulty Selection**: Choose between Easy and Hard presets (only when timer is not active)

### Workout Structure

The app follows a structured Tabata protocol:

- **Round**: A single work + rest cycle
- **Set**: A collection of rounds (typically 8)
- **Session**: The complete workout, consisting of multiple sets

### Default Settings

| Difficulty | Work Time | Rest Time | Rounds per Set | Sets | Rest Between Sets |
|------------|-----------|-----------|----------------|------|-------------------|
| Easy       | 20s       | 40s       | 8              | 2    | 60s               |
| Hard       | 40s       | 20s       | 8              | 2    | 60s               |

## Customization

### Changing Timer Settings

You can customize the workout parameters by modifying the `constants.ts` file:

```typescript
export const PRESET_SETTINGS: Record<DifficultyLevel, TabataSettings> = {
  [DifficultyLevel.EASY]: {
    workTime: 20,            // Work interval in seconds
    restTime: 40,            // Rest interval in seconds
    rounds: 8,               // Number of rounds per set
    sets: 2,                 // Number of sets
    restBetweenSets: 60      // Rest time between sets in seconds
  },
  [DifficultyLevel.HARD]: {
    workTime: 40,
    restTime: 20,
    rounds: 8,
    sets: 2,
    restBetweenSets: 60
  }
};
```

### Theming

The app uses Gruvbox dark theme colors defined in `index.css`. You can modify the color scheme by changing the CSS variables:

```css
:root {
  /* Gruvbox Dark Theme Colors */
  --bg: #282828;
  --bg-soft: #32302f;
  --bg-hard: #1d2021;
  --fg: #ebdbb2;
  --red: #fb4934;
  --green: #b8bb26;
  --yellow: #fabd2f;
  /* ... other colors ... */
}
```

## Technical Details

### Project Structure

```
tabata-timer/
├── public/             # Static assets
├── src/
│   ├── App.tsx         # Main application component
│   ├── constants.ts    # App settings and constants
│   ├── index.css       # Global styles and theme
│   ├── main.tsx        # Application entry point
│   └── types.ts        # TypeScript type definitions
├── index.html          # HTML template
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

### Technologies Used

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **CSS Variables**: For theming
- **HTML5 Audio API**: For sound alerts

## Network Broadcasting

The application is configured to broadcast on all network interfaces (`0.0.0.0`), making it accessible from any device on your local network or Tailscale VPN.

### Accessing from Other Devices

1. Find your computer's IP address:
   - **Windows**: Run `ipconfig` in Command Prompt
   - **macOS/Linux**: Run `ifconfig` or `ip addr` in Terminal

2. On any device on the same network, open a browser and navigate to:
   ```
   http://YOUR_IP_ADDRESS:5173
   ```

3. For Tailscale access, use your Tailscale IP:
   ```
   http://YOUR_TAILSCALE_IP:5173
   ```

## Troubleshooting

### Audio Not Working

- Check if your device's sound is on and not muted
- Some browsers block autoplay of audio until user interaction
- Try clicking anywhere on the page before starting the timer

### Cannot Access from Other Devices

- Ensure your firewall allows connections on port 5173
- Verify all devices are on the same network
- Check if your router blocks local network connections

### Timer Accuracy Issues

- The timer uses JavaScript's `setInterval`, which may have slight timing inconsistencies
- Keep the browser tab active for best performance
- Close other resource-intensive applications

## Future Improvements

- [ ] Add custom timer configurations
- [ ] Include workout presets for different fitness levels
- [ ] Implement persistent settings via localStorage
- [ ] Add voice announcements for phase changes
- [ ] Support for exercise names per interval
- [ ] Dark/light theme toggle
- [ ] Background music integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Gruvbox color scheme by [morhetz](https://github.com/morhetz/gruvbox)
- Tabata protocol developed by Dr. Izumi Tabata

---

Built with ❤️ using React and TypeScript
