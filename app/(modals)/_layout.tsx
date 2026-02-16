import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function ModalsLayout() {
    return (
        <>
            <StatusBar style={Platform.OS === 'android' ? 'dark' : 'auto'} />
            <Stack screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen
                    name='calendar'
                    options={{
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen
                    name='profile'
                    options={{
                        headerTitle: 'Profile',
                    }}
                />
                <Stack.Screen
                    name='tos'
                    options={{
                        headerTitle: 'Terms of Service',
                    }}
                />

            </Stack>
        </>
    );
}
