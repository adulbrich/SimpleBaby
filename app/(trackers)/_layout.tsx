import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, useColorScheme, Platform } from 'react-native';

// TrackersLayout.tsx
// Layout screen for baby trackers stack — handles common header styling and back button
export default function TrackersLayout() {
    const theme = useColorScheme();
    const headerStyle = {
        backgroundColor: theme === 'light' ? '#fff5e4' : '#0b2218',
    };
    const headerTitleStyle = {
        color: theme === 'light' ? '#000' : '#fff',
    };
    const isAndroid = Platform.OS === 'android';

    return (
        // Stack navigator with common header options and screens
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { ...headerStyle },
                headerTitleStyle: { ...headerTitleStyle, fontWeight: 'bold' },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissTo('/(tabs)');
                        }}
                        className={isAndroid ? 'modal-back-button' : 'p-2'}
                    >
                        <Text className='dark:color-[#fff] color-[#000] font-bold'>
                            <Ionicons name='arrow-back' size={14}/> Back
                        </Text>
                    </TouchableOpacity>
                ),
            }}
        >
            {/* Screens in the trackers stack */}
            <Stack.Screen name='sleep' options={{ title: 'Sleep Tracker' }} />
            <Stack.Screen name='diaper' options={{ title: 'Diaper Tracker' }} />
            <Stack.Screen name='health' options={{ title: 'Health Tracker' }} />
            <Stack.Screen name='feeding' options={{ title: 'Feeding Tracker' }} />
            <Stack.Screen name='nursing' options={{ title: 'Nursing Tracker' }} />
            <Stack.Screen name='milestone' options={{ title: 'Milestone Tracker' }} />
        </Stack>
    );
}
