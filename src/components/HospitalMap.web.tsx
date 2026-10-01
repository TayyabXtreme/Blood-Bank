import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Hospital } from '@/domain/types';
import { Body, colors, Label } from './ui';
export default function HospitalMap({ hospital }: { hospital: Hospital }) {
  return (
    <View className="my-4 items-center justify-center rounded-[24px] border border-line bg-[#EEF1EA] px-5 py-8">
      <MapPin size={32} color={colors.blood} />
      <Label className="mt-3">{hospital.name}</Label>
      <Body className="text-center">{hospital.address}</Body>
      <Body className="mt-2 text-xs">Use directions to open your maps app.</Body>
    </View>
  );
}
