import Header from '@/components/header';
import { Stack } from 'expo-router';
import React from 'react';

// TrackersLayout.tsx
// Layout screen for baby trackers stack — handles common header styling and back button
export default function TrackersLayout() {
    return (
        // Stack navigator with headers and screens
        <Stack>
            {/* Screens in the trackers stack */}
            <Stack.Screen
                name='sleep'
                options={{ header: () => <Header title='Sleep Tracker' backButton={true} /> }}
            />
            <Stack.Screen
                name='diaper'
                options={{ header: () => <Header title='Diaper Tracker' backButton={true} /> }}
            />
            <Stack.Screen
                name='health'
                options={{ header: () => <Header title='Health Tracker' backButton={true} /> }}
            />
            <Stack.Screen
                name='feeding'
                options={{ header: () => <Header title='Feeding Tracker' backButton={true} /> }}
            />
            <Stack.Screen
                name='nursing'
                options={{ header: () => <Header title='Nursing Tracker' backButton={true} /> }}
            />
            <Stack.Screen
                name='milestone'
                options={{ header: () => <Header title='Milestone Tracker' backButton={true} /> }}
            />
        </Stack>
    );
}
