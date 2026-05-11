import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'hu.shadowarts.app',
  appName: 'ShadowArts',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;