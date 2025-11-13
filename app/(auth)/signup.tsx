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
        if (
            !email ||
            !firstName ||
            !lastName ||
            !password ||
            !confirmPassword
        ) {
            Alert.alert('All fields are required.');
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
                Alert.alert(
                    'Sign Up Error',
                    error.message || 'An error occurred during sign up.',
                );
            } else {
                // if successful, sign in automatically
                setLoading(true);
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

    const buttonTextClass = 'font-semibold';

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
                        <View className='grow'>
                            <Text className='text font-bold'>First Name</Text>
                            <TextInput
                                className='text-input'
                                placeholder='Enter your name'
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize='none'
                                keyboardType='default'
                            />
                        </View>
                        <View className='grow'>
                            <Text className='text font-bold'>Last Name</Text>
                            <TextInput
                                className='text-input'
                                placeholder='Enter your last name'
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize='none'
                                keyboardType='default'
                            />
                        </View>
                    </View>
                    <View className=''>
                        <Text className='text font-bold'>Email</Text>
                        <TextInput
                            className='text-input'
                            placeholder='Enter your email'
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize='none'
                            keyboardType='email-address'
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
                        />
                    </View>
                    <View>
                        <Text className='text font-bold'>Confirm Password</Text>
                        <TextInput
                            style={getPasswordInputStyle()}
                            className='text-input'
                            placeholder='Confirm your password'
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={passwordHidden}
                        />
                        {!passwordsMatch && confirmPassword ? (
                            <Text className='text-base text-red-600'>
                                Passwords do not match
                            </Text>
                        ) : null}
                    </View>
                    <View className='flex-row mt-2 justify-between mb-5'>
                        <TouchableOpacity
                            onPress={() => setPasswordHidden(!passwordHidden)}
                            className=''
                        >
                            <Text className='dark:text-white'>
                                {passwordHidden
                                    ? 'Show Passwords'
                                    : 'Hide Passwords'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Not yet implemented.')}
                        >
                            <Text className='dark:text-white'>
                                Forgot your password?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <View className='flex-col gap-2'>
                    <Button
                        text={loading ? 'Signing up...' : 'Sign Up'}
                        action={handleSignUp}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
                    />
                    <Button
                        text='Sign In Instead'
                        action={handleSignIn}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
                    />
                    <Button
                        text='Try as Guest'
                        action={handleGuest}
                        textClass={buttonTextClass}
                        buttonClass='button-normal'
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
