module.exports = ({ config }) => {
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(mapsApiKey ? { googleMaps: { apiKey: mapsApiKey } } : {}),
      },
    },
  };
};
