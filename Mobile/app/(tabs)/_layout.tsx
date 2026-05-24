import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';
import { View, StyleSheet, Platform } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
}

const TABS: TabConfig[] = [
  { name: 'index',        title: 'Início',       icon: 'home-outline',         iconActive: 'home' },
  { name: 'transactions', title: 'Lançamentos',  icon: 'swap-vertical-outline', iconActive: 'swap-vertical' },
  { name: 'wallets',      title: 'Carteiras',    icon: 'wallet-outline',        iconActive: 'wallet' },
  { name: 'family',       title: 'Família',      icon: 'people-outline',        iconActive: 'people' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.muted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons
                name={focused ? (tab?.iconActive ?? route.name as IoniconsName) : (tab?.icon ?? route.name as IoniconsName)}
                size={size}
                color={color}
              />
            </View>
          ),
        };
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: `${colors.brand.primary}22`,
  },
});
