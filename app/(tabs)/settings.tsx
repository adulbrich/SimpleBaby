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
                <View className="settings-item">
                    <Text className="settings-label">
                        Settings Name 2
                    </Text>
                    <Text className="text-gray-600">
                        Settings subtext
                    </Text>
                </View>
                <View className="settings-item-row">
                    <Text className="settings-label">
                        Settings Name 3
                    </Text>
                    <Text className="text-gray-600">
                        Settings value
                    </Text>
                </View>
                <View className="settings-item-row">
                	<Text className="settings-label">
                        Settings Name 4
                	</Text>
                    <TouchableOpacity className="rounded-lg">
                        <View className="p-4 w-4 h-4 bg-black rounded-lg"></View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    </View>
  );
}
