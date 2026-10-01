import { ConvexProvider, ConvexReactClient, useMutation, useQuery, useConvex, useAction } from 'convex/react';
import { anyApi } from 'convex/server';
import * as SecureStore from 'expo-secure-store';
import { Platform, Text, View } from 'react-native';
import { Component, createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/auth/ui';
import { colors, fonts } from '@/theme/tokens';
import type { BloodGroup, RequestStatus, Role, Urgency } from '../../../convex/lib/validators';

export type AppUser = { id: string; name: string; email: string; phone?: string; city: string; role: Role; notificationEnabled: boolean; accountStatus?: string; hospitalId?: string };
export type AppHospital = { id: string; name: string; city: string; address: string; latitude: number; longitude: number; contact?: string; active: boolean; verified: boolean; kind: 'hospital' | 'bloodBank' };
export type AppRequest = { id: string; requesterId: string; bloodGroup: BloodGroup; unitsRequired: number; unitsArranged: number; hospitalId: string; hospitalName: string; city: string; urgency: Urgency; requiredBefore: number; requestStatus: RequestStatus; verified: boolean; acceptedDonors: number; canCancel: boolean; canComplete: boolean; description?: string; rejectionReason?: string; createdAt: number; distanceKm?: number; aiSummary?: string; aiSuggestedUrgency?: Urgency };
export type AppSnapshot = {
  user: AppUser; donor?: { id: string; bloodGroup: BloodGroup; age: number; available: boolean; lastDonationDate?: number; neverDonated: boolean; eligibilityStatus: string; totalDonations: number; temporaryUnavailableUntil?: number };
  users: AppUser[]; hospitals: AppHospital[]; requests: AppRequest[];
  responses: { id: string; requestId: string; donorId: string; donorName?: string; bloodGroup?: BloodGroup; responseStatus: string; distanceKm?: number; matchScore?: number; confirmedUnits: number; donationConfirmed: boolean; phone?: string; contact?: string }[];
  donations: { id: string; requestId: string; donorId: string; donatedAt: number; units: number; hospitalId?: string; hospitalName: string }[];
  notifications: { id: string; title: string; body: string; read: boolean; sentAt: number; requestId?: string; type: string }[];
  stats: Record<string, number>; reports: { id: string; requestId: string; reason: string; details?: string; status: string; createdAt: number; resolution?: string }[];
  auditLogs: { id: string; action: string; entityType: string; entityId: string; createdAt: number }[]; config: Record<string, unknown>;
};
export type Assistance = { available: boolean; source: string; summary: string; message: string };
type AppContextValue = { data: AppSnapshot | null; loading: boolean; error: string | null; mode: 'demo' | 'live' | 'offline-demo'; refresh: () => Promise<void>; command: (operation: string, payload: Record<string, unknown>) => Promise<any>; assist: (requestId: string) => Promise<Assistance>; startDemo: (role: Role) => Promise<void>; signOut: () => Promise<void> };
const Context = createContext<AppContextValue | null>(null);
const sessionKey = 'blood-bank-demo-session-v1';
const url = process.env.EXPO_PUBLIC_CONVEX_URL;
const client = url ? new ConvexReactClient(url, { unsavedChangesWarning: false }) : null;
async function readToken() { return Platform.OS === 'web' ? globalThis.localStorage?.getItem(sessionKey) ?? null : SecureStore.getItemAsync(sessionKey); }
async function saveToken(token: string | null) {
  if (Platform.OS === 'web') { if (token) globalThis.localStorage?.setItem(sessionKey, token); else globalThis.localStorage?.removeItem(sessionKey); }
  else if (token) await SecureStore.setItemAsync(sessionKey, token); else await SecureStore.deleteItemAsync(sessionKey);
}
function deadline<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('The backend is unreachable. Keep your phone and laptop on the same Wi-Fi and try again.')), 15000); promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); }); });
}
function Connected({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const convex = useConvex();
  const start = useMutation(anyApi.app.startDemo);
  const mutate = useMutation(anyApi.app.command);
  const assistance = useAction(anyApi.integrations.assist);
  const snapshot = useQuery(anyApi.app.snapshot, token ? { sessionToken: token } : 'skip') as AppSnapshot | undefined;
  useEffect(() => { let active = true; void readToken().then(value => { if (active) { tokenRef.current = value; setToken(value); } }).catch(() => {}).finally(() => { if (active) setRestoring(false); }); return () => { active = false; }; }, []);
  async function startDemo(role: Role) {
    setError(null);
    try { const result = await deadline(start({ role })); await saveToken(result.sessionToken); tokenRef.current = result.sessionToken; setToken(result.sessionToken); }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'Could not open the demo.'; setError(message); throw new Error(message); }
  }
  async function command(operation: string, payload: Record<string, unknown>) {
    const activeToken = tokenRef.current;
    if (!activeToken) throw new Error('Open a demo profile first.');
    setError(null);
    try { return await deadline(mutate({ sessionToken: activeToken, operation, payload })); }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'This update could not be saved.'; setError(message); throw new Error(message); }
  }
  async function refresh() { if (!token) return; try { await deadline(convex.query(anyApi.app.snapshot, { sessionToken: token })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not refresh.'); } }
  async function assist(requestId: string) { if (!tokenRef.current) throw new Error('Open a demo profile first.'); return deadline(assistance({ sessionToken: tokenRef.current, requestId })) as Promise<Assistance>; }
  async function signOut() { tokenRef.current = null; setToken(null); setError(null); await saveToken(null); }
  return <Context.Provider value={{ data: snapshot ?? null, loading: restoring || (!!token && !snapshot), error, mode: 'demo', refresh, command, assist, startDemo, signOut }}>{children}</Context.Provider>;
}
function Unconfigured({ children }: { children: ReactNode }) {
  const fail = async () => { throw new Error('Backend setup is still required. Set EXPO_PUBLIC_CONVEX_URL and restart Expo.'); };
  return <Context.Provider value={{ data: null, loading: false, error: 'Backend connection is not configured.', mode: 'offline-demo', refresh: async () => {}, command: fail, assist: fail, startDemo: fail, signOut: async () => {} }}>{children}</Context.Provider>;
}
class SessionBoundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={{ flex: 1, justifyContent: 'center', padding: 25, gap: 18, backgroundColor: colors.background }}><Text style={{ fontFamily: fonts.bold, fontSize: 27, color: colors.burgundy }}>Reconnect your profile</Text><Text style={{ fontFamily: fonts.regular, fontSize: 17, color: colors.text }}>Your session may have expired or access changed. Reopen a demo profile to continue. Check your Wi-Fi connection if the backend is unavailable.</Text><Button label="Return to welcome" onPress={this.props.onReset} /></View>;
    return this.props.children;
  }
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const reset = () => { void saveToken(null).finally(() => setGeneration(value => value + 1)); };
  return client ? <ConvexProvider client={client}><SessionBoundary key={generation} onReset={reset}><Connected>{children}</Connected></SessionBoundary></ConvexProvider> : <Unconfigured>{children}</Unconfigured>;
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error('AppProvider is missing.'); return context; }
