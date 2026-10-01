import { createContext, ReactNode, ComponentProps, useContext, useState, useCallback } from 'react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { AppSnapshot, Command, Role } from '@/domain/types';
import { createDemo, demoAccounts, demoSnapshot, DemoState, simulateCommand } from '@/data/demo';
import { authClient } from '@/lib/auth-client';
import { appMode, serviceConfig } from '@/lib/config';
import { defaultSettings } from '@/domain/rules';

const empty: AppSnapshot = {
  user: null,
  donor: null,
  hospitals: [],
  requests: [],
  responses: [],
  notifications: [],
  donations: [],
  users: [],
  reports: [],
  audits: [],
  settings: defaultSettings,
  stats: { donors: 0, requests: 0, donations: 0 },
};
interface AppContextValue {
  data: AppSnapshot;
  mode: 'demo' | 'live';
  authenticated: boolean;
  loading: boolean;
  sessionName: string;
  sessionEmail: string;
  execute: (command: Command) => Promise<string | undefined>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: (role: Role) => void;
  resetDemo: () => void;
  refresh: () => Promise<void>;
  registerDevice: (token: string, platform: 'android' | 'ios') => Promise<void>;
  toast: string | null;
  showToast: (message: string | null) => void;
}
const Context = createContext<AppContextValue | null>(null);
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider is missing.');
  return context;
}
export function useCommand() {
  const { execute, showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const run = async (command: Command, success?: string) => {
    setBusy(true);
    try {
      const result = await execute(command);
      if (success) showToast(success);
      return { ok: true, result };
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message.replace(/^\[CONVEX[^\]]*\]\s*/, '')
          : 'Something went wrong. Please try again.',
      );
      return { ok: false, result: undefined };
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}
function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createDemo());
  const [toast, showToast] = useState<string | null>(null);
  const data = demoSnapshot(state);
  const execute = useCallback(
    async (command: Command) => {
      const next = simulateCommand(state, command);
      setState(next.state);
      return next.result;
    },
    [state],
  );
  const selectDemo = (role: Role) =>
    setState((previous) => ({
      ...previous,
      selectedUserId: demoAccounts.find((a) => a.role === role)!.userId,
    }));
  return (
    <Context.Provider
      value={{
        data,
        mode: 'demo',
        authenticated: !!data.user,
        loading: false,
        sessionName: data.user?.name ?? '',
        sessionEmail: data.user?.email ?? '',
        execute,
        signIn: async (email) => {
          const account = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (!account)
            throw new Error('Use a sample account or choose a demo role from the welcome screen.');
          setState((s) => ({ ...s, selectedUserId: account.id }));
        },
        signUp: async (name, email) => {
          if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
            throw new Error('This demo email is already in use.');
          const user = {
            id: `demo-new-${Date.now()}`,
            name,
            email,
            role: 'requester' as const,
            city: '',
            status: 'active' as const,
            onboardingCompleted: false,
            createdAt: Date.now(),
          };
          setState((s) => ({ ...s, users: [...s.users, user], selectedUserId: user.id }));
        },
        signOut: async () => setState((s) => ({ ...s, selectedUserId: null })),
        enterDemo: selectDemo,
        resetDemo: () => {
          setState(createDemo());
          showToast('Sample data reset.');
        },
        refresh: async () => {
          setState((s) => ({
            ...s,
            requests: s.requests.map((r) =>
              r.requiredBefore <= Date.now() &&
              ['pending', 'active', 'contacted', 'partial'].includes(r.status)
                ? { ...r, status: 'expired' }
                : r,
            ),
          }));
        },
        registerDevice: async () => {
          throw new Error('Push delivery is available after connecting live services.');
        },
        toast,
        showToast,
      }}
    >
      {children}
    </Context.Provider>
  );
}
function LiveState({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const snapshot = useQuery(api.app.snapshot, isAuthenticated ? {} : 'skip');
  const onboard = useMutation(api.users.onboard),
    updateProfile = useMutation(api.users.updateProfile),
    manageUser = useMutation(api.users.manage),
    updateDonor = useMutation(api.donors.update),
    createRequest = useMutation(api.requests.create),
    verify = useMutation(api.requests.verify),
    cancel = useMutation(api.requests.cancel),
    complete = useMutation(api.requests.complete),
    respond = useMutation(api.responses.respond),
    confirm = useMutation(api.responses.confirmDonation),
    read = useMutation(api.notifications.markRead),
    register = useMutation(api.notifications.registerDevice),
    unregister = useMutation(api.notifications.unregisterDevice),
    report = useMutation(api.reports.create),
    resolve = useMutation(api.reports.resolve),
    hospital = useMutation(api.hospitals.save),
    settings = useMutation(api.settings.update);
  const setLocation = useMutation(api.donors.setLocation);
  const [toast, showToast] = useState<string | null>(null);
  const execute = async (c: Command): Promise<string | undefined> => {
    switch (c.kind) {
      case 'onboard':
        return await onboard(c.input);
      case 'createRequest':
        return await createRequest({
          ...c.input,
          hospitalId: c.input.hospitalId as Id<'hospitals'>,
        });
      case 'updateProfile':
        await updateProfile({ name: c.name, city: c.city, phone: c.phone });
        break;
      case 'updateDonor':
        await updateDonor(c.input);
        break;
      case 'updateLocation':
        await setLocation({ latitude: c.latitude, longitude: c.longitude, city: c.city });
        break;
      case 'respond':
        await respond({ responseId: c.responseId as Id<'donorResponses'>, accept: c.accept });
        break;
      case 'verify':
        await verify({
          requestId: c.requestId as Id<'bloodRequests'>,
          approve: c.approve,
          reason: c.reason,
        });
        break;
      case 'confirmDonation':
        await confirm({ responseId: c.responseId as Id<'donorResponses'> });
        break;
      case 'cancelRequest':
        await cancel({ requestId: c.requestId as Id<'bloodRequests'> });
        break;
      case 'completeRequest':
        await complete({ requestId: c.requestId as Id<'bloodRequests'> });
        break;
      case 'readNotification':
        await read({ notificationId: c.notificationId as Id<'notifications'> });
        break;
      case 'readAllNotifications':
        await read({});
        break;
      case 'report':
        await report({
          requestId: c.requestId as Id<'bloodRequests'>,
          reason: c.reason,
          details: c.details,
        });
        break;
      case 'resolveReport':
        await resolve({ reportId: c.reportId as Id<'reports'>, dismiss: c.dismiss });
        break;
      case 'manageUser':
        await manageUser({
          userId: c.userId as Id<'users'>,
          role: c.role,
          status: c.status,
          hospitalId: c.hospitalId as Id<'hospitals'> | undefined,
        });
        break;
      case 'saveHospital':
        await hospital({ ...c.input, id: c.input.id as Id<'hospitals'> | undefined });
        break;
      case 'updateSettings':
        await settings(c.input);
        break;
    }
  };
  const [pushToken, setPushToken] = useState<string | null>(null);
  return (
    <Context.Provider
      value={{
        data: snapshot ?? empty,
        mode: 'live',
        authenticated: !!session?.user,
        loading:
          isPending ||
          (!!session?.user && (isLoading || !isAuthenticated || snapshot === undefined)),
        sessionName: session?.user.name ?? '',
        sessionEmail: session?.user.email ?? '',
        execute,
        signIn: async (email, password) => {
          const result = await authClient.signIn.email({ email, password });
          if (result.error) throw new Error(result.error.message ?? 'Unable to sign in.');
        },
        signUp: async (name, email, password) => {
          const result = await authClient.signUp.email({ name, email, password });
          if (result.error) throw new Error(result.error.message ?? 'Unable to create account.');
        },
        signOut: async () => {
          if (pushToken) {
            await unregister({ token: pushToken });
            setPushToken(null);
          }
          const result = await authClient.signOut();
          if (result.error) throw new Error(result.error.message ?? 'Unable to sign out.');
        },
        enterDemo: () => {},
        resetDemo: () => {},
        refresh: async () => {},
        registerDevice: async (token, platform) => {
          await register({ token, platform });
          setPushToken(token);
        },
        toast,
        showToast,
      }}
    >
      {children}
    </Context.Provider>
  );
}
const client =
  appMode === 'live' && serviceConfig.ready
    ? new ConvexReactClient(serviceConfig.convexUrl!, { unsavedChangesWarning: false })
    : null;
export function AppProvider({ children }: { children: ReactNode }) {
  if (appMode === 'demo') return <DemoProvider>{children}</DemoProvider>;
  if (!client)
    return (
      <Context.Provider
        value={{
          data: empty,
          mode: 'live',
          authenticated: false,
          loading: false,
          sessionName: '',
          sessionEmail: '',
          execute: async () => {
            throw new Error('Connect your Convex services first.');
          },
          signIn: async () => {
            throw new Error('Connect your Convex services first.');
          },
          signUp: async () => {
            throw new Error('Connect your Convex services first.');
          },
          signOut: async () => {},
          enterDemo: () => {},
          resetDemo: () => {},
          refresh: async () => {},
          registerDevice: async () => {},
          toast: null,
          showToast: () => {},
        }}
      >
        {children}
      </Context.Provider>
    );
  // The component's 0.12.x declaration infers useSession().data as never with
  // Better Auth 1.6.33. Keep this compatibility assertion at the vendor boundary.
  const providerClient = authClient as unknown as ComponentProps<
    typeof ConvexBetterAuthProvider
  >['authClient'];
  return (
    <ConvexBetterAuthProvider client={client} authClient={providerClient}>
      <LiveState>{children}</LiveState>
    </ConvexBetterAuthProvider>
  );
}
