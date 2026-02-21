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
import RenameChildPopup from '@/components/rename-child-popup';
import { getChildCreatedDate, updateChildName, getChildNames, deleteChild } from '@/library/utils';
import supabase from '@/library/supabase-client';
import SwitchChildPopup from '@/components/switch-child-popup';

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
    const [showSelectChild, setShowSelectChild] = useState(false);
    const [childNames, setChildNames] = useState<string[]>([]);
    
    // Handles intial user request to delete a child
    const handleDeleteChild = async () => {
        try {
            Alert.alert(
                "Confirm Delete",
                `Are you sure you want to delete ${session?.user.user_metadata?.activeChild}?`,
                [{
                    text: "Cancel",
                    style: "cancel",
                    isPreferred: true,
                },
                {
                    text: "Confirm",
                    style: "destructive",
                    onPress: handleConfirmedDeleteChild,
                }]
            );
        } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };
    
    // Handles second user request to delete a child, after confirmation
    const handleConfirmedDeleteChild = async () => {
        try {
            const { names } = await getChildNames(); // get child names
            if (names.length === 0) throw new Error("Unable to access child data");

            await deleteChild(session?.user.user_metadata?.activeChild);  // delete the current child

            const otherNames = names.filter(name => name !== session?.user.user_metadata?.activeChild);
            if (otherNames.length > 0) {
                // store names to display to user
                setChildNames(otherNames);
                // show selection pop up for the user to select a new child
                setShowSelectChild(true);
            } else {
                // the user has no other child accounts
                router.dismissTo("/(tabs)");  // clear the routing stack back to the splash screen
                // remove the active child from the user's supabase account. This will propagate to the user's session
                await supabase.auth.updateUser({
                    data: { activeChild: null },
                });
            }
        } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleSelectChild = async (index: number) => {
        try {
            if (index < 0 || index >= childNames.length) {  // if index is invalid
                throw new Error("Unable to find selected child");
            }
            // Update user session metadata with the active child
            await supabase.auth.updateUser({
                data: { activeChild: childNames[index] },
            });
            // send the user back to the profile page
            router.dismissTo("/(modals)/profile");
        } catch (err) {
            Alert.alert("Error switching:", err instanceof Error ? err.message : 'Failed to change active child.');
        }
    };

    const handleCancelSelectChild = async () => {
        try {
            // Update user session metadata with the next child that wasn't deleted
            await supabase.auth.updateUser({
                data: { activeChild: childNames[0] },
            });
        } catch (err) {
            console.error("Failed to select new child", err instanceof Error ? err.message : 'Failed to change active child.');
        } finally {
            setShowSelectChild(false);
            router.dismissTo("/(modals)/profile");  // send the user back to the profile page
        }
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
        const fetchCreatedDate = async () => {
            try {
                const { success, date } = await getChildCreatedDate(session?.user.user_metadata?.activeChild);
                if (!success) throw new Error("Unable to retrieve date.");

                if (date) {
                    setCreatedDate((new Date(date)).toDateString());
                } else {
                    throw new Error("Failed to retrieve valid date.");
                }
            } catch (err) {
                setDateError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoadingDate(false);
            };
        };

        fetchCreatedDate();
    }, []);

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
                        onPress={() => {
                            setNewChildName(session?.user.user_metadata?.activeChild);  // autofill with current name
                            setShowRenameChild(true);
                        }}
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
            <SwitchChildPopup
                visible={showSelectChild}
                childNames={childNames}
                currentChild={session?.user.user_metadata?.activeChild}
                hideCancelButton={true}
                handleSwitch={handleSelectChild}
                handleCancel={handleCancelSelectChild}
            />
        </SafeAreaView>
    );
}
