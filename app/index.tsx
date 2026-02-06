import Button from "@/components/button";
import { useAuth } from "@/library/auth-provider";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// RootIndex.tsx
// Entry screen for the app — handles redirect if user is already logged in, otherwise shows welcome screen with sign-in/up options
export default function RootIndex() {
  const { session, loading, isGuest, enterGuest } = useAuth();

  // If user is authenticated and loading is complete, redirect to home tabs
  useEffect(() => {
    // Once loading is done, if session exists or we have a guest session, redirect to (tabs)
    if (!loading && (session || isGuest)) {
      router.replace("/(tabs)");
    }
  }, [session, isGuest, loading]);

  // Loading state with spinner
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  
  // Navigation handlers for auth routes
  const { width } = Dimensions.get("window");
  const handleSignIn = () => {
    return router.replace("/(auth)/signin");
  };
  const handleSignUp = () => {
    return router.replace("/(auth)/signup");
  };
  const handleGuest = async () => {
    await enterGuest();
    router.replace("/(auth)/guest");
  };
  const buttonTextClass = "";

  return (
    <SafeAreaProvider>
      <SafeAreaView className="main-container flex-col justify-end">
        <View className="w-full overflow-visible items-center">
          <Image
            style={{
              width,
              height: width,
              position: "relative",
              left: width / 2,
            }}
            source={require("@/assets/images/bottle.png")}
            placeholder={{}}
            contentFit="contain"
            transition={1000}
            testID="simple-baby-logo"
          />
        </View>
         {/* App welcome text */}
        <View className="mt-10">
          <Text className="subheading">Welcome to</Text>
          <Text className="heading">SimpleBaby</Text>
          <Text className="subtitle">
            {"A secure baby tracker that's easy to use."}
          </Text>
        </View>
        {/* Auth action buttons */}
        <View className="flex-col gap-2 mt-10">
          <Button
            text="Sign In"
            action={handleSignIn}
            textClass={buttonTextClass}
            buttonClass="button-normal"
            testID="sign-in-button"
          />
          <Button
            text="Sign Up"
            action={handleSignUp}
            textClass={buttonTextClass}
            buttonClass="button-normal"
            testID="sign-up-button"
          />
          <Button
            text="Try as Guest"
            action={handleGuest}
            textClass={buttonTextClass}
            buttonClass="button-normal"
            testID="guest-button"
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
