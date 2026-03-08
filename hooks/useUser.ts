import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/user';
import { getUserProfile, saveUserProfile } from '../utils/storage';

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile().then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    const updated: UserProfile = {
      onboardingComplete: true,
      isPremium: user?.isPremium ?? false,
      createdAt: user?.createdAt ?? new Date().toISOString(),
    };
    await saveUserProfile(updated);
    setUser(updated);
  }, [user]);

  const setIsPremium = useCallback(async (isPremium: boolean) => {
    if (!user) return;
    const updated = { ...user, isPremium };
    await saveUserProfile(updated);
    setUser(updated);
  }, [user]);

  const resetUser = useCallback(async () => {
    const fresh: UserProfile = {
      onboardingComplete: false,
      isPremium: false,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(fresh);
    setUser(fresh);
  }, []);

  return { user, loading, completeOnboarding, setIsPremium, resetUser };
}
