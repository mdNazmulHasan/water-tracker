# WaterTracker 💧

**WaterTracker** is a feature-rich, modern React Native application designed to help users track daily water intake, set personalized goals, configure custom hydration reminders, earn achievement badges, and view detailed historical consumption statistics.

---

## ✨ Features

- **📊 Daily Intake Tracking**: Easily log water consumption with preset amounts (200ml, 250ml, 350ml, 500ml) or custom quick-add entries.
- **🎯 Dynamic Progress & Wave Animation**: Visual representation of current daily intake versus personal goal.
- **🔔 Smart Reminders**: Configurable push notification reminders using `@notifee/react-native` to stay hydrated throughout the day.
- **🏆 Achievements & Gamification**: Earn badges and unlock rewards based on hydration consistency and total volume milestones.
- **📈 History & Analytics**: View daily, weekly, and monthly hydration trends with detailed logs and stats.
- **👤 Customizable User Profile**: Set custom daily targets, weight, activity levels, and preferences.
- **💾 Offline Support & Persistence**: Powered by `@reduxjs/toolkit` and `redux-persist` with `@react-native-async-storage/async-storage`.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React Native `0.86.0` (React `19.2.3`, TypeScript)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`), Redux Persist (`redux-persist`)
- **Navigation**: React Navigation (`@react-navigation/native`, `@react-navigation/bottom-tabs`)
- **Storage**: Async Storage (`@react-native-async-storage/async-storage`)
- **Notifications**: Notifee (`@notifee/react-native`)
- **Icons & Graphics**: React Native SVG (`react-native-svg`)
- **Dates**: Day.js (`dayjs`)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have your environment set up for React Native development.
- **Node.js**: `>= 22.11.0`
- **Yarn**: `3.6.4` (or npm)
- **Android Studio** & Android SDK (for Android development)
- **Xcode** & CocoaPods (for iOS development, macOS only)

---

### Step 1: Clone & Install Dependencies

```sh
# Clone the repository
git clone https://github.com/mdNazmulHasan/water-tracker.git
cd water-tracker

# Install JavaScript dependencies using Yarn
yarn install
```

### Step 2: Install iOS CocoaPods (iOS only)

```sh
# Install pods
bundle exec pod install --project-directory=ios
```

---

### Step 3: Run the Application

#### Start Metro Bundler
```sh
yarn start
```

#### Run on Android
```sh
yarn android
```

#### Run on iOS
```sh
yarn ios
```

---

## 📂 Project Structure

```
water-tracker/
├── src/
│   ├── components/     # Reusable UI components (Wave progress, quick add, stats cards)
│   ├── navigation/     # Tab navigation and root stack configurators
│   ├── screens/        # Main screens (Home, History, Reminders, Achievements, Profile)
│   ├── services/       # Notification and background service handlers
│   ├── store/          # Redux slices, store setup, and persistence config
│   ├── theme/          # Color tokens, typography, and styling variables
│   └── utils/          # Calculation helpers, date formatting, and constants
├── App.tsx             # Root Application Component
└── index.js            # App Entry Point
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

