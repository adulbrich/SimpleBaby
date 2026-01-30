import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';
import Header, { HeaderLink } from '@/components/header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Icon = (color: string, text: string) => {
  return <Text style={{ color }}>{text}</Text>;
};

const Profile: HeaderLink = {
  link: '/(modals)/profile',
  title: 'Profile',
  icon: '👩',
};

/**
 * Empty header link used when we want NO right-side button
 */
const EmptyHeaderLink: HeaderLink = {
  link: '/',
  title: '',
  icon: '',
};

export default function TabLayout() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const tabBarStyle =
    scheme === 'light'
      ? { backgroundColor: '#f0dfcf', borderColor: '#bbb' }
      : { backgroundColor: '#08150e', borderColor: '#000' };

  const tabBarActiveTintColor =
    scheme === 'light' ? '#bc8877' : '#118866';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle,
        tabBarActiveTintColor,
        tabBarLabelStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Trackers',
          tabBarIcon: ({ color }) => Icon(color, '👶'),
          header: () => Header('👶 SimpleBaby', Profile, insets.top),
        }}
      />

      <Tabs.Screen
        name="trends"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => Icon(color, '📈'),
          // Calendar header button removed by using EmptyHeaderLink
          header: () => Header('📈 Logs', EmptyHeaderLink, insets.top),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color }) => Icon(color, '❓'),
          header: () => Header('❓ About', EmptyHeaderLink, insets.top),
        }}
      />
    </Tabs>
  );
}