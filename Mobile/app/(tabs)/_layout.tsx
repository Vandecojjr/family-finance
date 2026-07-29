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
  href?: null;
}

const TABS: TabConfig[] = [
  { name: 'index',              title: 'Início',       icon: 'home-outline',          iconActive: 'home' },
  { name: 'transactions',       title: 'Lançamentos',  icon: 'swap-vertical-outline', iconActive: 'swap-vertical' },
  { name: 'planning',           title: 'Planejar',     icon: 'calendar-outline',      iconActive: 'calendar' },
  { name: 'wallets',            title: 'Carteiras',    icon: 'wallet-outline',         iconActive: 'wallet' },
  { name: 'family',             title: 'Família',      icon: 'people-outline',         iconActive: 'people' },
  
  // Hidden tabs
  { name: 'recurring-expenses', title: 'Recorrentes',  icon: 'calendar-outline',      iconActive: 'calendar', href: null },
  { name: 'accounts-payable',   title: 'A Pagar',      icon: 'cash-outline',           iconActive: 'cash', href: null },
  { name: 'accounts-receivable', title: 'A Receber',   icon: 'receipt-outline',        iconActive: 'receipt', href: null },
];

import { useWindowDimensions, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { typography, shadow } from '@/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const pathname = usePathname();
  const router = useRouter();

  // Desktop Sidebar Component
  const Sidebar = () => (
    <SafeAreaView style={styles.sidebarContainer}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Family Finance</Text>
      </View>
      <View style={styles.sidebarNav}>
        {TABS.filter(t => t.href !== null).map(tab => {
          // Normalize paths for comparison
          const isActive = pathname === `/${tab.name}` || (pathname === '/' && tab.name === 'index');
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
              onPress={() => {
                const destination = tab.name === 'index' ? '/(tabs)' : `/(tabs)/${tab.name}`;
                router.navigate(destination as any);
              }}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? colors.brand.primary : colors.text.secondary}
              />
              <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {isDesktop && <Sidebar />}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Tabs
          screenOptions={({ route }) => {
            const tab = TABS.find((t) => t.name === route.name);
            return {
              headerShown: false,
              tabBarStyle: isDesktop ? { display: 'none' } : styles.tabBar,
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
            <Tabs.Screen 
              key={tab.name} 
              name={tab.name} 
              options={{ 
                title: tab.title,
                href: tab.href, 
              }} 
            />
          ))}
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 250,
    backgroundColor: colors.bg.card,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  sidebarTitle: {
    ...typography.h3,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  sidebarNav: {
    flex: 1,
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    gap: 12,
  },
  sidebarItemActive: {
    backgroundColor: `${colors.brand.primary}15`,
  },
  sidebarLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
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
