import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import {
  Body,
  Button,
  Card,
  Chip,
  colors,
  Empty,
  Field,
  Label,
  Notice,
  Pill,
  Screen,
  Section,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { Role, User } from '@/domain/types';
export default function UsersAdmin() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<User | null>(null),
    [role, setRole] = useState<Role>('requester'),
    [status, setStatus] = useState<User['status']>('active'),
    [hospitalId, setHospitalId] = useState('');
  const users = data.users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Screen title="People make the network." subtitle="Manage access with care." back>
      <Field
        label="Find a person"
        placeholder="Name, email, or role"
        value={query}
        onChangeText={setQuery}
      />
      {selected && (
        <Card className="my-5">
          <Label>{selected.name}</Label>
          <Body className="mb-4 text-xs">{selected.email}</Body>
          <Label className="mb-3 text-xs">Role</Label>
          <View className="flex-row flex-wrap gap-2">
            {(['requester', 'donor', 'coordinator', 'admin'] as const).map((r) => (
              <Chip key={r} title={r} selected={r === role} onPress={() => setRole(r)} />
            ))}
          </View>
          {role === 'coordinator' && (
            <>
              <Label className="mb-3 mt-5 text-xs">Assigned hospital</Label>
              <View className="gap-2">
                {data.hospitals
                  .filter((h) => h.active)
                  .map((h) => (
                    <Chip
                      key={h.id}
                      title={h.name}
                      selected={h.id === hospitalId}
                      onPress={() => setHospitalId(h.id)}
                    />
                  ))}
              </View>
            </>
          )}
          <View className="my-5 flex-row items-center justify-between">
            <Label className="text-sm">Account active</Label>
            <Switch
              accessibilityLabel="Account active"
              value={status === 'active'}
              onValueChange={(v) => setStatus(v ? 'active' : 'suspended')}
              trackColor={{ true: colors.blood }}
            />
          </View>
          <Notice>
            Only grant hospital or administrator access to authorized people. Donor access requires
            an existing donor profile.
          </Notice>
          <Button
            className="mt-4"
            title="Save account access"
            disabled={selected.id === data.user?.id || (role === 'coordinator' && !hospitalId)}
            busy={busy}
            onPress={async () => {
              const result = await run(
                {
                  kind: 'manageUser',
                  userId: selected.id,
                  role,
                  status,
                  hospitalId: role === 'coordinator' ? hospitalId : undefined,
                },
                'Account access updated.',
              );
              if (result.ok) setSelected(null);
            }}
          />
          <Button title="Close editor" variant="ghost" onPress={() => setSelected(null)} />
        </Card>
      )}
      <Section title={`${users.length} people`} />
      {users.map((user) => (
        <Pressable
          key={user.id}
          accessibilityRole="button"
          disabled={user.id === data.user?.id}
          onPress={() => {
            setSelected(user);
            setRole(user.role);
            setStatus(user.status);
            setHospitalId(user.hospitalId ?? '');
          }}
        >
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Label className="text-sm">
                  {user.name}
                  {user.id === data.user?.id ? ' (you)' : ''}
                </Label>
                <Body className="text-[11px]">{user.email}</Body>
                <Body className="text-[10px]">{user.city}</Body>
              </View>
              <View className="gap-2">
                <Pill>{user.role.toUpperCase()}</Pill>
                {user.status === 'suspended' && <Pill tone="red">SUSPENDED</Pill>}
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
      {!users.length && <Empty title="No people found" body="Try a different search." />}
    </Screen>
  );
}
