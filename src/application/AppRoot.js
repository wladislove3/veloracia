import { useMemo } from 'react';
import { useGuestProfile } from '../features/profile/useGuestProfile';
import { LoadingScreen, ProfileSetup, SetupRequired } from '../features/profile/components/ProfileScreens';
import RadioDashboard from '../features/radio/screens/RadioDashboard';

export default function AppRoot() {
  const { userId, profile, isLoading, error, restoreSession, saveProfile, clearProfile } = useGuestProfile();
  const sessionProfile = useMemo(() => profile && userId ? { ...profile, userId } : null, [profile, userId]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <SetupRequired message={error} onRetry={restoreSession} />;
  if (!sessionProfile) return <ProfileSetup onSave={saveProfile} />;
  return <RadioDashboard profile={sessionProfile} onChangeProfile={clearProfile} />;
}
