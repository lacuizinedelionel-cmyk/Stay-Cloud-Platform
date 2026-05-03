import React, { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetMe, useListBusinesses, User, Business, getGetMeQueryKey, getListBusinessesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const PUBLIC_ROUTES = ['/login', '/activate', '/signup'];

type ProfileData = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  logout: () => void;
  profileData: ProfileData;
  updateProfileData: (patch: Partial<ProfileData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'lb_stay_profile';

const DEFAULT_PROFILE: ProfileData = {
  fullName: 'Demo Manager',
  email: 'manager@lbstay.cloud',
  phone: '+237 699 123 456',
  avatarUrl: '',
};

function readProfileData(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<ProfileData>;
    return {
      fullName: parsed.fullName || DEFAULT_PROFILE.fullName,
      email: parsed.email || DEFAULT_PROFILE.email,
      phone: parsed.phone || DEFAULT_PROFILE.phone,
      avatarUrl: parsed.avatarUrl || DEFAULT_PROFILE.avatarUrl,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(() => readProfileData());

  const { data: user, isLoading: isUserLoading, error: userError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const { data: businesses, isLoading: isBusinessesLoading } = useListBusinesses(undefined, {
    query: {
      queryKey: getListBusinessesQueryKey(),
      enabled: !!user?.businessId,
    }
  });

  const [location] = useLocation();

  useEffect(() => {
    if (userError && !PUBLIC_ROUTES.includes(location)) {
      setLocation('/login');
    }
  }, [userError, location, setLocation]);

  useEffect(() => {
    if (user?.businessId && businesses) {
      const biz = businesses.find(b => b.id === user.businessId);
      if (biz) {
        setCurrentBusiness(biz);
      }
    }
  }, [user, businesses]);

  useEffect(() => {
    setProfileData(prev => {
      const nextEmail = user?.email || DEFAULT_PROFILE.email;
      const nextName = user?.name || DEFAULT_PROFILE.fullName;
      return {
        ...prev,
        fullName: prev.fullName === DEFAULT_PROFILE.fullName ? nextName : prev.fullName,
        email: prev.email === DEFAULT_PROFILE.email ? nextEmail : prev.email,
      };
    });
  }, [user]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  }, [profileData]);

  const updateProfileData = (patch: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...patch }));
  };

  const logout = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    sessionStorage.clear();
    queryClient.clear();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    toast({ title: 'Vous avez été déconnecté avec succès' });
    setLocation('/login');
  };

  const isLoading = isUserLoading || (!!user?.businessId && isBusinessesLoading);
  const value = useMemo(() => ({
    user: user || null,
    business: currentBusiness,
    isLoading,
    logout,
    profileData,
    updateProfileData,
  }), [currentBusiness, isLoading, profileData, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
