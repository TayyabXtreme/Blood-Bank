import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import {
  Body,
  Button,
  Card,
  colors,
  Empty,
  Field,
  Label,
  Pill,
  Screen,
  Section,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { Hospital } from '@/domain/types';
export default function HospitalsAdmin() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [editing, setEditing] = useState(false),
    [selectedId, setSelectedId] = useState<string | undefined>(),
    [name, setName] = useState(''),
    [city, setCity] = useState(''),
    [address, setAddress] = useState(''),
    [latitude, setLatitude] = useState(''),
    [longitude, setLongitude] = useState(''),
    [contact, setContact] = useState(''),
    [verified, setVerified] = useState(false),
    [active, setActive] = useState(true),
    [error, setError] = useState('');
  const edit = (h?: Hospital) => {
    setSelectedId(h?.id);
    setName(h?.name ?? '');
    setCity(h?.city ?? '');
    setAddress(h?.address ?? '');
    setLatitude(h ? String(h.latitude) : '');
    setLongitude(h ? String(h.longitude) : '');
    setContact(h?.contact ?? '');
    setVerified(h?.verified ?? false);
    setActive(h?.active ?? true);
    setError('');
    setEditing(true);
  };
  return (
    <Screen title="Places that care." subtitle="Hospitals and receiving blood facilities." back>
      <Button title="Add a receiving facility" onPress={() => edit()} />
      {editing && (
        <Card className="mt-5 gap-4">
          <Label>{selectedId ? 'Edit hospital' : 'New hospital'}</Label>
          <Field label="Facility name" value={name} onChangeText={setName} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field label="Hospital address" value={address} onChangeText={setAddress} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Latitude"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Longitude"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Field
            label="Hospital phone (optional)"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
          <View className="flex-row items-center justify-between">
            <Label className="text-sm">Facility verified</Label>
            <Switch
              accessibilityLabel="Facility verified"
              value={verified}
              onValueChange={setVerified}
              trackColor={{ true: colors.blood }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Label className="text-sm">Accepting new requests</Label>
            <Switch
              accessibilityLabel="Accepting requests"
              value={active}
              onValueChange={setActive}
              trackColor={{ true: colors.blood }}
            />
          </View>
          {error && <Body className="text-xs text-blood">{error}</Body>}
          <Button
            title="Save facility"
            busy={busy}
            onPress={async () => {
              const lat = Number(latitude),
                lon = Number(longitude);
              if (
                !latitude.trim() ||
                !longitude.trim() ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lon) ||
                Math.abs(lat) > 90 ||
                Math.abs(lon) > 180
              ) {
                setError('Enter valid hospital coordinates.');
                return;
              }
              const result = await run(
                {
                  kind: 'saveHospital',
                  input: {
                    id: selectedId,
                    name: name.trim(),
                    city: city.trim(),
                    address: address.trim(),
                    latitude: lat,
                    longitude: lon,
                    contact: contact.trim() || undefined,
                    verified,
                    active,
                  },
                },
                'Facility saved.',
              );
              if (result.ok) setEditing(false);
            }}
          />
          <Button title="Close editor" variant="ghost" onPress={() => setEditing(false)} />
        </Card>
      )}
      <Section title="Receiving facilities" />
      {data.hospitals.map((hospital) => (
        <Pressable accessibilityRole="button" key={hospital.id} onPress={() => edit(hospital)}>
          <Card className="mb-3">
            <Label>{hospital.name}</Label>
            <Body className="mt-1 text-xs">
              {hospital.city} · {hospital.address}
            </Body>
            <View className="mt-3 flex-row gap-2">
              <Pill tone={hospital.verified ? 'green' : 'amber'}>
                {hospital.verified ? 'VERIFIED' : 'UNVERIFIED'}
              </Pill>
              <Pill tone={hospital.active ? 'neutral' : 'red'}>
                {hospital.active ? 'ACTIVE' : 'INACTIVE'}
              </Pill>
            </View>
          </Card>
        </Pressable>
      ))}
      {!data.hospitals.length && (
        <Empty
          title="Add the first facility"
          body="A verified hospital is required before community members can create a request."
        />
      )}
    </Screen>
  );
}
