import { View, Text, TouchableOpacity, Platform } from 'react-native';
import React from 'react';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Header component displays a title and an optional navigation link with an icon.
 * Accepts dynamic padding for top inset to account for device safe area.
 * Uses Tailwind for styling and supports dark/light mode themes.
 * Navigates to the given route when the link button is pressed.
 */

export interface HeaderLink {
    icon: React.ReactNode;
    title: string;
    link?: Href;
}

interface HeaderProps {
    title: string;
    headerLink?: HeaderLink;
    backButton?: boolean;
}

export default function Header({ title, headerLink, backButton }: HeaderProps) {

    const isAndroid = Platform.OS === 'android';
    const insets = useSafeAreaInsets();

    return (
        <View
            className={'flex-row bg-[#fff5e4] dark:bg-[#0b2218] justify-between p-0 m-0 pb-2'}
            style={{
                paddingTop: insets.top,
            }}
        >
            <View className='flex-row pl-4'>
                { backButton &&
                    <TouchableOpacity
                        onPress={router.back}
                        className={isAndroid ? 'modal-back-button' : 'p-2'}
                    >
                        <Text className='dark:color-[#fff] color:-[#000] font-bold'>
                            <Ionicons name='arrow-back' size={14}/> Back
                        </Text>
                    </TouchableOpacity>
                }

                <Text className='font-bold dark:text-white text-black text-2xl scale-100 align-middle'>
                    {title}
                </Text>
            </View>

            {headerLink ? (
                <TouchableOpacity
                    className='pr-4'
                    onPress={() => {
                        if (headerLink.link) {
                            router.push(headerLink.link);
                        }
                    }}
                    testID='header-link'
                >
                    <View className='flex-row gap-2 p-2 pl-4 border-2 rounded-full border-[#000] dark:border-[#293c25] bg-[#fff2af] dark:bg-[#6fac7d]'>
                        {headerLink.icon}
                        <Text className='pr-2 dark:text-[#ffefa9] font-bold'>
                            {headerLink.title}
                        </Text>
                    </View>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}
