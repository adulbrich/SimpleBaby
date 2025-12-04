import React, { useEffect, useState } from 'react';
import DateTimePicker, {
    DateTimePickerEvent,
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

/**
 * DiaperModule component allows users to select diaper consistency and amount,
 * and manually pick a time for the diaper event.
 * Supports iOS inline spinner picker and Android native time picker dialog.
 * Calls corresponding callbacks whenever diaper time, consistency,
 * or amount updates.
 */

type DiaperConsistency = 'Wet' | 'Dry' | 'Mixed'
type DiaperAmount = 'SM' | 'MD' | 'LG'

export default function DiaperModule({
    onTimeUpdate,
    onConsistencyUpdate,
    onAmountUpdate,
}: {
    onTimeUpdate?: (time: Date) => void
    onConsistencyUpdate?: (consistency: DiaperConsistency) => void
    onAmountUpdate?: (amount: DiaperAmount) => void
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
        <View className='flex-col gap-6'>
            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        🌀 Choose Consistency
                    </Text>
                </View>
                <View className='flex-row gap-4 justify-center mb-6'>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedConsistency === 'Wet'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleConsistencyPress('Wet')}
                    >
                        <Text className='scale-100 text-2xl'>💧</Text>
                        <Text className='feeding-category-text'>Wet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedConsistency === 'Dry'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleConsistencyPress('Dry')}
                    >
                        <Text className='scale-100 text-2xl'>🌵</Text>
                        <Text className='feeding-category-text'>Dry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedConsistency === 'Mixed'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleConsistencyPress('Mixed')}
                    >
                        <Text className='scale-100 text-2xl'>🌦️</Text>
                        <Text className='feeding-category-text'>Mixed</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        ⚖️ Choose Amount
                    </Text>
                </View>
                <View className='flex-row gap-4 justify-center mb-6'>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedAmount === 'SM'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleAmountPress('SM')}
                    >
                        <Text className='diaper-amount-text'>SM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedAmount === 'MD'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleAmountPress('MD')}
                    >
                        <Text className='diaper-amount-text'>MD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            selectedAmount === 'LG'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleAmountPress('LG')}
                    >
                        <Text className='diaper-amount-text'>LG</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        ⏰ Add Time
                    </Text>
                </View>
                <View className='flex-col gap-4 mb-6'>
                    <View className='ml-4 mr-4 flex-row items-center justify-between'>
                        <Text className='feeding-module-label'>
                            Change Time
                        </Text>
                        <View className='flex-row items-center bg-red-100 rounded-full gap-2'>
                            <TouchableOpacity
                                className='rounded-full bg-red-50 p-4'
                                onPress={showTimePicker}
                            >
                                <Text>
                                    {showIOSPicker ? 'Close' : 'Choose'} ⏰
                                </Text>
                            </TouchableOpacity>
                            <Text className='mr-4'>
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
