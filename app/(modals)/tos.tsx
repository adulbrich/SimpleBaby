import React from 'react';
import {
    Text,
    ScrollView,
    View
} from 'react-native';
import { useAuth } from '@/library/auth-provider';

/**
 * Profile Screen
 * Displays current user profile details (e.g., name, email, active child) using session context from Supabase.
 * Users can view but not yet edit their account details. A "Sign Out" button allows users to log out.
 * Some options like changing email or password and managing caretakers are shown as placeholders with alerts.
 */

const alertSound = require('../../assets/sounds/ui-pop.mp3');

export default function Profile() {

    const { session } = useAuth();
    
    return (
        <ScrollView>
            <View className='p-4 flex-col justify-between flex-grow mt-100'>
                <Text className="tos-heading">1. Topic A</Text>
                <Text className="tos-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className='tos-text'>orem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum</Text>
                <Text className="tos-heading">2. Topic B</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className="tos-heading">3. Topic C</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className="tos-heading">4. Topic D</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className='tos-text'>orem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum</Text>
            </View>
        </ScrollView>
    );
}
