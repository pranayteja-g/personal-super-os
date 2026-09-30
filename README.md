# Personal Super OS

A personal super-app engine driving Day Planner, Habit Hub, Reading Log, Workout Tracker, and custom mini-apps from declarative JSON manifests with List, Calendar, Streak, Checklist, Heatmap, and Numeric Logger primitives.

## Features
- **Built-in Mini-Apps**:
  - **Day Planner**: Tasks with date scheduling, day streak, weekly calendar, and heatmap activity.
  - **Habit Hub**: Habit checklist with per-habit streaks, date-based completion records, and heatmap.
  - **Reading Log**: Book reading sessions with status tracking and streaks.
  - **Workout Tracker**: Numeric logger for exercises, reps, weight tracking, and all-time personal bests.
- **Manifest Engine**: Renders dynamic screens from JSON manifests using pluggable primitive components (`list`, `calendar`, `streak`, `checklist`, `heatmap`, `numeric_logger`).
- **Mini-App Builder**: 2-step structured wizard creating new custom mini-apps (Task List, Habit Tracker, Numeric Log) with live interactive preview and validation.
- **Offline Persistence**: Fast in-memory and local storage caching keeping data safe across sessions with zero external database dependencies.

## Development
```bash
npm run dev
```
Dev server runs on `http://localhost:3000`.
