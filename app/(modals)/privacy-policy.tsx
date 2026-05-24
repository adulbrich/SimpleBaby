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
                <Text className="tos-text">{stringLib.privacyPolicy.content.about}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.dataUse}</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.dataUse1}</Text>
                    <Text>  - Timestamps for events</Text>
                    <Text>  - Sleep Duration</Text>
                    <Text>  - The categories for health</Text>
                    <Text>  - The categories for milestones</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.dataUse2}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.permissions}</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.permissions}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.subaBase}</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.subaBase}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.changes}</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.changes}</Text>
                <Text className="tos-heading">{stringLib.privacyPolicy.setionHeader.contact}</Text>
                <Text className="tos-text">{stringLib.privacyPolicy.content.contant}</Text>
            </View>
        </ScrollView>
    );
}
