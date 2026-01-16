import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView,
    Platform
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { encryptData } from '@/library/crypto';


export default function Milestone() {
    const insets = useSafeAreaInsets();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [name, setName] = useState('');
    const [milestoneDate, setMilestoneDate] = useState(new Date());
    const [note, setNote] = useState('');

    const showDatePickerModal = () => {
        if (showDatePicker === true) {
          setShowDatePicker(false);
          return;
        }
    
        if (Platform.OS === "android") {
          DateTimePickerAndroid.open({
            value: milestoneDate,
            onChange: (event, selectedDate) => {
              if (selectedDate) {
                setMilestoneDate(selectedDate);
              }
            },
            mode: "date",
          });
        } else {
          setShowDatePicker(true);
        }
      };

    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
        setMilestoneDate(selectedDate);
        }
        setShowDatePicker(false);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString();
    };

     /**
     * Inserts a new milestone log into the 'milestone_logs' table on Supabase.
     * Converts milestoneTime to ISO string before sending.
     */
    const createMilestoneLog = async (
        childId: string,
        name: string,
        milestoneTime: Date,
        note: string,
    ) => {

        const encryptedName = await encryptData(name);
        const encryptedNote = note ? await encryptData(note) : null;

        const { data, error } = await supabase.from('milestone_logs').insert([
            {
                child_id: childId,
                title: encryptedName,
                achieved_at: milestoneTime.toISOString(),
                note: encryptedNote,
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
            name,
            milestoneDate,
            note
        );
    };

     /**
     * Validates inputs and attempts to save the milestone log.
     * Navigates back to the main tab screen on success.
     */
    const handleSaveMilestoneLog = async () => {
        if (name && milestoneDate) {
            const result = await saveMilestoneLog();
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Milestone log saved successfully!');
            } else {
                Alert.alert(`Failed to save milestone log: ${result.error}`);
            }
        } else {
            Alert.alert('Please provide a milestone name and date');
        }
    };

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setName("");
        setMilestoneDate(new Date());
        setNote("");
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

                    {/* Name and Description inputs */}
                    <View className="stopwatch-primary">
                    <View className="items-start bottom-5 left-3">
                        <Text className="bg-gray-200 p-3 rounded-xl font">⚖️ Add Details</Text>
                    </View>

                    <View className="flex-col gap-4 mb-6">
                        <View className="ml-4 mr-4">
                        <Text className="feeding-module-label">Milestone Name</Text>
                        <TextInput
                            className="text-input-internal"
                            placeholder="e.g., First Steps"
                            autoCapitalize="none"
                            keyboardType="default"
                            value={name}
                            onChangeText={setName}
                            testID="milestone-item-name"
                        />
                        </View>

                        <View className="ml-4 mr-4 flex-row items-center justify-between">
                        <Text className="feeding-module-label">Date</Text>
                        <View className="flex-row items-center bg-red-100 rounded-full gap-2">
                            <TouchableOpacity
                            className="rounded-full bg-red-50 p-4"
                            onPress={showDatePickerModal}
                            >
                            <Text>{showDatePicker ? "Close" : "Choose"} 📅</Text>
                            </TouchableOpacity>
                            <Text className="mr-4">{formatDate(milestoneDate)}</Text>
                        </View>
                        </View>

                        {showDatePicker && Platform.OS === "ios" && (
                        <View className="items-center">
                            <DateTimePicker
                            testID="dateTimePicker"
                            value={milestoneDate}
                            mode="date"
                            onChange={onChangeDate}
                            display="spinner"
                            />
                        </View>
                        )}
                    </View>
                    </View>

                    {/* Note input section */}
                    <View className='bottom-5 pt-4'>
                        <View className='items-start top-5 left-3 z-10' testID='milestone-note'>
                            <Text className='bg-gray-200 p-3 rounded-xl font'>
                                Add a note
                            </Text>
                        </View>
                        <View className='p-4 pt-9 bg-white rounded-xl z-0'>
                            <TextInput
                                placeholderTextColor={'#aaa'}
                                placeholder='e.g., took first steps from the table'
                                multiline={true}
                                maxLength={200}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                value={note}
                                onChangeText={setNote}
                                testID='milestone-note-entry'
                            />
                        </View>
                    </View>

                    <View className='flex-row gap-2'>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 grow'
                            onPress={handleSaveMilestoneLog}
                        >
                        <Text>➕ Add to log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 items-center'
                            onPress={handleResetFields}
                        >
                            <Text>🗑️ Reset fields</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}
