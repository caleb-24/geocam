const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle genera migrations.js que importa archivos .sql:
// Metro debe saber resolver esa extensión.
config.resolver.sourceExts.push('sql');

module.exports = config;
