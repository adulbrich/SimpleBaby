import { Text, Platform } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

export default function Settings() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Settings',
                    headerTitleStyle: {
                        fontFamily: Platform.select({
                            android: 'Figtree-700ExtraBold',
                            ios: 'Figtree-ExtraBold',
                        }),
                    },
                }}
            />
            <Text>Settings</Text>
        </>
    );
}
