import { View, Text, ScrollView } from 'react-native';

export default function SettingScreen() {
  return (
    <View className="main-container items-left justify-center">
      <ScrollView>
        <View className="bg-gray-100">
          <Text className="text-lg font-bold text-left p-4 gap-4 mb-1 bg-white">
            Settings Name 1
          </Text>
          <Text className="text-lg font-bold text-left p-4 gap-4 mb-1 bg-white">
            Settings Name 2
          </Text>
          <Text className="text-lg font-bold text-left p-4 gap-4 mb-1 bg-white">
            Settings Name 3
          </Text>
          <Text className="text-lg font-bold text-left p-4 gap-4 mb-1 bg-white">
            Settings Name 4
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
