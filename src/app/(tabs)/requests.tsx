import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, colors, Empty, Field, Screen } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { bloodGroups } from '@/domain/types';
import { isCompatible } from '@/domain/rules';
import { useApp } from '@/providers/AppProvider';
import { useNow } from '@/hooks/useNow';
export default function Requests() {
  const now = useNow();
  const { data, refresh } = useApp(),
    [query, setQuery] = useState(''),
    [group, setGroup] = useState('All'),
    [scope, setScope] = useState('Active'),
    [refreshing, setRefreshing] = useState(false);
  const requests = useMemo(
    () =>
      data.requests.filter((r) => {
        const h = data.hospitals.find((h) => h.id === r.hospitalId),
          active =
            ['active', 'contacted', 'partial'].includes(r.status) && r.requiredBefore > now;
        return (
          (scope === 'My requests'
            ? r.requesterId === data.user?.id
            : scope === 'For you'
              ? active && !!data.donor && isCompatible(data.donor.bloodGroup, r.bloodGroup)
              : active) &&
          (group === 'All' || r.bloodGroup === group) &&
          (!query ||
            `${h?.name} ${h?.city} ${r.bloodGroup}`.toLowerCase().includes(query.toLowerCase()))
        );
      }),
    [data, query, group, scope, now],
  );
  return (
    <Screen
      title="Every request matters."
      subtitle="A community coming together, one unit at a time."
      scroll={false}
    >
      <View className="mb-4">
        <Field
          label="Find a request"
          placeholder="Search hospital, city, blood group…"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View className="mb-3 gap-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {['Active', ...(data.donor ? ['For you'] : []), 'My requests'].map((s) => (
            <Chip key={s} title={s} selected={scope === s} onPress={() => setScope(s)} />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ gap: 7, paddingVertical: 2 }}
        >
          {['All', ...bloodGroups].map((g) => (
            <Chip key={g} title={g} selected={group === g} onPress={() => setGroup(g)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.blood}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await refresh();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        ListEmptyComponent={
          <Empty
            title="No requests here yet"
            body="Try a different filter, or create a new request for someone who needs help."
            action={<Button title="Request blood" onPress={() => router.push('/request/create')} />}
          />
        }
      />
    </Screen>
  );
}
