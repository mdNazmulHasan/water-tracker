# WaterTracker 💧

**WaterTracker** is a modern, high-performance, and intuitive React Native hydration tracking application. Built with TypeScript, Redux Toolkit, and Notifee, it empowers users to achieve their daily hydration goals through smart reminders, detailed consumption statistics, personalized goal calculations, and gamified achievement milestones.

---

## ✨ Features

- **🚀 Step-by-Step Onboarding**: Personalized onboarding calculating recommended daily water intake based on gender, weight, and daily physical activity level.
- **📊 Quick & Custom Intake Logging**:
  - One-tap quick add buttons (`+250ml`, `+500ml`) and preset chips (`+150ml`, `+300ml`, `+450ml`, `+750ml`).
  - Custom drink modal allowing custom milliliter amounts and exact timestamp selection.
  - One-tap Undo feature to instantly revert the most recent intake.
- **🎯 Dynamic Circular Progress Indicator**: Visual progress ring illustrating real-time intake vs. daily goal with percentage feedback.
- **📈 History & Multi-Period Analytics**:
  - **Today (Hourly)**: Interactive 24-hour distribution chart and complete chronological intake timeline with inline entry editing (amount & time) and deletion.
  - **Week (7 Days)**: Daily consumption breakdown with total volume, daily average, and best day metrics.
  - **Month (30 Days)**: Monthly trend view displaying total volume, daily average, and count of goal-reached days.
- **⭐ Smart Hydration Engine (Adaptive Scheduling)**:
  - **Adaptive Reminders**: Dynamically evaluates consumption pace against daily targets and automatically adapts reminder frequency (tightens when behind, spaces out when ahead to prevent spam).
  - **Remaining-Goal Scheduling**: Computes a realistic drinking timetable and optimal portion sizes across the remaining active awake window before bedtime.
  - **Missed Reminder & Inactivity Recovery**: Detects passed intervals and intake times, instantly recalculating the remainder of the day rather than blindly firing stale alerts.
  - **Context-Aware Notifications**: Smart push alerts detailing exact suggested drink sizes (e.g. `+250ml`) and motivational catch-up or pace-maintaining copy.
  - **Toggleable AI Mode**: Easily switch between the Smart Hydration Engine and classic fixed-interval reminders.
- **🔔 Background Notifications**:
  - Configurable notification schedules bounded between wake and sleep times.
  - Customizable intervals (every 30m, 1h, 1.5h, 2h, 3h).
  - Background notification delivery via `@notifee/react-native`.
  - System permission checks with direct deep-linking to device app settings if permissions are denied.
- **🏆 Streaks & Achievement Badges**:
  - Current day streak, all-time best streak, and 7-day goal consistency tracker.
  - Milestone unlock system (First Sip, Goal Crusher, 3-Day & 7-Day Streaks, Hydro Master, and Night Owl).
- **👤 Profile & Target Customization**:
  - Real-time goal recalculations when adjusting body parameters.
  - Fine-grained target adjustments (`+100ml` / `-100ml`) or one-tap revert to recommended goal.
- **💾 Offline Persistence**: Automatic state persistence using Redux Persist and AsyncStorage.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React Native `0.86.0`** | Cross-platform mobile framework (React `19.2.3`) |
| **TypeScript** | Type-safe development |
| **Redux Toolkit & Redux Persist** | Centralized state management with offline local storage |
| **React Navigation `7.x`** | Bottom Tabs & Native Stack navigation |
| **@notifee/react-native** | Local push notifications & recurring schedule alarms |
| **react-native-svg** | Vector graphics, icons, and dynamic bar charts / progress rings |
| **Day.js** | Lightweight date manipulation and formatting |

---

## 📂 Project Structure

```
water-tracker/
├── scripts/
│   └── build-apk.js            # Automated version bump and release APK build script
├── src/
│   ├── components/             # Reusable UI components (BarChart, ProgressRing, TimePicker, Card, AppSwitch, Icons)
│   ├── navigation/             # Bottom tab & root stack navigators
│   ├── screens/                # App screens:
│   │   ├── OnboardingScreen.tsx # Multi-step goal setup wizard
│   │   ├── HomeScreen.tsx       # Main dashboard with progress ring & quick logging
│   │   ├── HistoryScreen.tsx    # Timeline log, hourly/weekly/monthly charts & drink editing
│   │   ├── RemindersScreen.tsx  # Smart reminder scheduler & permission handler
│   │   ├── AchievementsScreen.tsx # Streak statistics & milestone badges
│   │   └── ProfileScreen.tsx    # User metrics, schedule & daily goal adjustment
│   ├── services/               # Background services (Notifee push notifications)
│   ├── store/                  # Redux Toolkit slices (hydration, profile, reminders, achievements)
│   ├── theme/                  # Design tokens, color palette, typography & spacing
│   └── utils/                  # Mathematical formulas, date parsing & schedule calculations
├── App.tsx                     # Root application container & persistor gate
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `>= 22.11.0`
- **Yarn**: `3.6.4` (or npm)
- **Android Studio** & Android SDK (with emulator or connected device)
- **Xcode** & CocoaPods (macOS only, for iOS)

### Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/mdNazmulHasan/water-tracker.git
   cd water-tracker
   ```

2. **Install dependencies**:
   ```sh
   yarn install
   ```

3. **Install iOS Pods (macOS / iOS only)**:
   ```sh
   bundle exec pod install --project-directory=ios
   ```

---

## 📱 Running the App

### Start Metro Bundler
```sh
yarn start
# or reset cache if needed:
yarn start:clean
```

### Run on Android
```sh
yarn android
```

### Run on iOS
```sh
yarn ios
```

---

## 📦 Building Android Release APK

A build script is included in `scripts/build-apk.js` that automatically bumps version codes and names across `package.json`, `build.gradle`, and iOS project files before assembling the release APK.

```sh
# Auto-bump patch version (e.g. 1.0.3 -> 1.0.4) and build APK
yarn android:buildApk

# Or specify a bump type / custom version:
node scripts/build-apk.js minor
node scripts/build-apk.js 1.1.0
```

The generated APK will be output to the project root directory as `WaterTracker-v<version>.apk` and in `android/app/build/outputs/apk/release/`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

