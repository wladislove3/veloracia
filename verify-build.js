#!/usr/bin/env node

/**
 * Veloraz Pre-Launch Verification Script
 * Checks for common issues before building for Android
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

console.log('\n🔍 Veloraz Pre-Launch Verification\n');

const checks = [];

// 1. Check package.json dependencies
console.log('1️⃣  Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const requiredDeps = [
    'react',
    'react-native',
    'expo',
    'expo-audio',
    'expo-location',
    'firebase',
    'react-native-uuid'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  if (missingDeps.length === 0) {
    console.log('   ✅ All required dependencies present\n');
    checks.push({ task: 'Dependencies', status: 'PASS' });
  } else {
    console.log(`   ❌ Missing: ${missingDeps.join(', ')}\n`);
    checks.push({ task: 'Dependencies', status: 'FAIL' });
  }
} catch (e) {
  console.log(`   ❌ Error reading package.json: ${e.message}\n`);
  checks.push({ task: 'Dependencies', status: 'FAIL' });
}

// 2. Check environment files
console.log('2️⃣  Checking environment configuration...');
const hasEnvLocal = fs.existsSync(path.join(projectRoot, '.env.local'));
const hasEnvExample = fs.existsSync(path.join(projectRoot, '.env.example'));
const hasGitignore = fs.existsSync(path.join(projectRoot, '.gitignore'));

if (hasEnvLocal && hasEnvExample) {
  console.log('   ✅ .env.local and .env.example present');
} else {
  console.log(`   ⚠️  .env.local: ${hasEnvLocal ? '✅' : '❌'}, .env.example: ${hasEnvExample ? '✅' : '❌'}`);
}

if (hasGitignore) {
  const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
  if (gitignore.includes('.env.local') || gitignore.includes('.env*.local')) {
    console.log('   ✅ .env.local is in .gitignore\n');
    checks.push({ task: 'Environment Config', status: 'PASS' });
  } else {
    console.log('   ❌ .env.local NOT in .gitignore (security risk!)\n');
    checks.push({ task: 'Environment Config', status: 'FAIL' });
  }
} else {
  console.log('   ⚠️  .gitignore not found\n');
  checks.push({ task: 'Environment Config', status: 'WARN' });
}

// 3. Check app.json for Android
console.log('3️⃣  Checking app.json Android configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
  const android = appJson.expo?.android;
  
  const androidChecks = [
    { key: 'package', required: true },
    { key: 'versionCode', required: true },
    { key: 'permissions', required: true }
  ];
  
  let androidOk = true;
  androidChecks.forEach(check => {
    const hasKey = check.key in android;
    if (check.required && !hasKey) {
      console.log(`   ❌ Missing: android.${check.key}`);
      androidOk = false;
    }
  });
  
  if (androidOk) {
    console.log(`   ✅ Package: ${android.package}`);
    console.log(`   ✅ Version Code: ${android.versionCode}`);
    console.log(`   ✅ Permissions: ${android.permissions?.length || 0} defined\n`);
    checks.push({ task: 'App.json Android Config', status: 'PASS' });
  } else {
    console.log('');
    checks.push({ task: 'App.json Android Config', status: 'FAIL' });
  }
} catch (e) {
  console.log(`   ❌ Error reading app.json: ${e.message}\n`);
  checks.push({ task: 'App.json Android Config', status: 'FAIL' });
}

// 4. Check for critical files
console.log('4️⃣  Checking critical files...');
const criticalFiles = [
  { file: 'App.js', type: 'source' },
  { file: 'package.json', type: 'config' },
  { file: 'app.json', type: 'config' },
  { file: 'PRIVACY_POLICY.md', type: 'legal' },
  { file: 'TERMS_OF_SERVICE.md', type: 'legal' },
  { file: 'ANDROID_SUBMISSION_CHECKLIST.md', type: 'doc' }
];

let filesOk = true;
criticalFiles.forEach(({ file, type }) => {
  const exists = fs.existsSync(path.join(projectRoot, file));
  if (!exists) {
    console.log(`   ❌ Missing: ${file}`);
    filesOk = false;
  }
});

if (filesOk) {
  console.log('   ✅ All critical files present\n');
  checks.push({ task: 'Critical Files', status: 'PASS' });
} else {
  console.log('');
  checks.push({ task: 'Critical Files', status: 'FAIL' });
}

// 5. Check Firebase config
console.log('5️⃣  Checking Firebase configuration...');
try {
  const firebaseConfig = fs.readFileSync(path.join(projectRoot, 'services', 'firebaseConfig.js'), 'utf8');
  const usesEnv = firebaseConfig.includes('process.env.EXPO_PUBLIC_FIREBASE');
  
  if (usesEnv) {
    console.log('   ✅ Firebase uses environment variables\n');
    checks.push({ task: 'Firebase Config', status: 'PASS' });
  } else {
    console.log('   ❌ Firebase uses hardcoded credentials\n');
    checks.push({ task: 'Firebase Config', status: 'FAIL' });
  }
} catch (e) {
  console.log(`   ⚠️  Could not verify: ${e.message}\n`);
  checks.push({ task: 'Firebase Config', status: 'WARN' });
}

// Summary
console.log('\n📊 Verification Summary\n');
console.log('┌─────────────────────────────────┬──────────┐');
console.log('│ Check                           │ Status   │');
console.log('├─────────────────────────────────┼──────────┤');

checks.forEach(check => {
  const status = check.status === 'PASS' ? '✅ PASS' : check.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN';
  const taskName = check.task.padEnd(31);
  console.log(`│ ${taskName} │ ${status.padEnd(8)} │`);
});

console.log('└─────────────────────────────────┴──────────┘\n');

const passCount = checks.filter(c => c.status === 'PASS').length;
const failCount = checks.filter(c => c.status === 'FAIL').length;

if (failCount === 0) {
  console.log(`✅ All checks passed! (${passCount}/${checks.length})\n`);
  console.log('Next steps:');
  console.log('  1. npx expo start --tunnel');
  console.log('  2. Scan QR code with Android device or Expo Go');
  console.log('  3. Test all features (recording, playback, location, permissions)');
  console.log('  4. When ready: eas build --platform android\n');
  process.exit(0);
} else {
  console.log(`❌ Some checks failed! (${failCount} issues)\n`);
  console.log('Please fix the issues above before proceeding.\n');
  process.exit(1);
}
