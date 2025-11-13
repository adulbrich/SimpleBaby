import { Href, router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

type Button = {
    label: string
    icon: string
    link: Href
}

export default function Tab() {
    const bars: Button[] = [
        { label: 'Sleep', icon: '🌙', link: '/(logs)/sleep-log' },
        { label: 'Feeding', icon: '🍽️', link: '/(logs)/feeding-logs' },
        { label: 'Nursing', icon: '🍼', link: '/(logs)/nursing-logs' },
        { label: 'Diaper', icon: '🧷', link: '/(logs)/diaper-logs' },
        { label: 'Milestone', icon: '🌟', link: '/(trackers)/milestone' },
        { label: 'Health', icon: '💚', link: '/(logs)/health-logs' },
    ];

    return (
        <View className='main-container flex-col justify-center gap-4'>
            {bars.map((bars, key) => (
                <TouchableOpacity
                    onPress={() => router.push(bars.link)}
                    className='group'
                    key={key}
                    testID={`trends-${bars.label}-button`}
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
                        <View>
                            <Text>num logs, graph</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}
