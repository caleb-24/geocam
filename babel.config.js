module.exports = function (api) {
  api.cache(true);
  return {
    // El proyecto no usa NativeWind: solo se conserva el preset base de Expo
    // y se agrega el plugin inline-import para embeber los .sql de Drizzle.
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
