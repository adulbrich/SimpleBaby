import { View, Text, ScrollView, useColorScheme } from 'react-native';

export default function AboutScreen() {
  const scheme = useColorScheme();
  const isLight = scheme === 'light';

  // Theme-aware colors derived from your global.css
  const bgColor = isLight ? '#fff5e4' : '#0b2218';
  const textColor = isLight ? '#000000' : '#ffffff';
  const subTextColor = isLight ? '#555555' : '#cccccc';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={{ padding: 24, paddingBottom: 60 }}>
        {/* App Title */}
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: textColor, textAlign: 'center', marginTop: 20 }}>
          SimpleBaby
        </Text>
        <Text style={{ fontSize: 16, color: subTextColor, textAlign: 'center', marginBottom: 32 }}>
          Version 1.0.0 • Built with Expo & Supabase
        </Text>

        {/* Core Purpose */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor, marginBottom: 8 }}>
            Core Purpose
          </Text>
          <Text style={{ fontSize: 16, color: subTextColor, lineHeight: 22 }}>
            SimpleBaby was created to provide a streamlined, secure application that allows parents to track critical information about their child's growth and health.
          </Text>
        </View>

        {/* Secure Tracking */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor, marginBottom: 8 }}>
            Secure Tracking
          </Text>
          <Text style={{ fontSize: 16, color: subTextColor, lineHeight: 22 }}>
            The application centralizes daily logs—including feeding, sleep, and diaper changes—to help guardians gain helpful insights into developmental trends.
          </Text>
        </View>

        {/* Technical Foundation */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor, marginBottom: 8 }}>
            Technical Foundation
          </Text>
          <Text style={{ fontSize: 16, color: subTextColor, lineHeight: 22 }}>
            Built using a modern mobile stack including React Native, Expo, and Supabase for secure backend data management.
          </Text>
        </View>

        {/* Mission Statement */}
        <Text style={{ fontSize: 14, color: subTextColor, textAlign: 'center', fontStyle: 'italic', marginTop: 20 }}>
          Designed to make baby tracking simple and stress-free 💛
        </Text>
      </View>
    </ScrollView>
  );
}