import { createContext, useContext, useState, type ReactNode } from 'react';

// Local UI state only. Never stores passwords, sessions or authentication claims.
const PreviewContext = createContext<{ email: string; setEmail: (email: string) => void }>({ email: '', setEmail: () => {} });

export function AuthPreviewProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  return <PreviewContext.Provider value={{ email, setEmail }}>{children}</PreviewContext.Provider>;
}

export const useAuthPreview = () => useContext(PreviewContext);
export const emailRules = {
  required: 'Enter your email address.',
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
};
