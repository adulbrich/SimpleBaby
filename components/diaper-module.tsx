import React, { useEffect, useState } from 'react';
import DateTimePicker, {
    DateTimePickerEvent,
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import CategoryModule from "@/components/category-module";

/**
 * DiaperModule component allows users to select diaper consistency and amount,
 * and manually pick a time for the diaper event.
 * Supports iOS inline spinner picker and Android native time picker dialog.
 * Calls corresponding callbacks whenever diaper time, consistency,
 * or amount updates.
 */

type DiaperConsistency = 'Wet' | 'Dry' | 'Mixed';
type DiaperAmount = 'SM' | 'MD' | 'LG';

export default function DiaperModule({
    onTimeUpdate,
    onConsistencyUpdate,
    onAmountUpdate,
    testID,
}: {
    onTimeUpdate?: (time: Date) => void;
    onConsistencyUpdate?: (consistency: DiaperConsistency) => void;
    onAmountUpdate?: (amount: DiaperAmount) => void;
    testID?: string;
}) {
    const [changeTime, setChangeTime] = useState(new Date());
    const [showIOSPicker, setShowIOSPicker] = useState(false);
    const [selectedConsistency, setSelectedConsistency] =
        useState<DiaperConsistency>('Wet');
    const [selectedAmount, setSelectedAmount] = useState<DiaperAmount>('SM');

    useEffect(() => {
        onTimeUpdate?.(changeTime);
    }, [changeTime, onTimeUpdate]);

    useEffect(() => {
        onConsistencyUpdate?.(selectedConsistency);
    }, [selectedConsistency, onConsistencyUpdate]);

    useEffect(() => {
        onAmountUpdate?.(selectedAmount);
    }, [selectedAmount, onAmountUpdate]);

    const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            setChangeTime(selectedDate);
        }
    };

     // Show the time picker: inline spinner for iOS or native dialog for Android
    const showTimePicker = () => {
        if (showIOSPicker) {
            return setShowIOSPicker(false);
        }

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: changeTime,
                onChange: (event, selectedDate) => {
                    if (selectedDate) {
                        setChangeTime(selectedDate);
                    }
                },
                mode: 'time',
                is24Hour: false,
            });
        } else {
            setShowIOSPicker(true);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleConsistencyPress = (consistency: DiaperConsistency) => {
        setSelectedConsistency(consistency);
    };

    const handleAmountPress = (amount: DiaperAmount) => {
        setSelectedAmount(amount);
    };

    return (
        <View className='flex-col gap-6' testID={testID}>

            <CategoryModule
                title="🌀 Choose Consistency"
                selectedCategory={selectedConsistency}
                categoryList={[
                    { label: "Wet", icon: "💧" },
                    { label: "Dry", icon: "🌵" },
                    { label: "Mixed", icon: "🌦️" },
                ]}
                onCategoryUpdate={handleConsistencyPress}
                testID="diaper-category-consistency-module"
            />

            <CategoryModule
                title="⚖️ Choose Amount"
                selectedCategory={selectedAmount}
                categoryList={[
                    { label: "SM" },
                    { label: "MD" },
                    { label: "LG" },
                ]}
                onCategoryUpdate={handleAmountPress}
                testID="diaper-category-amount-module"
            />

            <View className='tracker-section'>
                <View className='tracker-section-label'>
                    <Text className='tracker-section-label-text'>
                        ⏰ Add Time
                    </Text>
                </View>
                <View className='flex-col gap-4 mb-6'>
                    <View className='ml-4 mr-4 flex-row items-center justify-between'>
                        <Text className='tracker-input-label'>
                            Change Time
                        </Text>
                        <View className='tracker-input-button'>
                            <TouchableOpacity
                                className='tracker-input-subbutton'
                                onPress={showTimePicker}
                                testID='diaper-time-button'
                            >
                                <Text className='tracker-input-text'>
                                    {showIOSPicker ? 'Close' : 'Choose'} ⏰
                                </Text>
                            </TouchableOpacity>
                            <Text className='tracker-input-text mr-4'>
                                {formatTime(changeTime)}
                            </Text>
                        </View>
                    </View>
                    {showIOSPicker && Platform.OS === 'ios' && (
                        <View className='items-center'>
                            <DateTimePicker
                                testID='dateTimePicker'
                                value={changeTime}
                                mode='time'
                                is24Hour={false}
                                onChange={onChangeTime}
                                display='spinner'
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
