import React, { useEffect, useState } from 'react';
import {
    Text,
    ScrollView,
    View,
    TouchableOpacity,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/library/auth-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAudioPlayer } from 'expo-audio';
import { getActiveChildId as getLocalActiveChildId, listChildren } from '@/library/local-store';
import supabase from '@/library/supabase-client';
import { getActiveChildId as getRemoteActiveChildId } from '@/library/utils';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

const alertSound = require('../../assets/sounds/ui-pop.mp3');

export default function Profile() {

    const player = useAudioPlayer(alertSound);

    const { isGuest, exitGuest, session } = useAuth();

    const [guestChildName, setGuestChildName] = useState<string>('Loading...');
    const [accountChildName, setAccountChildName] = useState<string>('Loading...');

    const signOutLabel = isGuest ? "Exit Guest Mode" : "Sign Out";
    
    // Handles user sign-out and route reset
    const handleSignOut = async () => {
        try {
            if (isGuest) {
                // Guest sign-out: leave guest mode (local-only)
                await exitGuest();

                // Send them back to auth entry
                router.replace("/");
                return;
            }

            // Signed-in session sign-out: Supabase sign out
            const { error } = await supabase.auth.signOut();
            
            if (error) throw error;
            router.replace("/");

        } catch (e: any) {
            Alert.alert("Sign out failed", e?.message ?? "Please try again.");
        }
    };

    useEffect(() => {
        const loadGuestChild = async () => {
            try {
                if (!isGuest) return;
                const activeId = await getLocalActiveChildId();
                if (!activeId) {
                    setGuestChildName("Guest Child");
                    return;
                }
                const children = await listChildren();
                const activeChild = children.find(c => c.id === activeId);
                setGuestChildName(activeChild?.name ?? 'Guest Child');
            } catch {
                Alert.alert("Could Not Retrieve Guest Mode Child", "Could not load the child. Please try again.");
            }
        };

        loadGuestChild();
    }, [isGuest]);

    useEffect(() => {
        const loadAccountChild = async () => {
            try {
                if (isGuest || !session) return;
                const result = await getRemoteActiveChildId();
                if (!result.success || !result.childName) {
                    setAccountChildName("Child");
                    return;
                }
                setAccountChildName(result.childName);
            } catch {
                setAccountChildName("Child");
            }
        };
        loadAccountChild();
    }, [isGuest, session]);

    return (
        <SafeAreaView className='p-4 flex-col justify-between flex-grow'>
            <ScrollView>
                <View className='flex-col gap-4'>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4 mb-8'>
                        <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                            Active Child
                        </Text>
                        <Text className='p-4 text-2xl scale-100 font-bold bg-white rounded-full border-[1px] border-gray-300 text-[#f9a000]'>
                            👶 {isGuest ? guestChildName : accountChildName}
                        </Text>
                    </View>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            👤 Name
                        </Text>
                        <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace'>
                            {isGuest ? "Guest" : `${session?.user.user_metadata.firstName} ${session?.user.user_metadata.lastName}`}
                        </Text>
                    </View>
                    {!isGuest && <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
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
                    </View>}
                    {!isGuest && <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
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
                    </View>}
                    {!isGuest && <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
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
                    </View>}
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
                {(session || isGuest) && (
                    <Button
                        text={signOutLabel}
                        action={handleSignOut}
                        buttonClass='bg-red-600 border-gray-500'
                        textClass='font-bold dark:text-white'
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
