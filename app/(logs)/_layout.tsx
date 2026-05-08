import { router, Stack } from 'expo-router';
import {
    Platform,
    Text,
    TouchableOpacity,
} from 'react-native';

export default function LogsLayout() {
    
    const isAndroid = Platform.OS === 'android';
    
    return (
        <Stack
            screenOptions={{
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissTo('/(tabs)/trends');
                        }}
                        className={isAndroid ? 'modal-back-button' : 'p-2'}
                    >
                        <Text className='dark:color-[#fff] color:-[#000] font-bold'>
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
