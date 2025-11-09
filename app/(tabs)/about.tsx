import { View, Text } from 'react-native';

export default function AboutScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <Text className="text-lg font-bold text-center">SimpleBaby App</Text>
      <Text className="text-center mt-2 text-gray-600 dark:text-gray-300">
        Version 1.0.0{'\n'}Built with Expo and Supabase
      </Text>
    </View>
  );
}
