import { Href, router } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import stringLib from "@/assets/stringLibrary.json";


type Button = {
    label: string
    icon: string
    link: Href
    testID: string
}

const testIDs = stringLib.testIDs.logs;

export default function Tab() {

    const insets = useSafeAreaInsets();

    const bars: Button[] = [
        { label: 'Sleep Logs', icon: '🌙', link: '/(logs)/sleep-logs', testID: testIDs.sleepButton },
        { label: 'Feeding Logs', icon: '🍽️', link: '/(logs)/feeding-logs', testID: testIDs.feedingButton },
        { label: 'Nursing Logs', icon: '🍼', link: '/(logs)/nursing-logs', testID: testIDs.nursingButton },
        { label: 'Diaper Logs', icon: '🧷', link: '/(logs)/diaper-logs', testID: testIDs.diaperButton },
        { label: 'Milestone Logs', icon: '🌟', link: '/(logs)/milestone-logs', testID: testIDs.milestoneButton },
        { label: 'Health Logs', icon: '💚', link: '/(logs)/health-logs', testID: testIDs.healthButton },
    ];

    return (
            <View
                className='main-container justify-between'
                style={{ paddingBottom: insets.bottom }}
            >
            <ScrollView>
                <View className='main-container flex-col justify-center gap-4'>
                    {bars.map((bars, key) => (
                        <TouchableOpacity
                            onPress={() => router.push(bars.link)}
                            key={key}
                            testID={bars.testID}
                        >
                            <View className='log-button'>
                                <View className='flex-row justify-center items-center gap-4'>
                                    <Text className='log-button-icon'>
                                        {bars.icon}
                                    </Text>
                                    <Text className='log-button-label'>
                                        {bars.label}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                </ScrollView>
            </View>
    );
}
