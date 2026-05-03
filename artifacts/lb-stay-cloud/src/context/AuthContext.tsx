import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetMe, useListBusinesses, User, Business, getGetMeQueryKey, getListBusinessesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const PUBLIC_ROUTES = ['/login', '/activate', '/signup'];

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);

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

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    toast({ title: 'Vous avez été déconnecté avec succès' });
    setLocation('/login');
  };

  const isLoading = isUserLoading || (!!user?.businessId && isBusinessesLoading);

  return (
    <AuthContext.Provider value={{ user: user || null, business: currentBusiness, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
