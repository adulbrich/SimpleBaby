import { router, Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, useColorScheme } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

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

    //These const variables get the sound file and an AudioPlayer isntance to play it
    const buttonSound = require('../../assets/sounds/ui-back.mp3');
    const player = useAudioPlayer(buttonSound);

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
                            //Resets the position of the sound effect to the beginning of the audio file and plays
                            player.seekTo(0);
                            player.play();
                            router.dismissTo('/(tabs)');
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
