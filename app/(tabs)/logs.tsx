import { Href, router } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.logs;

export default function Tab() {

    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const iconColor = colorScheme === 'dark' ? '#dbf9dd' : '#92400e';
    const iconSize = 50;

    const bars = [
        { 
            label: 'Sleep Logs', 
            icon: <Ionicons name="moon-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/sleep-logs' as Href, 
            testID: testIDs.sleepButton
        },
        { 
            label: 'Feeding Logs', 
            icon: <Ionicons name="restaurant-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/feeding-logs' as Href, 
            testID: testIDs.feedingButton
        },
        { 
            label: 'Nursing Logs', 
            icon: <MaterialCommunityIcons name="baby-bottle-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/nursing-logs' as Href, 
            testID: testIDs.nursingButton
        },
        { 
            label: 'Diaper Logs', 
            icon: <MaterialCommunityIcons name="baby-face-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/diaper-logs' as Href, 
            testID: testIDs.diaperButton
        },
        { 
            label: 'Milestone Logs', 
            icon: <Ionicons name="star-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/milestone-logs' as Href, 
            testID: testIDs.milestoneButton },
        { 
            label: 'Health Logs', 
            icon: <Ionicons name="heart-outline" size={iconSize} color={iconColor} />, 
            link: '/(logs)/health-logs' as Href, 
            testID: testIDs.healthButton
        },
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
                                    {bars.icon}
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
