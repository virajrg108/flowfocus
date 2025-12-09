# FlowFocus

A modern productivity timer app featuring both Flowmodoro and Pomodoro techniques.

## Features

- 🎯 **Advanced Productivity Timer**
  - **Flowtime Mode**: Count-up timer with earned breaks (1:5 ratio) for flexible flow states
  - **Pomodoro Mode**: Traditional count-down sessions with customizable durations
  - **Intelligent Mode Switching**: Auto-transitions between focus and break modes

- ✅ **Task Management**
  - Create, track, and complete daily tasks
  - Simple and intuitive task list interface
  - Persistent storage using local database

- 🏷️ **Tag System**
  - Organize sessions with specific tags (e.g., Work, Study, Coding)
  - Color-coded tags for visual distinction
  - Manage up to 5 custom tags with editing capabilities

- 📊 **Detailed Analytics**
  - **Activity Overview**: Stacked bar chart showing daily focus distribution by tag
  - **Daily Timeline**: Gantt-style chart visualizing focus sessions and breaks
  - **Consistency Heatmap**: GitHub-style contribution graph for the last 12 months
  - **Date Filtering**: View stats for last 7, 30, 60 days or custom ranges
  - **Session Insights**: Hover tooltips for detailed session info

- ⚙️ **Settings & Customization**
  - **Theme Support**: Toggle between Light and Dark modes
  - **Data Management**: Option to clear all application data
  - **Tag Configuration**: centralized management for session tags

- 💾 **Local & Offline First**
  - **IndexedDB Storage**: All data stays on your device
  - **PWA Ready**: Installable as a native-like app
  - **Privacy Focused**: No external data tracking

## Live Demo

Visit the live app: [FlowFocus on GitHub Pages](https://virajrg108.github.io/flowfocus)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This app is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand (State Management)
- Dexie (IndexedDB)
- Recharts (Analytics)