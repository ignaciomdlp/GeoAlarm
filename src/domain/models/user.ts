export interface UserProfile {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  themePreference: 'dark' | 'light' | 'system';
  batteryExemptionGranted: boolean;
  cloudSyncEnabled: boolean;
}
