import * as Location from 'expo-location';
export async function approximateLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted')
    throw new Error('Location permission was declined. You can select a city instead.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: Math.round(position.coords.latitude * 100) / 100,
    longitude: Math.round(position.coords.longitude * 100) / 100,
  };
}
