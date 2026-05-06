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
                    <View className='popup'>
                        <Text className='subheading font-bold mb-6'>
                            Rename Child
                        </Text>
                        <Text className='subtitle'>
                            Please enter a new name{originalName ? ` for ${originalName}` : ""}:
                        </Text>
                        <TextInput
                            className='text-input mt-5'
                            placeholder='Enter a name'
                            value={childName}
                            onChangeText={onChildNameUpdate}
                            autoCapitalize='none'
                            keyboardType='default'
                        />
                        <Button
                            text='Rename Child'
                            action={handleSave}
                            buttonClass='button-normal mb-3 mt-3'
                        />
                        <Button
                            text='Cancel'
                            action={handleCancel}
                            buttonClass='button-red'
                        />
                    </View>
                </BlurView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
