import React from 'react';
import {
    Text,
    ScrollView,
    View,
    TouchableOpacity,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/library/auth-provider';
import { signOut } from '@/library/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAudioPlayer } from 'expo-audio';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

const alertSound = require('../../assets/sounds/ui-pop.mp3');

export default function Profile() {

    const player = useAudioPlayer(alertSound);

    const { session } = useAuth();
    
    // Handles user sign-out and route reset
    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            console.error('Error signing out:', error);
        } else {
            console.log('Signed out successfully');
            router.dismissAll();
            router.replace('/');
        }
    };

    return (
        <SafeAreaView className='p-4 flex-col justify-between flex-grow'>
            <ScrollView>
                <View className='flex-col gap-4'>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4 mb-8'>
                        <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                            Active Child
                        </Text>
                        <Text className='p-4 text-2xl scale-100 font-bold bg-white rounded-full border-[1px] border-gray-300 text-[#f9a000]'>
                            👶 {session?.user.user_metadata?.activeChild}
                        </Text>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            👤 Name
                        </Text>
                        <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace'>
                            {session?.user.user_metadata.firstName}{' '}
                            {session?.user.user_metadata.lastName}
                        </Text>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            👪 Caretakers
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                )
                            }
                        >
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace text-blue-500'>
                                Manage
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            📧 Email
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                {
                                    Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                    );
                                    player.seekTo(0);
                                    player.play();
                                }
                            }
                        >
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace text-blue-500'>
                                {session?.user.user_metadata.email}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            🔑 Password
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                )
                            }
                        >
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace text-blue-500'>
                                Change my password
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            🤖 App Version
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                )
                            }
                        >
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace text-gray-500'>
                                v0.1a
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <View className='pt-4'>
                {session && (
                    <Button
                        text='Sign Out'
                        action={handleSignOut}
                        buttonClass='bg-red-600 border-gray-500'
                        textClass='font-bold dark:text-white'
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
