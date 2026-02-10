import React from 'react';
import { router } from 'expo-router';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import Button from '@/components/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/library/auth-provider';

/**
 * SignInScreen.tsx
 * A user login screen for the app. Includes email and password input,
 * with secure password toggle, error handling, and navigation to sign up or guest access.
 */


export default function SignInScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [passwordHidden, setPasswordHidden] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const { signIn } = useAuth();

    const handleSignUp = () => {
        router.replace('/(auth)/signup');
    };

    const handleGuest = () => {
        router.push('/(auth)/guest');
    };

      // Attempt to sign in the user using provided credentials
    const handleSignIn = async () => {
        setLoading(true);
        const response = await signIn(email, password);
        setLoading(false);
        if (response.error) {
            Alert.alert(
                'Sign In Error',
                response.error.message || 'An error occurred while signing in.',
            );
        } else {
            router.replace('/(tabs)');
        }
    };

    const buttonTextClass = 'font-semibold';

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView className='main-container flex-col justify-end'>
                <View className='mb-5'>
                    <Text className='subheading'>Welcome back,</Text>
                    <Text className='heading'>please sign in</Text>
                </View>
                <KeyboardAvoidingView
                    className='flex-col gap-4 transition-all'
                    behavior={'padding'}
                >
                    <View className=''>
                        <Text className='text font-bold'>Email</Text>
                        <TextInput
                            className='text-input'
                            placeholder='Enter your email'
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize='none'
                            keyboardType='email-address'
                            testID='sign-in-email'
                        />
                    </View>
                    <View className=''>
                        <Text className='text font-bold'>Password</Text>
                        <TextInput
                            className='text-input'
                            placeholder='Enter your password'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={passwordHidden}
                            testID='sign-in-password'
                        />
                    </View>
                    <View className='flex-row mt-2 justify-between mb-5'>
                        <TouchableOpacity
                            onPress={() => setPasswordHidden(!passwordHidden)}
                            className=''
                            testID='sign-in-show-password'
                        >
                            <Text className='dark:text-white'>
                                {passwordHidden
                                    ? 'Show Password'
                                    : 'Hide Password'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert(
                                    'Sorry',
                                    'This feature is not yet implemented.',
                                )
                            }
                            testID='sign-in-forgot-password'
                        >
                            <Text className='dark:text-white'>
                                Forgot your password?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <View className='flex-col gap-2'>
                    <Button
                        text={loading ? 'Signing in...' : 'Sign In'}
                        action={handleSignIn}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
                        testID='sign-in-button'
                    />
                    <Button
                        text='Sign Up Instead'
                        action={handleSignUp}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
                        testID='sign-in-sign-up-button'
                    />
                    <Button
                        text='Try as Guest'
                        action={handleGuest}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
                        testID='sign-in-guest-button'
                    />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}
