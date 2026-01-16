import { View, Text, TouchableOpacity, DimensionValue } from 'react-native';
import React from 'react';
import { Href, router } from 'expo-router';

/**
 * Header component displays a title and an optional navigation link with an icon.
 * Accepts dynamic padding for top inset to account for device safe area.
 * Uses Tailwind for styling and supports dark/light mode themes.
 * Navigates to the given route when the link button is pressed.
 */

export interface HeaderLink {
    icon: string
    title: string
    link: Href
}

export default function Header(
    title: string,
    headerLink: HeaderLink,
    topInset: DimensionValue | undefined,
) {
    return (
        <View
            className='flex-row bg-[#fff5e4] dark:bg-[#0b2218] justify-between p-0 m-0'
            style={{
                paddingTop: topInset,
            }}
        >
            <Text className='pl-4 font-bold dark:text-white text-black text-2xl scale-100'>
                {title}
            </Text>
            <TouchableOpacity
                className='pr-4'
                onPress={() => router.push(headerLink.link)}
                testID='header-link'
            >
                <View className='flex-row gap-2 p-2 border-2 rounded-full border-[#000] dark:border-[#293c25] bg-[#fff2af] dark:bg-[#6fac7d]'>
                    <Text className='pl-2'>{headerLink.icon}</Text>
                    <Text className='pr-2 dark:text-[#ffefa9] font-bold'>
                        {headerLink.title}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}
