import {
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';


export default function Milestone() {
    const insets = useSafeAreaInsets();
    const [isTyping] = useState(false);
    const [category] = useState('');
    const [itemName] = useState('');
    const [amount] = useState('');
    const [milestoneTime] = useState(new Date());
    const [note] = useState('');
     /**
     * Inserts a new milestone log into the 'milestone_logs' table on Supabase.
     * Converts milestoneTime to ISO string before sending.
     */
    const createMilestoneLog = async (
        childId: string,
        category: string,
        itemName: string,
        amount: string,
        milestoneTime: Date,
        note = '',
    ) => {
        const { data, error } = await supabase.from('milestone_logs').insert([
            {
                child_id: childId,
                category,
                item_name: itemName,
                amount,
                milestone_time: milestoneTime.toISOString(),
                note,
            },
        ]);

        if (error) {
            console.error('Error creating milestone log:', error);
            return { success: false, error };
        }

        return { success: true, data };
    };

    /**
    * Gets the currently active child ID and attempts to save the milestone log.
    * Returns success/error object for handling in UI.
    */
    const saveMilestoneLog = async () => {
        const { success, childId, error } = await getActiveChildId();

        if (!success) {
            Alert.alert(`Error: ${error}`);
            return { success: false, error };
        }

        return await createMilestoneLog(
            childId,
            category,
            itemName,
            amount,
            milestoneTime,
            note,
        );
    };

     /**
     * Validates inputs and attempts to save the milestone log.
     * Navigates back to the main tab screen on success.
     */
    const handleSaveMilestoneLog = async () => {
        if (category && itemName && amount) {
            const result = await saveMilestoneLog();
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Milestone log saved successfully!');
            } else {
                Alert.alert(`Failed to save milestone log: ${result.error}`);
            }
        } else {
            Alert.alert('Please provide category, item name, and amount');
        }
    };

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
                            onPress={handleSaveMilestoneLog}
                        >
                            <Text>➕ Add to log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 items-center'
                            onPress={() => router.replace('./')}
                        >
                            <Text>🗑️ Reset fields</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}
