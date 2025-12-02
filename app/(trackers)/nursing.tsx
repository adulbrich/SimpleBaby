import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';
import NursingStopwatch from '@/components/nursing-stopwatch';
import { encryptData } from '@/library/crypto';

// nursing.tsx
// Screen for logging breastfeeding sessions — includes stopwatch, volume input, and notes

export default function Nursing() {
    const insets = useSafeAreaInsets();
    const [isTyping, setIsTyping] = useState(false);
    const [leftDuration, setLeftDuration] = useState('00:00:00');
    const [rightDuration, setRightDuration] = useState('00:00:00');
    const [leftAmount, setLeftAmount] = useState('');
    const [rightAmount, setRightAmount] = useState('');
    const [note, setNote] = useState('');
    const [reset, setReset] = useState<number>(0);

    // Insert a new nursing log entry into Supabase
    const createNursingLog = async (
        childId: string,
        leftDuration: string,
        rightDuration: string,
        leftAmount: string,
        rightAmount: string,
        note = '',
    ) => {
        try {
            const encryptedLeftDuration = await encryptData(leftDuration);
            const encryptedRightDuration = await encryptData(rightDuration);
            const encryptedLeftAmount = await encryptData(leftAmount);
            const encryptedRightAmount = await encryptData(rightAmount);
            const encryptedNote = note ? await encryptData(note) : null;

            const { data, error } = await supabase.from('nursing_logs').insert([
                {
                    child_id: childId,
                    left_duration: encryptedLeftDuration,
                    right_duration: encryptedRightDuration,
                    left_amount: encryptedLeftAmount,
                    right_amount: encryptedRightAmount,
                    note: encryptedNote,
                },
            ]);

            if (error) {
                console.error('Error creating nursing log:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('❌ Encryption failed:', err);
            return { success: false, error: 'Encryption error' };
        }
    };
    
    // Retrieve the current active child, then save log to Supabase
    const saveNursingLog = async () => {
        const { success, childId, error } = await getActiveChildId();

        if (!success) {
            Alert.alert(`Error: ${error}`);
            return { success: false, error };
        }

        return await createNursingLog(
            childId,
            leftDuration,
            rightDuration,
            leftAmount.trim(),
            rightAmount.trim(),
            note,
        );
    };

     // Validate input, then call save
    const handleSaveNursingLog = async () => {
        // Prevent logging if all fields are empty
        if (
            leftDuration !== '00:00:00' ||
            rightDuration !== '00:00:00' ||
            leftAmount.trim() !== '' ||
            rightAmount.trim() !== ''
        ) {
            const result = await saveNursingLog();
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Nursing log saved successfully!');
            } else {
                Alert.alert(`Failed to save nursing log: ${result.error}`);
            }
        } else {
            Alert.alert('Please provide at least one side duration or amount');
        }
    };

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setLeftDuration("00:00:00");
        setRightDuration("00:00:00");
        setLeftAmount("");
        setRightAmount("");
        setNote("");
        setReset(prev => prev + 1);
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View
                className='main-container justify-between'
                style={{ paddingBottom: insets.bottom }}
            >
                <View
                    className={`gap-6 transition-all duration-300 ${
                        isTyping ? '-translate-y-[40%]' : 'translate-y-0'
                    }`}
                >
                    {/* Stopwatch component controls left/right timer states */}
                    <NursingStopwatch
                        key={`nursing-stopwatch-${reset}`}
                        onTimeUpdateLeft={setLeftDuration}
                        onTimeUpdateRight={setRightDuration}
                    />
                    {/* Volume Input Section */}
                    <View className='stopwatch-primary'>
                        <View className='items-start bottom-5 left-3'>
                            <Text className='bg-gray-200 p-3 rounded-xl font'>
                                ⚖️ Add Volume
                            </Text>
                        </View>
                        <View className='flex-row mb-6'>
                            {/* Left Amount Input */}
                            <View className='ml-4 mr-2 grow'>
                                <Text className='feeding-module-label'>
                                    Left Amount
                                </Text>
                                <TextInput
                                    className='text-input-internal'
                                    placeholder='i.e. 6 oz'
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    value={leftAmount}
                                    onChangeText={setLeftAmount}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                />
                            </View>
                            {/* Right Amount Input */}
                            <View className='ml-2 mr-4 grow'>
                                <Text className='feeding-module-label'>
                                    Right Amount
                                </Text>
                                <TextInput
                                    className='text-input-internal'
                                    placeholder='i.e. 12 oz'
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    value={rightAmount}
                                    onChangeText={setRightAmount}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                />
                            </View>
                        </View>
                    </View>
                    {/* Note Input Section */}
                    <View className='bottom-5'>
                        <View className='items-start top-5 left-3 z-10'>
                            <Text className='bg-gray-200 p-3 rounded-xl font'>
                                Add a note
                            </Text>
                        </View>
                        <View className='p-4 pt-9 bg-white rounded-xl z-0'>
                            <TextInput
                                className=''
                                placeholderTextColor={'#aaa'}
                                placeholder='i.e. difficulties with latching or signs of poor latching'
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
                {/* Bottom Buttons */}
                <View className='flex-row gap-2'>
                    <TouchableOpacity
                        className='rounded-full p-4 bg-red-100 grow'
                        onPress={handleSaveNursingLog}
                    >
                        <Text>➕ Add to log</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='rounded-full p-4 bg-red-100 items-center'
                        onPress={() => handleResetFields()}
                    >
                        <Text>🗑️ Reset fields</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
