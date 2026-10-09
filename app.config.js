const fs = require('fs');
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);
const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'T1DReach Dev' : 'T1DReach',
  // Keep the existing iOS identifiers for App Store/auth compatibility.
  // Android production uses the final Google Play package created for T1DReach.
  scheme: IS_DEV ? 't1together-dev' : 't1together',
  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV ? 'com.t1together.app.dev' : 'com.t1together.app',
  },
  android: {
    ...config.android,
    ...(googleServicesFile ? {googleServicesFile} : {}),
    package: IS_DEV ? 'com.t1together.app.dev' : 'com.t1dreach.app',
  },
});
