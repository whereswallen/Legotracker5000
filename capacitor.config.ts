import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.legotracker5000.app",
  appName: "LegoTracker5000",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#f59e0b",
      showSpinner: false,
    },
    Camera: {
      permissions: ["camera"],
    },
  },
};

export default config;
