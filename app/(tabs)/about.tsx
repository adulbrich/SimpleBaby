import { View, Text, ScrollView } from 'react-native';

export default function AboutScreen() {

    return (
        <ScrollView className='main-container'>
            <View className='p-7'>
                {/* App Title */}
                <Text className='about-title'>
                    SimpleBaby
                </Text>
                <Text className='about-subtitle'>
                    Version 1.0.0 • Built with Expo
                </Text>

                {/* Core Purpose */}
                <Text className='about-label'>
                    Core Purpose
                </Text>
                <Text className='about-text'>
                    SimpleBaby was created to meet the need for a streamlined, secure application that allows parents to track critical information about their child&apos;s growth and health.
                </Text>

                {/* Project Importance */}
                <Text className='about-label'>
                    Secure Tracking
                </Text>
                <Text className='about-text'>
                    The application centralizes daily logs - including feeding, sleep, and diaper changes to help guardians gain helpful insights into developmental trends in a stress-free manner.
                </Text>

                {/* Technical Foundation */}
                <Text className='about-label'>
                    Technical Foundation
                </Text>
                <Text className='about-text'>
                    Built using a modern mobile stack including React Native, Expo, and Supabase for secure backend data management.
                </Text>

                {/* Mission Statement */}
                <Text className='about-footer mt-16'>
                    Designed to make baby tracking simple and stress-free. 💛
                </Text>
            </View>
        </ScrollView>
    );
}
