import { router, Stack } from 'expo-router';
import {
    Text,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';

export default function LogsLayout() {
    
    const theme = useColorScheme();
    const headerStyle = {
        backgroundColor: theme === 'light' ? '#fff5e4' : '#0b2218',
    };
    const headerTitleStyle = {
        color: theme === 'light' ? '#000' : '#fff',
    };
    
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { ...headerStyle },
                headerTitleStyle: { ...headerTitleStyle, fontWeight: 'bold' },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissTo('/(tabs)/logs');
                        }}
                        className='dark:bg-slate-700 bg-blue-200 p-2 rounded-xl border-[1px] border-blue-300 dark:border-slate-600 android:mr-4'
                    >
                        <Text className='dark:color-[#fff] font-bold'>
                            ⬅️ Back
                        </Text>
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen
                name='sleep-logs'
                options={{
                    headerTitle: 'Sleep',
                }}
            />
            <Stack.Screen
                name='feeding-logs'
                options={{
                    headerTitle: 'Feeding',
                }}
            />
            <Stack.Screen
                name='nursing-logs'
                options={{
                    headerTitle: 'Nursing',
                }}
            />
            <Stack.Screen
                name='diaper-logs'
                options={{
                    headerTitle: 'Diapers',
                }}
            />
            <Stack.Screen
                name='milestone-logs'
                options={{
                    headerTitle: 'Milestones',
                }}
            />
            <Stack.Screen
                name='health-logs'
                options={{
                    headerTitle: 'Health',
                }}
            />
        </Stack>
    );
}
