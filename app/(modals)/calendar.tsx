import { Text, Platform } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

export default function Calendar() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Calendar',
                    headerTitleStyle: {
                        fontFamily: Platform.select({
                            android: 'Figtree-700ExtraBold',
                            ios: 'Figtree-ExtraBold',
                        }),
                    },
                }}
            />
            <Text>Calendar</Text>
        </>
    );
}
