import { router } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function SettingScreen() {
  return (
    <View className="main-container items-left justify-center">
        <ScrollView>
            <View className="bg-gray-100">
                <TouchableOpacity className="p-4 gap-4 mb-1 bg-white"
                    onPress={() => {
                    router.push('/(modals)/tos');}}>
                    <Text className="text-lg font-bold text-left">
                        Terms of Service
                    </Text>
                </TouchableOpacity>
				<TouchableOpacity className="p-4 gap-4 mb-1 bg-white"
                    onPress={() => {
                    router.push('/(modals)/privacypolicy');}}>
                    <Text className="text-lg font-bold text-left">
                        Privacy Policy
                    </Text>
                </TouchableOpacity>
                <View className="p-4 gap-4 mb-1 bg-white">
                    <Text className="text-lg font-bold text-left">
                        Settings Name 2
                    </Text>
                    <Text className="text-gray-600">
                        Settings subtext
                    </Text>
                </View>
                <View className="p-4 gap-4 mb-1 bg-white flex-row justify-between">
                    <Text className="text-lg font-bold text-left">
                        Settings Name 3
                    </Text>
                    <Text className="text-gray-600">
                        Settings value
                    </Text>
                </View>
                <View className="p-4 gap-4 mb-1 bg-white flex-row justify-between">
                	<Text className="text-lg font-bold text-left">
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
