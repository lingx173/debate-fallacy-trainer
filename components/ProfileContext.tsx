'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Profile = {
  id: string; // uuid from supabase
  name: string;
  avatar_emoji: string;
};

type Ctx = {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  loading: boolean;
};

const ProfileContext = createContext<Ctx>({ profile: null, setProfile: () => {}, loading: true });

const STORAGE_KEY = 'fallacy-forum-profile-id';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/profiles/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) setProfileState(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setProfile(p: Profile | null) {
    setProfileState(p);
    if (p) localStorage.setItem(STORAGE_KEY, p.id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
