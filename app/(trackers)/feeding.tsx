import {
    Text,
    View,
    TextInput,
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
import FeedingCategory, { FeedingCategoryList } from '@/components/feeding-category';
import { encryptData } from '@/library/crypto';  // ✅ Added

// Feeding.tsx
// Screen for logging baby feeding sessions — includes category, item name, amount, feeding time, optional notes, and save logic

export default function Feeding() {
    const insets = useSafeAreaInsets();
    const [isTyping, setIsTyping] = useState(false);
    const [category, setCategory] = useState<FeedingCategoryList>('Liquid');
    const [itemName, setItemName] = useState('');
    const [amount, setAmount] = useState('');
    const [feedingTime, setFeedingTime] = useState(new Date());
    const [note, setNote] = useState('');

    // Function to create a new feeding log record into Supabase
    const createFeedingLog = async (
        childId: string,
        category: string,
        itemName: string,
        amount: string,
        feedingTime: Date,
        note = '',
    ) => {
        try {
            // ✅ Encrypt before inserting
            const encryptedCategory = await encryptData(category);
            const encryptedItemName = await encryptData(itemName);
            const encryptedAmount = await encryptData(amount);
            const encryptedNote = note ? await encryptData(note) : null;

            const { data, error } = await supabase.from('feeding_logs').insert([
                {
                    child_id: childId,
                    category: encryptedCategory,
                    item_name: encryptedItemName,
                    amount: encryptedAmount,
                    feeding_time: feedingTime.toISOString(),
                    note: encryptedNote,
                },
            ]);

            if (error) {
                console.error('Error creating feeding log:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('❌ Encryption or insert failed:', err);
            return { success: false, error: 'Encryption or database error' };
        }
    };

    // Fetch active child ID and save feeding log for that child
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

    // Validate input fields and trigger save action
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

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setCategory("Liquid");
        setItemName("");
        setAmount("");
        setFeedingTime(new Date());
        setNote("");
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {/*ScrollView Prevents items from flowing off page on small devices*/}
            <ScrollView>
                <View
                    className='main-container justify-between'
                    style={{ paddingBottom: insets.bottom }}
                >
                    <View
                        className={`gap-6 transition-all duration-300 ${
                            isTyping ? '-translate-y-[40%]' : 'translate-y-0'
                        }`}
                    >
                        {/* FeedingCategory component handles category/item/amount/time inputs */}
                        <FeedingCategory
                            category={category}
                            itemName={itemName}
                            amount={amount}
                            feedingTime={feedingTime}
                            onCategoryUpdate={setCategory}
                            onItemNameUpdate={setItemName}
                            onAmountUpdate={setAmount}
                            onTimeUpdate={setFeedingTime}
                            testID='feeding-data-entry'
                        />
                        {/* Note input section */}
                        <View className='bottom-5'>
                            <View className='items-start top-5 left-3 z-10' testID='feeding-note'>
                                <Text className='bg-gray-200 p-3 rounded-xl font'>
                                    Add a note
                                </Text>
                            </View>
                            <View className='p-4 pt-9 bg-white rounded-xl z-0'>
                                <TextInput
                                    placeholderTextColor={'#aaa'}
                                    placeholder='i.e. does not like pureed carrots'
                                    multiline={true}
                                    maxLength={200}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                    value={note}
                                    onChangeText={setNote}
                                />
                            </View>
                        </View>
                    </View>
                    {/* Action buttons for saving and resetting form */}
                    <View className='flex-row gap-2'>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 grow'
                            onPress={handleSaveFeedingLog}
                            testID='feeding-save-log-button'
                        >
                            <Text>➕ Add to log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 items-center'
                            onPress={() => handleResetFields()}
                            testID='feeding-reset-form-button'
                        >
                            <Text>🗑️ Reset fields</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}
