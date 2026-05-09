import React from 'react';
import {
    Text,
    ScrollView,
    View
} from 'react-native';

import stringLib from "@/assets/stringLibrary.json";


export default function PrivacyPolicy() {
    
    return (
        <ScrollView>
            <View className='modal-container flex-col justify-between flex-grow'>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.about}</Text>
                <Text className="tos-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className='tos-text'>orem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.dataUse}</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.permissions}</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.subaBase}</Text>
                <Text className='tos-text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum eros dictum blandit eu non diam. Nam sem dolor, aliquam nec mattis vel, tincidunt ultricies eros. Morbi fermentum odio at tortor tempus, a aliquet dui placerat. Vivamus eu vehicula magna. </Text>
                <Text className='tos-text'>orem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lobortis magna vitae nisi ullamcorper, sit amet dignissim felis fermentum. Mauris sed pharetra nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a cursus eros. Ut ut justo vestibulum</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.changes}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.contact}</Text>
            </View>
        </ScrollView>
    );
}
