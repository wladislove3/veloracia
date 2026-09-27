import { useMemo } from 'react';
import { useGuestProfile } from '../features/profile/hooks/useGuestProfile';
import { LoadingScreen } from '../features/profile/screens/LoadingScreen';
import { ProfileSetupScreen } from '../features/profile/screens/ProfileSetupScreen';
import { SetupRequiredScreen } from '../features/profile/screens/SetupRequiredScreen';
import RadioDashboard from '../features/radio/screens/RadioDashboard';

export default function AppRoot() {
  const { userId, profile, isLoading, error, restoreSession, saveProfile, clearProfile } = useGuestProfile();
  const sessionProfile = useMemo(() => profile && userId ? { ...profile, userId } : null, [profile, userId]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <SetupRequiredScreen error={error} onRetry={restoreSession} />;
  if (!sessionProfile) return <ProfileSetupScreen onSave={saveProfile} />;
  return <RadioDashboard profile={sessionProfile} onChangeProfile={clearProfile} />;
}
