import React, { createContext, useContext, ReactNode, useEffect, useMemo, useState, useCallback } from 'react';
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

type PreferencesData = {
  language: 'fr' | 'en';
  theme: 'light' | 'dark';
  stockAlerts: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
};

export type LocalAccount = {
  email: string;
  passwordHash: string;
  name: string;
  businessName: string;
  businessSector: string;
  city: string;
  plan: string;
  active: boolean;
  createdAt: string;
};

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  logout: () => void;
  profileData: ProfileData;
  updateProfileData: (patch: Partial<ProfileData>) => void;
  updateFullName: (fullName: string) => void;
  preferencesData: PreferencesData;
  updatePreferencesData: (patch: Partial<PreferencesData>) => void;
  saveLocalAccount: (account: Omit<LocalAccount, 'createdAt'>) => void;
  loginWithLocalAccount: (email: string, password: string) => boolean;
  localUser: LocalAccount | null;
  localLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'lb_stay_profile';
const PREFERENCES_STORAGE_KEY = 'lb_stay_preferences';
const LOCAL_ACCOUNTS_KEY = 'lb_stay_local_accounts';
const LOCAL_SESSION_KEY = 'lb_stay_local_session';

const DEFAULT_PROFILE: ProfileData = {
  fullName: 'Demo Manager',
  email: 'manager@lbstay.cloud',
  phone: '+237 699 123 456',
  avatarUrl: '',
};

const DEFAULT_PREFERENCES: PreferencesData = {
  language: 'fr',
  theme: 'dark',
  stockAlerts: {
    email: true,
    sms: true,
    whatsapp: true,
  },
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

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

function readPreferencesData(): PreferencesData {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PreferencesData>;
    return {
      language: parsed.language === 'en' ? 'en' : 'fr',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      stockAlerts: {
        email: parsed.stockAlerts?.email ?? DEFAULT_PREFERENCES.stockAlerts.email,
        sms: parsed.stockAlerts?.sms ?? DEFAULT_PREFERENCES.stockAlerts.sms,
        whatsapp: parsed.stockAlerts?.whatsapp ?? DEFAULT_PREFERENCES.stockAlerts.whatsapp,
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function readLocalAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalSession(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalAccount;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(() => readProfileData());
  const [preferencesData, setPreferencesData] = useState<PreferencesData>(() => readPreferencesData());
  const [localUser, setLocalUser] = useState<LocalAccount | null>(() => readLocalSession());

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
    if (userError && !localUser && !PUBLIC_ROUTES.includes(location)) {
      setLocation('/login');
    }
  }, [userError, localUser, location, setLocation]);

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
      const srcEmail = localUser?.email || user?.email || DEFAULT_PROFILE.email;
      const srcName  = localUser?.name  || user?.name  || DEFAULT_PROFILE.fullName;
      return {
        ...prev,
        fullName: prev.fullName === DEFAULT_PROFILE.fullName ? srcName  : prev.fullName,
        email:    prev.email    === DEFAULT_PROFILE.email    ? srcEmail : prev.email,
      };
    });
  }, [user, localUser]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  }, [profileData]);

  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferencesData));
  }, [preferencesData]);

  const updateProfileData = useCallback((patch: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...patch }));
  }, []);

  const updateFullName = useCallback((fullName: string) => {
    setProfileData(prev => ({ ...prev, fullName }));
  }, []);

  const updatePreferencesData = useCallback((patch: Partial<PreferencesData>) => {
    setPreferencesData(prev => ({
      ...prev,
      ...patch,
      stockAlerts: {
        ...prev.stockAlerts,
        ...patch.stockAlerts,
      },
    }));
  }, []);

  const saveLocalAccount = useCallback((account: Omit<LocalAccount, 'createdAt'>) => {
    const accounts = readLocalAccounts();
    const existing = accounts.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
    const entry: LocalAccount = { ...account, active: true, createdAt: new Date().toISOString() };
    if (existing >= 0) {
      accounts[existing] = entry;
    } else {
      accounts.push(entry);
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }, []);

  const loginWithLocalAccount = useCallback((email: string, password: string): boolean => {
    const accounts = readLocalAccounts();
    const hash = simpleHash(password);
    const match = accounts.find(a =>
      a.email.toLowerCase() === email.toLowerCase() && a.passwordHash === hash
    );
    if (match) {
      setLocalUser(match);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(match));
      setProfileData(prev => ({
        ...prev,
        fullName: match.name || prev.fullName,
        email: match.email,
      }));
      return true;
    }
    return false;
  }, []);

  const localLogout = useCallback(() => {
    setLocalUser(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }, []);

  const logout = useCallback(() => {
    localLogout();
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    sessionStorage.clear();
    queryClient.clear();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    toast({ title: 'Vous avez été déconnecté avec succès' });
    setLocation('/login');
  }, [localLogout, queryClient, setLocation]);

  const effectiveUser = user || (localUser ? ({
    id: 0,
    email: localUser.email,
    name: localUser.name,
    role: 'ADMIN',
    businessId: 1,
  } as unknown as User) : null);

  const effectiveBusiness = currentBusiness || (localUser ? ({
    id: 1,
    name: localUser.businessName,
    sector: localUser.businessSector || 'RESTAURANT',
    city: localUser.city || 'Douala',
    ownerId: 0,
    subscriptionPlan: localUser.plan || 'PRO',
    isActive: true,
    createdAt: localUser.createdAt,
  } as unknown as Business) : null);

  const isLoading = isUserLoading || (!!user?.businessId && isBusinessesLoading);

  const value = useMemo(() => ({
    user: effectiveUser,
    business: effectiveBusiness,
    isLoading,
    logout,
    profileData,
    updateProfileData,
    updateFullName,
    preferencesData,
    updatePreferencesData,
    saveLocalAccount,
    loginWithLocalAccount,
    localUser,
    localLogout,
  }), [effectiveUser, effectiveBusiness, isLoading, logout, profileData, updateProfileData, updateFullName, preferencesData, updatePreferencesData, saveLocalAccount, loginWithLocalAccount, localUser, localLogout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { simpleHash };
