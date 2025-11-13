import React from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';

export default function GuestScreen() {
    const handleGuest = () => {
        Alert.alert(
            'Success',
            'You are now in guest mode...not!',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        router.dismiss();
                    },
                },
            ],
            { cancelable: false },
        );
    };

    const buttonTextClass = 'font-semibold';

    return (
        <SafeAreaView className='main-container flex-col justify-end'>
            <View className=''>
                <View className='mb-5'>
                    <Text className='subheading font-bold'>
                        Before you proceed:
                    </Text>
                </View>
                <View className='flex-col gap-4 mb-10'>
                    <View className='flex-row gap-2'>
                        <Text className='text'>{'\u2022'}</Text>
                        <Text className='text flex-1'>
                            Guest mode offers a temporary way to explore the
                            app.
                        </Text>
                    </View>
                    <View className='flex-row gap-2'>
                        <Text className='text'>{'\u2022'}</Text>
                        <Text className='text flex-1'>
                            Your data is secure; however, it has not been
                            extensively tested to persist over app updates.
                        </Text>
                    </View>
                    <View className='flex-row gap-2'>
                        <Text className='text'>{'\u2022'}</Text>
                        <Text className='text flex-1'>
                            We strongly suggest signing up to ensure your data
                            is backed up to the cloud.
                        </Text>
                    </View>
                    <View className='flex-row gap-2'>
                        <Text className='text'>{'\u2022'}</Text>
                        <Text className='text flex-1'>
                            Please note that some functionalities may be limited
                            without an account.
                        </Text>
                    </View>
                </View>
            </View>

            <View className='flex-col gap-2'>
                <Button
                    text='Cancel'
                    action={() => router.dismissAll()}
                    textClass={buttonTextClass}
                    buttonClass='button-red'
                />
                <Button
                    text='Continue'
                    action={handleGuest}
                    textClass={buttonTextClass}
                    buttonClass='button-normal'
                />
            </View>
        </SafeAreaView>
    );
}
