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


export default function AddChildPopup(
    {
        visible,
        childName,
        onChildNameUpdate,
        handleSave,
        handleCancel
    } : {
        visible?: boolean;
        childName: string;
        onChildNameUpdate: (text: string) => void;
        handleSave: () => void;
        handleCancel: () => void;
    }
) {
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
                    <View className='p-8 w-[80%] bg-white dark:bg-black rounded-3xl border-[1px] border-gray-300 dark:border-gray-600'>
                        <View className='mb-5'>
                            <Text className='subheading font-bold mb-6'>
                                Add a Child
                            </Text>
                            <Text className='subtitle'>
                                Please enter the name of the child you would like to add:
                            </Text>
                        </View>
                        <View className='grow justify-between'>
                            <View>
                                <Text className='text font-bold mb-1'>
                                    Child Name
                                </Text>
                                <TextInput
                                    className='text-input mb-4'
                                    placeholder='Enter a name'
                                    value={childName}
                                    onChangeText={onChildNameUpdate}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                />
                            </View>
                            <View  className='mb-4'>
                                <Button
                                    text='Save New Child'
                                    action={handleSave}
                                    textClass='font-bold'
                                    buttonClass='button-normal'
                                />
                            </View>
                            <View>
                                <Button
                                    text='Cancel'
                                    action={handleCancel}
                                    textClass='font-bold'
                                    buttonClass='bg-red-600 border-gray-500'
                                />
                            </View>
                        </View>
                    </View>
                </BlurView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
