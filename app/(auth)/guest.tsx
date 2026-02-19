import React from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAuth } from '@/library/auth-provider';

export default function GuestScreen() {
    const { enterGuest } = useAuth();
    
    const handleGuest = async () => {
        try {
            await enterGuest();
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert("Failed To Enter Guest Mode", e.message ?? "Guest mode could not be started. Please try again.");
        }
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
                    action={() => router.back()}
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
