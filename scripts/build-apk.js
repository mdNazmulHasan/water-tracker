const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const bumpType = process.argv[2] || 'patch'; // patch, minor, major, or explicit version (e.g. 1.0.3)

// 1. Read package.json
const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let [major, minor, patch] = pkg.version.split('.').map(Number);

if (bumpType === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (bumpType === 'minor') {
  minor += 1;
  patch = 0;
} else if (bumpType === 'patch') {
  patch += 1;
} else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
  [major, minor, patch] = bumpType.split('.').map(Number);
} else {
  console.error(`Invalid version or bump type: ${bumpType}`);
  process.exit(1);
}

const newVersion = `${major}.${minor}.${patch}`;

// 2. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json version to ${newVersion}`);

// 3. Update android/app/build.gradle
const gradlePath = path.resolve(__dirname, '../android/app/build.gradle');
let gradleContent = fs.readFileSync(gradlePath, 'utf8');

const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
let newVersionCode = 1;
if (versionCodeMatch) {
  newVersionCode = parseInt(versionCodeMatch[1], 10) + 1;
  gradleContent = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${newVersionCode}`
  );
}

gradleContent = gradleContent.replace(
  /versionName\s+"[^"]+"/,
  `versionName "${newVersion}"`
);

fs.writeFileSync(gradlePath, gradleContent);
console.log(`Updated Android versionCode to ${newVersionCode} and versionName to ${newVersion}`);

// 4. Update ios/WaterTracker.xcodeproj/project.pbxproj
const pbxprojPath = path.resolve(__dirname, '../ios/WaterTracker.xcodeproj/project.pbxproj');
if (fs.existsSync(pbxprojPath)) {
  let pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
  pbxprojContent = pbxprojContent.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${newVersion};`
  );
  pbxprojContent = pbxprojContent.replace(
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${newVersionCode};`
  );
  fs.writeFileSync(pbxprojPath, pbxprojContent);
  console.log(`Updated iOS MARKETING_VERSION to ${newVersion} and CURRENT_PROJECT_VERSION to ${newVersionCode}`);
}

// 5. Build Android Release APK
console.log(`\nBuilding Android Release APK for v${newVersion}...`);
const rootDir = path.resolve(__dirname, '..');
execSync(
  'rm -rf android/app/src/main/assets/index.android.bundle android/app/src/main/assets/index.android.bundle.meta && cd android && ./gradlew clean assembleRelease && cd ..',
  { cwd: rootDir, stdio: 'inherit' }
);

// 6. Copy and name the APK
const srcApk = path.resolve(rootDir, 'android/app/build/outputs/apk/release/app-release.apk');
const destApkName = `WaterTracker-v${newVersion}.apk`;
const destApkPath = path.resolve(rootDir, destApkName);
const releaseApkPath = path.resolve(rootDir, `android/app/build/outputs/apk/release/${destApkName}`);

if (fs.existsSync(srcApk)) {
  fs.copyFileSync(srcApk, destApkPath);
  fs.copyFileSync(srcApk, releaseApkPath);
  console.log(`\n✅ Build successful! APK created:`);
  console.log(` - ${destApkPath}`);
  console.log(` - ${releaseApkPath}`);
} else {
  console.error(`\n❌ Error: Release APK not found at ${srcApk}`);
  process.exit(1);
}
