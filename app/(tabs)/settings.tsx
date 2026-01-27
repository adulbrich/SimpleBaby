import { View, Text } from 'react-native';

export default function SettingScreen() {
  return (
    <View className="main-container items-center justify-center">
      <Text className="text-lg font-bold text-center">
        SimpleBaby App
      </Text>

      <Text className="text-center mt-2 text-gray-600 dark:text-gray-300">
        Version 1.0.0{'\n'}This is the settings page
      </Text>
    </View>
  );
}
