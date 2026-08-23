module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        config.extra?.eas?.projectId ??
        '0e561455-1729-497b-b5a0-15e8cf859d4f',
    },
  },
});
