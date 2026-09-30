# Personal Super-App — First Sprint Scaffold

Implements spec §22 (First Sprint) + §25 (proof goal): one engine driving
Day Planner and Habit Hub from the same manifest/renderer/List/Calendar/Streak.

## Run
npm install
npx expo start
(scan QR with Expo Go, or press i/a for simulator)

## What's here
- src/db          SQLite schema, migrations, repositories (record + mini-app)
- src/domain      entities, repository interfaces, event bus
- src/runtime     component registry, manifest renderer, hard-coded manifests
- src/components/primitives  List, Calendar, Streak (P0 per spec §8)
- src/store       Zustand appStore — seeds both manifests on first boot
- src/app         expo-router screens (Home, dynamic [appId] screen)

## Not yet built (see spec §21 roadmap)
Builder UI, sharing/export, Supabase/sync, Timer/Chart/Goal/Table components,
NumericLogger primitive, Workout Tracker manifest.

## Acceptance check (spec §20, partial)
1. npx expo start → open app
2. Tap "Day Planner" → add a task, mark it done → streak increments
3. Go back, tap "Habit Hub" → same List/Calendar/Streak components, separate data
4. Kill and reopen the app → data persists (SQLite)
5. Turn off network → everything above still works
