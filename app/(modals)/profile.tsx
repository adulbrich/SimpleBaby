import React, { useEffect, useState } from 'react';
import {
    Text,
    ScrollView,
    View,
    TouchableOpacity,
    Alert,
    useColorScheme,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/library/auth-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAudioPlayer } from 'expo-audio';
import AddChildPopup from '@/components/add-child-popup';
import SwitchChildPopup from '@/components/switch-child-popup';
import { getActiveChildId as getLocalActiveChildId, listChildren } from '@/library/local-store';
import supabase from '@/library/supabase-client';
import { getActiveChildData, getChildren, saveNewChild } from '@/library/remote-store';
import stringLib from "@/assets/stringLibrary.json";
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

const alertSound = require('../../assets/sounds/ui-pop.mp3');
const testIDs = stringLib.testIDs.profile;

export default function Profile() {

    const player = useAudioPlayer(alertSound);

    const { isGuest, exitGuest, session } = useAuth();

    const [showAddChild, setShowAddChild] = useState(false);
    const [showSwitchChild, setShowSwitchChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [children, setChildren] = useState<{ name: string; id: string }[]>([]);
    const [loadingNames, setLoadingNames] = useState(true);
    const [namesError, setNamesError] = useState<boolean>(false);

    const [childName, setChildName] = useState<string>('Loading...');
    const [displayName, setDisplayName] = useState<string>('');
    const [displayEmail, setDisplayEmail] = useState<string>('');

    const colorScheme = useColorScheme();
    const childIconColor = colorScheme === 'dark' ? '#ffedd5' : '#f9a000';
    const itemIconColor = colorScheme === 'dark' ? '#e5e7eb' : '#000000';

    const signOutLabel = isGuest ? "Exit Guest Mode" : "Sign Out";

    // Handles user sign-out and route reset
    const handleSignOut = async () => {
        try {
            if (isGuest) {
                // Guest sign-out: leave guest mode (local-only)
                await exitGuest();

                // Send them back to auth entry
                router.dismissTo("/");
            } else {
                // Signed-in session sign-out: Supabase sign out
                const { error } = await supabase.auth.signOut();

                if (error) throw error;
                router.dismissTo("/");
            }
        } catch (e: any) {
            Alert.alert("Sign out failed", e?.message ?? "Please try again.");
        }
    };

    const handleSaveChild = async () => {
        try {
            await saveNewChild(newChildName);  // try to save new child
            setShowAddChild(false);  // Close modal if successful
            setNewChildName("");  // reset child name
            await fetchChildNames();  // reload child names for switching
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'An error occurred while saving child data.',
            );
        }
    };

    const handleSwitchChild = async (index: number) => {
        try {
            if (index < 0 || index >= children.length) {  // if index is invalid
                throw new Error("Unable to find selected child");
            }
            // Update user session metadata with the active child
            const { error } = await supabase.auth.updateUser({
                data: { activeChildId: children[index].id, activeChild: "" },
            });
            if (error) throw error;
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
    }, [session]);  // re-fetch child names if the user renames a child

    const fetchChildNames = async () => {
        try {
            const data = await getChildren();

            if (data) setChildren(data);
        } catch {
            setNamesError(true);
        } finally {
            setLoadingNames(false);
        };
    };

    const routerPath = usePathname();

    useEffect(() => {
        const loadChildName = async () => {
            // If the current page is not the profile page, don't check the child name
            // This prevents errors when the user's only child is deleted from the active-child page
            if (routerPath !== "/profile") return;

            try {
                if (isGuest) {
                    const activeId = await getLocalActiveChildId();
                    if (!activeId) {
                        setChildName("Guest Child");
                        return;
                    }
                    const children = await listChildren();
                    const activeChild = children.find(c => c.id === activeId);
                    setChildName(activeChild?.name ?? 'Guest Child');
                } else if (session) {
                    const result = await getActiveChildData();
                    if (!result.success || !result.childName) {
                        Alert.alert("Could Not Retrieve Child Name", "The name for the active child could not be retrieved. Restarting the app may solve the issue.");
                        setChildName("ERROR");
                        return;
                    }
                    setChildName(result.childName);
                }
            } catch {
                if (isGuest) {
                    Alert.alert("Could Not Retrieve Guest Mode Child", "Could not load the child. Please try again.");
                } else {
                    Alert.alert("Could Not Retrieve Child Name", "The name for the active child could not be retrieved. Restarting the app may solve the issue.");
                    setChildName("Child");
                }
            }
        };

        loadChildName();
    }, [isGuest, session, routerPath]);

    useEffect(() => {
        if (!session) {
            return;
        }
        setDisplayName(`${session.user.user_metadata.firstName} ${session.user.user_metadata.lastName}`);
        setDisplayEmail(session.user.user_metadata.email ?? '');
    }, [session]);

    return (
        <SafeAreaView className='modal-container flex-col justify-between flex-grow'>
            <ScrollView>
                <View className='flex-col gap-4'>
                    <View className='profile-item'>
                        <Text className='profile-child-name-label'>
                            Active Child
                        </Text>
                        { isGuest ? (
                            <View className='profile-bubble-base' testID={testIDs.childNameGuest}>
                                <MaterialCommunityIcons 
                                    name='baby-face-outline' 
                                    size={24} 
                                    color={childIconColor}
                                />
                                <Text 
                                    className='text-2xl text-[#f9a000] dark:text-orange-100' 
                                    numberOfLines={1} 
                                    ellipsizeMode="tail"
                                >
                                    {childName}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => router.push("/(modals)/active-child")}>
                                <View className='profile-bubble-base' testID={testIDs.childNameButton}>
                                    <MaterialCommunityIcons 
                                        name='baby-face-outline' 
                                        size={24} 
                                        color={childIconColor}
                                    />
                                    <Text 
                                        className='child-name-text' 
                                        numberOfLines={1} 
                                        ellipsizeMode="tail"
                                    >
                                        {childName}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    { isGuest ? (
                        undefined
                    ) : loadingNames ? (
                        <View className='profile-item' testID={testIDs.loadingNames}>
                            <Text className='profile-value'>
                                Loading Child Profiles...
                            </Text>
                        </View>
                    ) : namesError ? (
                        <View className='profile-item' testID={testIDs.namesError}>
                            <Text className='profile-value text-red-600'>
                                Error loading child names
                            </Text>
                        </View>
                    ) : children.length < 2 ? (
                        undefined  // show nothing if the user has no other child accounts
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowSwitchChild(true)}
                            testID={testIDs.switchChildButton}
                        >
                            <View className='profile-item'>
                                <View className='child-action-label'>
                                    <AntDesign name='user-switch' size={24} color={itemIconColor}/>
                                    <Text className='child-action-button'>Switch Child</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    {!isGuest && <TouchableOpacity
                        onPress={() => setShowAddChild(true)}
                        testID={testIDs.addChildButton}
                    >
                        <View className='profile-item mb-8'>
                            <View className='child-action-label'>
                                <AntDesign name='plus' size={24} color={itemIconColor}/>
                                <Text className='child-action-button'>Add Child</Text>
                            </View>
                        </View>
                    </TouchableOpacity>}
                    <View className='profile-item'>
                        <View className='profile-bubble-base'>
                            <Ionicons name='person-outline' size={22} color={itemIconColor}/>
                            <Text className='text-lg text-black dark:text-gray-200'>Name</Text>
                        </View>
                        <Text className='profile-value' numberOfLines={1} ellipsizeMode="tail">
                            {isGuest ? "Guest" : displayName}
                        </Text>
                    </View>
                    {!isGuest && <View className='profile-item'>
                        <View className='profile-bubble-base'>
                            <Ionicons name='people-outline' size={22} color={itemIconColor}/>
                            <Text className='text-lg text-black dark:text-gray-200'>Caretakers</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                )
                            }
                            testID={testIDs.caretakersButton}
                        >
                            <Text className='profile-value-link'>
                                Manage
                            </Text>
                        </TouchableOpacity>
                    </View>}
                    {!isGuest && <View className='profile-item'>
                        <View className='profile-bubble-base'>
                            <Ionicons name='mail-outline' size={22} color={itemIconColor}/>
                            <Text className='text-lg text-black dark:text-gray-200'>Email</Text>
                        </View>
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
                            className='shrink'
                            testID={testIDs.emailButton}
                        >
                            <Text numberOfLines={1} ellipsizeMode="tail" className='profile-value-link'>
                                {displayEmail}
                            </Text>
                        </TouchableOpacity>
                    </View>}
                    {!isGuest && <View className='profile-item'>
                        <View className='profile-bubble-base'>
                            <Ionicons name='key-outline' size={22} color={itemIconColor}/>
                            <Text className='text-lg text-black dark:text-gray-200'>Password</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    "Can't do this yet.",
                                    'Please wait for an update.',
                                )
                            }
                            testID={testIDs.passwordButton}
                        >
                            <Text className='profile-value-link'>
                                Change my password
                            </Text>
                        </TouchableOpacity>
                    </View>}
                </View>
            </ScrollView>
            <View className='pt-4'>
                {(session || isGuest) && (
                    <Button
                        text={signOutLabel}
                        action={handleSignOut}
                        buttonClass='button-red'
                        testID={testIDs.signOutButton}
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
                testID={testIDs.addChildPopup}
            />
            <SwitchChildPopup
                visible={showSwitchChild}
                childNames={children.map(child => child.name)}
                currentChild={childName}
                handleSwitch={handleSwitchChild}
                handleCancel={() => {
                    setShowSwitchChild(false);
                }}
                testID={testIDs.switchChildPopup}
            />
        </SafeAreaView>
    );
}
