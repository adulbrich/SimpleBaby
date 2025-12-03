import { Href, router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

type Button = {
    label: string
    icon: string
    link: Href
    testID: string
}

export default function Tab() {
    const bars: Button[] = [
        { label: 'Sleep Logs', icon: '🌙', link: '/(logs)/sleep-log', testID: "trends-Sleep-button"},
        { label: 'Feeding Logs', icon: '🍽️', link: '/(logs)/feeding-logs', testID: "trends-Feeding-button"},
        { label: 'Nursing Logs', icon: '🍼', link: '/(logs)/nursing-logs', testID: "trends-Nursing-button" },
        { label: 'Diaper Logs', icon: '🧷', link: '/(logs)/diaper-logs', testID: "trends-Diaper-button" },
        { label: 'Milestone Logs', icon: '🌟', link: '/(trackers)/milestone', testID: "trends-Milestone-button" },
        { label: 'Health Logs', icon: '💚', link: '/(logs)/health-logs', testID: "trends-Health-button" },
    ];

    return (
        <View className='main-container flex-col justify-center gap-4'>
            {bars.map((bars, key) => (
                <TouchableOpacity
                    onPress={() => router.push(bars.link)}
                    className='group'
                    key={key}
                    testID={bars.testID}
                >
                    <View className='tracker-bar'>
                        <View className='flex-row justify-center items-center gap-4'>
                            <Text className='text-[3rem] scale-100 '>
                                {bars.icon}
                            </Text>
                            <Text className='tracker-bar-label'>
                                {bars.label}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}
