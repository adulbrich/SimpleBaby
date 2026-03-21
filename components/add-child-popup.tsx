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
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.addChild;


export default function AddChildPopup(
    {
        visible,
        childName,
        altTitle,
        altSubtitle,
        onChildNameUpdate,
        handleSave,
        handleCancel,
        testID,
    } : {
        visible?: boolean;
        childName: string;
        altTitle?: string;
        altSubtitle?: string;
        onChildNameUpdate: (text: string) => void;
        handleSave: () => void;
        handleCancel?: () => void;
        testID?: string;
    }
) {
    return (
        <Modal visible={visible} transparent testID={testID}>
            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
            >
                <BlurView
                    intensity={10}
                    className='grow items-center justify-center'
                >
                    <View className='p-8 w-[80%] bg-white dark:bg-black rounded-3xl border-[1px] border-gray-300 dark:border-gray-600'>
                        <Text className='subheading font-bold mb-6'>
                            {altTitle ?? "Add a Child"}
                        </Text>
                        <Text className='subtitle'>
                            {altSubtitle ?? "Please enter the name of the child you would like to add:"}
                        </Text>
                        <TextInput
                            className='text-input mb-4 mt-4'
                            placeholder='Enter a name'
                            value={childName}
                            onChangeText={onChildNameUpdate}
                            autoCapitalize='none'
                            keyboardType='default'
                            testID={testIDs.nameEntry}
                        />
                        <Button
                            text='Save New Child'
                            action={handleSave}
                            textClass='font-bold'
                            buttonClass='button-normal mb-4'
                            testID={testIDs.saveButton}
                        />
                        {handleCancel && <Button
                            text='Cancel'
                            action={handleCancel}
                            textClass='font-bold'
                            buttonClass='bg-red-600 border-gray-500'
                            testID={testIDs.cancelButton}
                        />}
                    </View>
                </BlurView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
