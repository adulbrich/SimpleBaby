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
import { signOut } from '@/library/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAudioPlayer } from 'expo-audio';
import AddChildPopup from '@/components/add-child-popup';
import SwitchChildPopup from '@/components/switch-child-popup';
import { getChildNames, saveNewChild } from '@/library/utils';
import supabase from '@/library/supabase-client';

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

    const [showAddChild, setShowAddChild] = useState(false);
    const [showSwitchChild, setShowSwitchChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [childNames, setChildNames] = useState<string[]>([]);
    const [loadingNames, setLoadingNames] = useState(true);
    const [namesError, setNamesError] = useState<string | null>(null);
    
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

    const handleSaveChild = async () => {
        if (!newChildName) {
            Alert.alert('Please enter a name!');
            return;
        }

        try {
            saveNewChild(newChildName);  // try to save new child
            setShowAddChild(false);  // Close modal if successful
            setNewChildName("");  // reset child name
            fetchChildNames();  // reload child names for switching
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'An error occurred while saving child data.',
            );
        }
    };

    const handleSwitchChild = async (index: number) => {
        try {
            if (index < 0 || index >= childNames.length) {  // if index is invalid
                throw new Error("Unable to find selected child");
            }
            // Update user session metadata with the active child
            await supabase.auth.updateUser({
                data: { activeChild: childNames[index] },
            });
        } catch (err) {
            Alert.alert("Error switching:", err instanceof Error ? err.message : 'Failed to change active child.');

            // reload names
            setLoadingNames(true);
            fetchChildNames();
        } finally {
            setShowSwitchChild(false);
        }
    };

    useEffect(() => {
        fetchChildNames();
    }, []);

    const fetchChildNames = async () => {
        try {
            const { success, names } = await getChildNames();

            if (!success) throw new Error("Unable to retrieve child names");

            if (names) setChildNames(names);
        } catch (err) {
            setNamesError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoadingNames(false);
        };
    };

    return (
        <SafeAreaView className='p-4 flex-col justify-between flex-grow'>
            <ScrollView>
                <View className='flex-col gap-4'>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                            Active Child
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/(modals)/active-child")}>
                            <Text className='p-4 text-2xl scale-100 font-bold bg-white rounded-full border-[1px] border-gray-300 text-[#f9a000]'>
                                👶 {session?.user.user_metadata?.activeChild}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    { loadingNames ? (
                        <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent'>
                                Loading Child Profiles...
                            </Text>
                        </View>
                    ) : namesError ? (
                        <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                            <Text className='p-4 text-lg scale-100 border-[1px] border-transparent text-red-600'>
                                Error loading child names
                            </Text>
                        </View>
                    ) : childNames.length < 2 ? (
                        undefined  // show nothing if the user has no other child accounts
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowSwitchChild(true)}
                        >
                            <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                                <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                                    🔃 Switch Child
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => setShowAddChild(true)}
                    >
                        <View className='bg-gray-200 rounded-full flex-row justify-between gap-4 mb-8'>
                            <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                                ✚ Add Child
                            </Text>
                        </View>
                    </TouchableOpacity>
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
            <AddChildPopup
                visible={showAddChild}
                childName={newChildName}
                onChildNameUpdate={(name: string) => setNewChildName(name)}
                handleSave={handleSaveChild}
                handleCancel={() => {
                    setShowAddChild(false);
                    setNewChildName("");  // reset name
                }}
            />
            <SwitchChildPopup
                visible={showSwitchChild}
                childNames={childNames}
                currentChild={session?.user.user_metadata?.activeChild}
                handleSwitch={handleSwitchChild}
                handleCancel={() => {
                    setShowSwitchChild(false);
                }}
            />
        </SafeAreaView>
    );
}
