import { useMemo } from 'react';
import { useParams, Redirect } from 'wouter';
import SettingsPage from './settings';
import { useAuth } from '@/context/AuthContext';

export default function BusinessSettingsPage() {
  const { id } = useParams();
  const { business } = useAuth();
  const canAccess = useMemo(() => business && String(business.id) === String(id), [business, id]);

  if (!business) return <Redirect to="/login" />;
  if (!canAccess) return <Redirect to="/settings" />;

  return <SettingsPage />;
}