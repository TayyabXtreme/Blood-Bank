import MapView, { Marker } from 'react-native-maps';
import { Platform, View } from 'react-native';
import { Hospital } from '@/domain/types';
import { Body, Card, Label } from './ui';
export default function HospitalMap({ hospital }: { hospital: Hospital }) {
  if (Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
    return (
      <Card className="my-4 bg-[#EEF1EA]">
        <Label>{hospital.name}</Label>
        <Body className="mt-2">{hospital.address}</Body>
        <Body className="mt-2 text-xs">Open directions to see the hospital in your maps app.</Body>
      </Card>
    );
  return (
    <View className="my-4 h-48 overflow-hidden rounded-[24px]">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        scrollEnabled={false}
      >
        <Marker
          coordinate={{ latitude: hospital.latitude, longitude: hospital.longitude }}
          title={hospital.name}
          pinColor="#BC2846"
        />
      </MapView>
    </View>
  );
}
