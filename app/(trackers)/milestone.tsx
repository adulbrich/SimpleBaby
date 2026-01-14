import {
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';


export default function Feeding() {
    const insets = useSafeAreaInsets();
    const [isTyping] = useState(false);
    const [category] = useState('');
    const [itemName] = useState('');
    const [amount] = useState('');
    const [feedingTime] = useState(new Date());
    const [note] = useState('');
     /**
     * Inserts a new feeding log into the 'feeding_logs' table on Supabase.
     * Converts feedingTime to ISO string before sending.
     */
    const createFeedingLog = async (
        childId: string,
        category: string,
        itemName: string,
        amount: string,
        feedingTime: Date,
        note = '',
    ) => {
        const { data, error } = await supabase.from('feeding_logs').insert([
            {
                child_id: childId,
                category,
                item_name: itemName,
                amount,
                feeding_time: feedingTime.toISOString(),
                note,
            },
        ]);

        if (error) {
            console.error('Error creating feeding log:', error);
            return { success: false, error };
        }

        return { success: true, data };
    };

    /**
    * Gets the currently active child ID and attempts to save the feeding log.
    * Returns success/error object for handling in UI.
    */
    const saveFeedingLog = async () => {
        const { success, childId, error } = await getActiveChildId();

        if (!success) {
            Alert.alert(`Error: ${error}`);
            return { success: false, error };
        }

        return await createFeedingLog(
            childId,
            category,
            itemName,
            amount,
            feedingTime,
            note,
        );
    };

     /**
     * Validates inputs and attempts to save the feeding log.
     * Navigates back to the main tab screen on success.
     */
    const handleSaveFeedingLog = async () => {
        if (category && itemName && amount) {
            const result = await saveFeedingLog();
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Feeding log saved successfully!');
            } else {
                Alert.alert(`Failed to save feeding log: ${result.error}`);
            }
        } else {
            Alert.alert('Please provide category, item name, and amount');
        }
    };
     // Temporary useEffect to block this screen while it's still in development
    useEffect(() => {
        Alert.alert('Hey!', 'Feature coming soon', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
    }, []);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {/*ScrollView Prevents items from flowing off page on small devices*/}
            <View
                className='main-container justify-between'
                style={{ paddingBottom: insets.bottom }}
            >
                <ScrollView>
                    <View
                        className={`gap-6 transition-all duration-300 ${
                            isTyping ? '-translate-y-[40%]' : 'translate-y-0'
                        }`}
                    ></View>
                    <View className='flex-row gap-2'>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 grow'
                            onPress={handleSaveFeedingLog}
                            testID="health-save-log-button"
                        >
                            <Text>➕ Add to log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 items-center'
                            onPress={() => router.replace('./')}
                            testID="health-reset-form-button"
                        >
                            <Text>🗑️ Reset fields</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}
