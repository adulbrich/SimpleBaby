import Header from '@/components/header';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function ModalsLayout() {
    return (
        <>
            <StatusBar style={Platform.OS === 'android' ? 'dark' : 'auto'} />
            <Stack>
                <Stack.Screen
                    name='calendar'
                    options={{ header: () => <Header title='Calendar' backButton={true} /> }}
                />
                <Stack.Screen
                    name='profile'
                    options={{ header: () => <Header title='Profile' backButton={true} /> }}
                />
                <Stack.Screen
                    name='active-child'
                    options={{ header: () => <Header title='Active Child' backButton={true} /> }}
                />
                <Stack.Screen
                    name='tos'
                    options={{ header: () => <Header title='Terms of Service' backButton={true} /> }}
                />
                <Stack.Screen
                    name='privacy-policy'
                    options={{ header: () => <Header title='Privacy Policy' backButton={true} /> }}
                />
            </Stack>
        </>
    );
}
