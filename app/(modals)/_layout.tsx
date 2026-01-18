import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Platform } from 'react-native';

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
                        headerRight: () => <Button onPress={() => {router.navigate('/(modals)/settings')}} title="⚙️ Settings" />
                    }}
                />
            </Stack>
        </>
    );
}
