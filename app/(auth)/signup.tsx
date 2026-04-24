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
import { formatStringList } from '@/library/utils';
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.signUp;


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
            Alert.alert(stringLib.errors.missingFields, `Please provide the following fields: ${formattedMissing}.`);
            return;
        }

        // Validate that passwords match
        if (password !== confirmPassword) {
            Alert.alert(stringLib.errors.mismatchedPasswords);
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
                        stringLib.errors.signUp,
                        stringLib.errors.emailInUse
                    );
                } else {
                    Alert.alert(
                        stringLib.errors.signUp,
                        error.message || "An unknown error occurred during sign up.",
                    );
                }
            } else {
                // if successful, sign in automatically
                const response = await signIn(email, password);
                setLoading(false);
                if (response.error) {
                    Alert.alert(
                        stringLib.errors.signIn,
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
                                testID={testIDs.firstName}
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
                                testID={testIDs.lastName}
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
                            testID={testIDs.email}
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
                            testID={testIDs.passwordInitial}
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
                            testID={testIDs.passwordConfirm}
                        />
                        {!passwordsMatch && confirmPassword ? (
                            <Text
                                className='text-base text-red-600'
                                testID={testIDs.passwordError}
                            >
                                Passwords do not match
                            </Text>
                        ) : null}
                    </View>
                    <View className='flex-row mt-2 justify-between mb-5'>
                        <TouchableOpacity
                            onPress={() => setPasswordHidden(!passwordHidden)}
                            testID={testIDs.passwordVisibility}
                        >
                            <Text className='auth-label'>
                                {passwordHidden
                                    ? 'Show Passwords'
                                    : 'Hide Passwords'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Not yet implemented.')}
                            testID={testIDs.forgotPassword}
                        >
                            <Text className='auth-label'>
                                Forgot your password?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <View className='flex-col gap-2'>
                    <Button
                        text={loading ? stringLib.uiLabels.signUpButtonLoading : stringLib.uiLabels.signUpButton}
                        action={handleSignUp}
                        buttonClass='button-normal'
                        testID={testIDs.signUpButton}
                    />
                    <Button
                        text='Sign In Instead'
                        action={handleSignIn}
                        buttonClass='button-normal'
                        testID={testIDs.signInButton}
                    />
                    <Button
                        text='Try as Guest'
                        action={handleGuest}
                        buttonClass='button-normal'
                        testID={testIDs.guestButton}
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
