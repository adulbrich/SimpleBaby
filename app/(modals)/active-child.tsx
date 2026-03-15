import React, { useEffect, useState } from 'react';
import {
    Text,
    ScrollView,
    View,
    TouchableOpacity,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import RenameChildPopup from '@/components/rename-child-popup';
import { formatName, getActiveChildData, updateChildName, getChildren, deleteChild } from '@/library/utils';
import supabase from '@/library/supabase-client';
import SwitchChildPopup from '@/components/switch-child-popup';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

export default function ActiveChild() {

    const [showRenameChild, setShowRenameChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [showSelectChild, setShowSelectChild] = useState(false);
    const [createdDate, setCreatedDate] = useState<string>('Loading...');
    const [childName, setChildName] = useState<string>('Loading...');
    const [childId, setChildId] = useState<string>('');
    const [children, setChildren] = useState<{ name: string; id: string }[]>([]);

    // Handles intial user request to delete a child
    const handleDeleteChild = async () => {
        try {
            Alert.alert(
                "Confirm Delete",
                `Are you sure you want to delete ${childName}?`,
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
            const allChildren = await getChildren(); // get child names
            if (allChildren.length === 0) throw new Error("Unable to access child data");

            await deleteChild(childId);  // delete the current child

            const otherChildren = allChildren.filter(({ name }) => name !== childName);
            if (otherChildren.length === 1) {
                // remove the active child from the user's supabase account. This will propagate to the user's session
                await supabase.auth.updateUser({
                    data: { activeChild: "", activeChildId: "" },
                });
                // the user has no other child accounts
                router.dismissTo("/(tabs)");  // clear the routing stack back to the splash screen
                return;
            }

            // Update user session metadata with the active child as the user's first other child
            await supabase.auth.updateUser({
                data: { activeChildId: otherChildren[0].id, activeChild: "" },
            });

            if (otherChildren.length === 1) {
                // send the user back to the profile page
                router.dismissTo("/(modals)/profile");
            } else {
                // store names to display to user
                setChildren(otherChildren);
                // show selection pop up for the user to select a new child
                setShowSelectChild(true);
            }
        } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleSelectChild = async (index: number) => {
        try {
            if (index < 0 || index >= children.length) {  // if index is invalid
                throw new Error("Unable to find selected child");
            }
            // Update user session metadata with the active child
            await supabase.auth.updateUser({
                data: { activeChildId: children[index].id, activeChild: "" },
            });
            // send the user back to the profile page
            router.dismissTo("/(modals)/profile");
        } catch (err) {
            Alert.alert("Error switching:", err instanceof Error ? err.message : 'Failed to change active child.');
        }
    };

    const handleRenameChild = async () => {
        if (formatName(newChildName) === childName) {
            Alert.alert("Keeping current name", "The name you entered is the same as your child's current name.");
            setShowRenameChild(false);
            return;
        }

        try {
            await updateChildName(childId, newChildName);  // try to update child name
            await supabase.auth.updateUser({});  // Update user session to trigger useEffects in profile page
            setShowRenameChild(false);  // Close modal if successful
            setNewChildName("");  // reset child name
            setChildName("Loading...");
            loadChildData();  // refresh child name
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'An error occurred while saving child name.',
            );
        } finally {
            setShowRenameChild(false);
        }
    };

    const loadChildData = async () => {
        try {
            const result = await getActiveChildData();
            if (!result.success || !result.childName || !result.childId) {
                throw new Error();
            }
            setChildName(result.childName);
            setChildId(result.childId);
            if (result.created_at) {
                setCreatedDate((new Date(result.created_at)).toDateString());
            }
        } catch {
            Alert.alert("Could Not Retrieve Child Data",
                "The information for the active child could not be retrieved. Restarting the app may solve the issue.");
            router.dismissTo("/(modals)/profile");  // send the user back to the profile page
        }
    };

    useEffect(() => {
        loadChildData();
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
                            👶 {childName}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setNewChildName(childName);  // autofill with current name
                            setShowRenameChild(true);
                        }}
                        disabled={childId === ""}
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
                            {createdDate}
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View className='pt-4'>
                <Button
                    text='Delete Child'
                    action={handleDeleteChild}
                    disabled={childId === ""}
                    buttonClass='bg-red-600 border-gray-500'
                    textClass='font-bold dark:text-white'
                />
            </View>
            <RenameChildPopup
                visible={showRenameChild}
                childName={newChildName}
                originalName={childName}
                onChildNameUpdate={(name: string) => setNewChildName(name)}
                handleSave={handleRenameChild}
                handleCancel={() => {
                    setShowRenameChild(false);
                    setNewChildName("");  // reset name
                }}
            />
            <SwitchChildPopup
                visible={showSelectChild}
                childNames={children.map(child => child.name)}
                currentChild={children[0]?.name}
                hideCancelButton={true}
                handleSwitch={handleSelectChild}
                handleCancel={() => handleSelectChild(0)}
            />
        </SafeAreaView>
    );
}
