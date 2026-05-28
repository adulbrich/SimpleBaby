import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header, { HeaderLink } from '@/components/header';

export default function TabLayout() {
    const scheme = useColorScheme();

    const tabBarStyle =
        scheme === 'light'
            ? { backgroundColor: '#f0dfcf', borderColor: '#bbb' }
            : { backgroundColor: '#08150e', borderColor: '#000' };

    const tabBarActiveTintColor =
        scheme === 'light' ? '#bc8877' : '#118866';

    const headerIconColor = scheme === 'dark' ? '#ffefa9' : '#000000';

    const Profile: HeaderLink = {
        link: '/(modals)/profile',
        title: 'Profile',
        icon: <Ionicons name="person-outline" size={18} color={headerIconColor} />,
    };

    const Calendar: HeaderLink = {
        link: '/(modals)/calendar',
        title: 'Calendar',
        icon: <Ionicons name="calendar-outline" size={18} color={headerIconColor} />,
    };

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
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                    header: () => (
                        <Header
                            title="SimpleBaby"
                            headerLink={Profile}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="logs"
                options={{
                    title: 'Logs',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart-outline" size={size} color={color} />
                    ),
                    header: () => (
                        <Header
                            title="Logs"
                            headerLink={Calendar}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="information-circle-outline" size={size} color={color} />
                    ),
                    header: () => <Header title="About" />,
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                    header: () => <Header title="Settings" />,
                }}
            />

        </Tabs>
    );
}
