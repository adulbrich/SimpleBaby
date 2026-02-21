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
import RenameChildPopup from '@/components/rename-child-popup';
import { getChildCreatedDate, updateChildName } from '@/library/utils';
import supabase from '@/library/supabase-client';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

export default function ActiveChild() {

    const { session } = useAuth();

    const [showRenameChild, setShowRenameChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [createdDate, setCreatedDate] = useState<string|undefined>(undefined);
    const [loadingDate, setLoadingDate] = useState(true);
    const [dateError, setDateError] = useState<string | null>(null);
    
    // Handles user sign-out and route reset
    const handleDeleteChild = async () => {
        //
    };

    const handleRenameChild = async () => {
        if (!newChildName) {
            Alert.alert('Please enter a name!');
            return;
        }

        try {
            await updateChildName(session?.user.user_metadata?.activeChild, newChildName);  // try to update child name
            // Update user session metadata with the active child's new name
            await supabase.auth.updateUser({
                data: { activeChild: newChildName },
            });
            setShowRenameChild(false);  // Close modal if successful
            setNewChildName("");  // reset child name
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'An error occurred while saving child name.',
            );
        } finally {
            setShowRenameChild(false);
        }
    };

    useEffect(() => {
        fetchCreatedDate();
    }, []);

    const fetchCreatedDate = async () => {
        try {
            const { success, date } = await getChildCreatedDate(session?.user.user_metadata?.activeChild);
            if (!success) throw new Error("Unable to retrieve date.");

            if (date) {
                setCreatedDate((new Date(date)).toDateString());
            } else {
                throw new Error("Failed to retrieve valid date.")
            }
        } catch (err) {
            setDateError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoadingDate(false);
        };
    };

    return (
        <SafeAreaView className='p-4 flex-col justify-between flex-grow'>
            <ScrollView>
                <View className='flex-col gap-4'>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                            Name
                        </Text>
                        <Text className='p-4 text-2xl scale-100 font-bold bg-white rounded-full border-[1px] border-gray-300 text-[#f9a000]'>
                            👶 {session?.user.user_metadata?.activeChild}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowRenameChild(true)}
                    >
                        <View className='bg-gray-200 rounded-full flex-row justify-between gap-4 mb-8'>
                            <Text className='p-4 text-2xl scale-100 border-[1px] border-transparent'>
                                ✏️ Rename
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View className='bg-gray-200 rounded-full flex-row justify-between gap-4'>
                        <Text className='p-4 text-lg scale-100 bg-white rounded-full border-[1px] border-gray-300'>
                            📆 Created On
                        </Text>
                        <Text className='p-4 text-lg scale-100 border-[1px] border-transparent monospace text-gray-500'>
                            { loadingDate ? (
                                "loading..."
                            ) : !createdDate || dateError ? (
                                dateError
                            ) : (
                                createdDate
                            )}
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View className='pt-4'>
                <Button
                    text='Delete Child'
                    action={handleDeleteChild}
                    buttonClass='bg-red-600 border-gray-500'
                    textClass='font-bold dark:text-white'
                />
            </View>
            <RenameChildPopup
                visible={showRenameChild}
                childName={newChildName}
                originalName={session?.user.user_metadata?.activeChild}
                onChildNameUpdate={(name: string) => setNewChildName(name)}
                handleSave={handleRenameChild}
                handleCancel={() => {
                    setShowRenameChild(false);
                    setNewChildName("");  // reset name
                }}
            />
        </SafeAreaView>
    );
}
