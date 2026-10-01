import * as Location from 'expo-location';

export type DeviceCity = {
  permission: 'granted' | 'denied' | 'unavailable';
  city: string | null;
  latitude?: number;
  longitude?: number;
};

async function withTimeout<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Location timed out.')), milliseconds);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function requestDeviceCity(): Promise<DeviceCity> {
  if (!await Location.hasServicesEnabledAsync()) return { permission: 'unavailable', city: null };
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return { permission: 'denied', city: null };
  try {
    const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }), 20000);
    const addresses = await withTimeout(Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude }), 8000);
    const city = addresses[0]?.city || addresses[0]?.subregion || null;
    // Coordinates are used only by the private donor profile for matching.
    return { permission: 'granted', city, latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    // A failed city lookup never changes the actual OS permission result.
    return { permission: 'granted', city: null };
  }
}
