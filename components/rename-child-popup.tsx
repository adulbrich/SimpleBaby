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


export default function RenameChildPopup(
    {
        visible,
        childName,
        originalName,
        onChildNameUpdate,
        handleSave,
        handleCancel
    } : {
        visible?: boolean;
        childName: string;
        originalName?: string;
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
                    <View className='p-8 h-[50%] w-[80%] bg-white dark:bg-black rounded-3xl border-[1px] border-gray-300 dark:border-gray-600'>
                        <View className='mb-5'>
                            <Text className='subheading font-bold mb-6'>
                                Rename Child
                            </Text>
                            <Text className='subtitle'>
                                Please enter a new name{originalName ? ` for ${originalName}` : ""}:
                            </Text>
                        </View>
                        <View className='grow justify-between'>
                            <TextInput
                                className='text-input'
                                placeholder='Enter a name'
                                value={childName}
                                onChangeText={onChildNameUpdate}
                                autoCapitalize='none'
                                keyboardType='default'
                            />
                            <View>
                                <Button
                                    text='Rename Child'
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
