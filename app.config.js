const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'T1Together Dev' : 'T1Together',
  scheme: IS_DEV ? 't1together-dev' : 't1together',
  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV ? 'com.t1together.app.dev' : 'com.t1together.app',
  },
  android: {
    ...config.android,
    package: IS_DEV ? 'com.t1together.app.dev' : 'com.t1together.app',
  },
});
