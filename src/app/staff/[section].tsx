import { useLocalSearchParams } from 'expo-router';
import AdminWorkspace from '@/features/staff/AdminWorkspace';
export default function StaffSection() { const { section } = useLocalSearchParams<{ section: string }>(); return <AdminWorkspace section={section} />; }
