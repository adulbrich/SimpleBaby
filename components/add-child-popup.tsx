import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Button from '@/components/button';


export default function AddChildPopup({visible, childName, onChildNameUpdate, handleSave, handleCancel, header}: any) {
    return (
        <Modal visible={visible} transparent>
            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
            >
                <BlurView
                    intensity={10}
                    className='grow items-center justify-center'
                >
                    <View className='p-8 h-[50%] w-[80%] bg-white dark:bg-black rounded-3xl border-[1px] border-gray-300 dark:border-gray-600'>
                        <View className='mb-5'>
                            <Text className='subheading font-bold mb-6'>
                                Welcome to SimpleBaby
                            </Text>
                            <Text className='subtitle'>
                                {"Please add your first child's name below:"}
                            </Text>
                        </View>
                        <View className='grow justify-between'>
                            <View>
                                <Text className='text font-bold mb-1'>
                                    Child Name
                                </Text>
                                <TextInput
                                    className='text-input'
                                    placeholder='Enter a name to start tracking'
                                    value={childName}
                                    onChangeText={onChildNameUpdate}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                />
                            </View>
                            <View>
                                <Button
                                    text='Save & Start Tracking'
                                    action={handleSave}
                                    textClass='font-bold'
                                    buttonClass='button-normal'
                                />
                            </View>
                            {handleCancel ? 
                                <View>
                                    <Button
                                        text='Cancel'
                                        action={handleCancel}
                                        textClass='font-bold'
                                        buttonClass='bg-red-600 border-gray-500'
                                    />
                                </View>
                                : undefined
                            }
                        </View>
                    </View>
                </BlurView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
