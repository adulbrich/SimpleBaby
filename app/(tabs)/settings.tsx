import { router } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function SettingScreen() {
  return (
    <View className="main-container items-left justify-center">
        <ScrollView>
            <View className="bg-gray-100">
                <TouchableOpacity className="settings-item" testID='settings-tos-button'
                    onPress={() => {
                    router.push('/(modals)/tos');}}>
                    <Text className="settings-label">
                        Terms of Service
                    </Text>
                </TouchableOpacity>
				<TouchableOpacity className="settings-item" testID='settings-privacy-button'
                    onPress={() => {
                    router.push('/(modals)/privacypolicy');}}>
                    <Text className="settings-label">
                        Privacy Policy
                    </Text>
                </TouchableOpacity>
                <View className="settings-item-row">
                    <Text className="settings-label">
                        App Version
                    </Text>
                    <Text className="text-gray-600">
                        v0.1a
                    </Text>
                </View>
            </View>
        </ScrollView>
    </View>
  );
}
