import Header from '@/components/header';
import { Stack } from 'expo-router';

export default function LogsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name='sleep-logs'
                options={{ header: () => <Header title='Sleep' backButton={true} /> }}
            />
            <Stack.Screen
                name='feeding-logs'
                options={{ header: () => <Header title='Feeding' backButton={true} /> }}
            />
            <Stack.Screen
                name='nursing-logs'
                options={{ header: () => <Header title='Nursing' backButton={true} /> }}
            />
            <Stack.Screen
                name='diaper-logs'
                options={{ header: () => <Header title='Diapers' backButton={true} /> }}
            />
            <Stack.Screen
                name='milestone-logs'
                options={{ header: () => <Header title='Milestones' backButton={true} /> }}
            />
            <Stack.Screen
                name='health-logs'
                options={{ header: () => <Header title='Health' backButton={true} /> }}
            />
        </Stack>
    );
}
