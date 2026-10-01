import { Component, ReactNode } from 'react';
import { Text, View, Pressable } from 'react-native';
export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#FBF8F6' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#242326' }}>
          We couldn’t load BloodBank
        </Text>
        <Text style={{ marginTop: 12, lineHeight: 23, color: '#77717A' }}>
          {this.state.error.message}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#BC2846' }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
