export const appMode = process.env.EXPO_PUBLIC_APP_MODE === 'live' ? 'live' : 'demo';
const url = process.env.EXPO_PUBLIC_CONVEX_URL?.trim();
const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL?.trim();
const validUrl = (value?: string) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))
    );
  } catch {
    return false;
  }
};
export const serviceConfig = {
  convexUrl: url,
  authUrl: siteUrl,
  ready: validUrl(url) && validUrl(siteUrl),
};
