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

const Calendar: HeaderLink = {
    link: '/(modals)/calendar',
    title: 'Calendar',
    icon: '📅',
};

export default function TabLayout() {
    const scheme = useColorScheme()
    const insets = useSafeAreaInsets().top

    const scheme = useColorScheme();
    const insets = useSafeAreaInsets().top;
    const tabBarStyle =
        scheme === 'light'
            ? { backgroundColor: '#f0dfcf', borderColor: '#bbb' }
            : { backgroundColor: '#08150e', borderColor: '#000' };

    const tabBarActiveTintColor = scheme === 'light' ? '#bc8877' : '#118866';

    return (
        <Tabs
            screenOptions={{
                tabBarStyle,
                tabBarActiveTintColor,
                tabBarLabelStyle: { fontWeight: 'bold' },
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    tabBarLabel: 'Trackers',
                    tabBarIcon: ({ color }) => Icon(color, '👶'),
                    header: () => Header('👶 SimpleBaby', Profile, insets),
                }}
            />

            <Tabs.Screen
                name='trends'
                options={{
                    title: 'Logs',
                    tabBarIcon: ({ color }) => Icon(color, '📈'),
                    header: () => Header('📈 Logs', Calendar, insets),
                }}
            />
            <Tabs.Screen
                name='about'
                options={{
                    title: 'About',
                    tabBarIcon: ({ color }) => Icon(color, '❓'),
                    header: () => Header('❓ About', Calendar, insets),
                }}
            />
        </Tabs>
    );
}
