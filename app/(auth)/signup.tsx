import { router } from 'expo-router';
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/button';
import { useAuth } from '@/library/auth-provider';
import { formatStringList } from '@/library/log-functions';

const SignUpScreen: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [passwordHidden, setPasswordHidden] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const { signUp, signIn } = useAuth();

    const passwordsMatch = password === confirmPassword;

    const handleSignUp = async () => {
        // Validate that all fields are filled in
		const missingFields = [];
		if (!email.trim()) missingFields.push("email");
		if (!firstName.trim()) missingFields.push("first name");
		if (!lastName.trim()) missingFields.push("last name");
		if (!password.trim()) missingFields.push("password");
		else if (!confirmPassword.trim()) missingFields.push("confirmed password");

        if (missingFields.length > 0) {
            const formattedMissing = formatStringList(missingFields);
            Alert.alert('All fields are required.', `Please provide the following fields: ${formattedMissing}.`);
            return;
        }

        // Validate that passwords match
        if (password !== confirmPassword) {
            Alert.alert('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // Call the signUp function from your auth provider
            const { error } = await signUp(email, password, firstName, lastName);
            if (error) {
                const message = error.message ?? "";
                if (message === "User already registered") {
                    Alert.alert(
                       "Sign Up Error",
                       "That email is already in use. Please try again." 
                    );
                } else {
                    Alert.alert(
                        "Sign Up Error",
                        error.message || "An unknown error occurred during sign up.",
                    );
                }
            } else {
                // if successful, sign in automatically
                const response = await signIn(email, password);
                setLoading(false);
                if (response.error) {
                    Alert.alert(
                        'Sign In Error',
                        response.error.message ||
                            'An error occurred while signing in.',
                    );
                } else {
                    router.replace('/(tabs)');
                }
            }
        } catch (err) {
            console.error(err);
            Alert.alert('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = () => {
        router.replace('/signin');
    };

    const handleGuest = () => {
        router.push('/guest');
    };

    const getPasswordInputStyle = () => [
        !passwordsMatch && confirmPassword ? styles.errorInput : {},
    ];

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView className='main-container flex-col justify-end'>
                <View className='mb-5'>
                    <Text className='subheading'>Welcome to SimpleBaby,</Text>
                    <Text className='heading'>please sign up</Text>
                </View>
                <KeyboardAvoidingView
                    className='flex-col gap-4 transition-all'
                    behavior={'padding'}
                >
                    <View className='flex-row gap-4'>
                        <View className='flex-1'>
                            <Text className='auth-label'>First Name</Text>
                            <TextInput
                                className='text-input'
                                placeholder='Enter your first name'
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize='none'
                                keyboardType='default'
                                testID="sign-up-first-name"
                            />
                        </View>
                        <View className='flex-1'>
                            <Text className='auth-label'>Last Name</Text>
                            <TextInput
                                className='text-input'
                                placeholder='Enter your last name'
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize='none'
                                keyboardType='default'
                                testID="sign-up-last-name"
                            />
                        </View>
                    </View>
                    <View>
                        <Text className='auth-label'>Email</Text>
                        <TextInput
                            className='text-input'
                            placeholder='Enter your email'
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize='none'
                            keyboardType='email-address'
                            testID="sign-up-email"
                        />
                    </View>
                    <View>
                        <Text className='auth-label'>Password</Text>
                        <TextInput
                            className='text-input'
                            placeholder='Enter your password'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={passwordHidden}
                            testID="sign-up-password-initial"
                        />
                    </View>
                    <View>
                        <Text className='auth-label'>Confirm Password</Text>
                        <TextInput
                            style={getPasswordInputStyle()}
                            className='text-input'
                            placeholder='Confirm your password'
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={passwordHidden}
                            testID="sign-up-password-confirm"
                        />
                        {!passwordsMatch && confirmPassword ? (
                            <Text
                                className='text-base text-red-600'
                                testID="password-error"
                            >
                                Passwords do not match
                            </Text>
                        ) : null}
                    </View>
                    <View className='flex-row mt-2 justify-between mb-5'>
                        <TouchableOpacity
                            onPress={() => setPasswordHidden(!passwordHidden)}
                            testID="sign-up-password-visibility"
                        >
                            <Text className='auth-label'>
                                {passwordHidden
                                    ? 'Show Passwords'
                                    : 'Hide Passwords'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Not yet implemented.')}
                            testID="sign-up-forgot-password"
                        >
                            <Text className='auth-label'>
                                Forgot your password?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <View className='flex-col gap-2'>
                    <Button
                        text={loading ? 'Signing up...' : 'Sign Up'}
                        action={handleSignUp}
                        buttonClass='button-normal'
                        testID="sign-up"
                    />
                    <Button
                        text='Sign In Instead'
                        action={handleSignIn}
                        buttonClass='button-normal'
                        testID="sign-in"
                    />
                    <Button
                        text='Try as Guest'
                        action={handleGuest}
                        buttonClass='button-normal'
                        testID="guest-button"
                    />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    errorInput: {
        borderColor: 'red',
    },
});

export default SignUpScreen;
