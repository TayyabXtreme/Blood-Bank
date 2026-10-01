import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Chip, Empty, Field, Label, Notice, Screen } from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { cities } from '@/data/demo';
import { approximateLocation } from '@/hooks/useLocation';
export default function DonorLocation() {
  const { data, showToast } = useApp(),
    { run, busy } = useCommand(),
    [city, setCity] = useState(data.donor?.city ?? 'Hyderabad'),
    [latitude, setLatitude] = useState(data.donor?.latitude ?? cities[0].latitude),
    [longitude, setLongitude] = useState(data.donor?.longitude ?? cities[0].longitude),
    [locating, setLocating] = useState(false);
  if (!data.donor)
    return (
      <Screen title="Your area" back>
        <Empty
          title="Donor profile required"
          body="This screen manages the approximate area used for donor matching."
        />
      </Screen>
    );
  return (
    <Screen title="Keep help close." subtitle="Update the area used to match nearby requests." back>
      <Notice>
        We store rounded coordinates for matching. Your home address and coordinates are never shown
        to requesters. City selection is a permission-free alternative.
      </Notice>
      <View className="my-6 flex-row flex-wrap gap-2">
        {cities.map((c) => (
          <Chip
            key={c.name}
            title={c.name}
            selected={city === c.name}
            onPress={() => {
              setCity(c.name);
              setLatitude(c.latitude);
              setLongitude(c.longitude);
            }}
          />
        ))}
      </View>
      <Field label="City" value={city} onChangeText={setCity} />
      <Button
        className="my-5"
        title="Use my approximate location"
        busy={locating}
        variant="secondary"
        onPress={async () => {
          setLocating(true);
          try {
            const location = await approximateLocation();
            setLatitude(location.latitude);
            setLongitude(location.longitude);
          } catch (e) {
            showToast(e instanceof Error ? e.message : 'Location unavailable.');
          } finally {
            setLocating(false);
          }
        }}
      />
      <Card>
        <Label>Selected matching area</Label>
        <Body className="mt-2">
          {city} · {latitude.toFixed(2)}, {longitude.toFixed(2)}
        </Body>
      </Card>
      <Button
        className="mt-6"
        title="Save matching area"
        busy={busy}
        onPress={() =>
          run(
            { kind: 'updateLocation', city, latitude, longitude },
            'Your matching area is updated.',
          )
        }
      />
    </Screen>
  );
}
