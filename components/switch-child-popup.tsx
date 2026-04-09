import {
    Modal,
    View,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Button from '@/components/button';
import ListSelect from './list-select';
import { useEffect, useState } from 'react';
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.switchChild;


export default function SwitchChildPopup(
    {
        visible,
        childNames,
        currentChild,
        hideCancelButton,
        handleSwitch,
        handleCancel,
        testID,
    } : {
        visible?: boolean;
        childNames: string[];
        currentChild?: string;
        hideCancelButton?: boolean;
        handleSwitch: (index: number) => void;
        handleCancel: () => void;
        testID?: string;
    }
) {
    const [selected, setSelected] = useState<number>(-1);

    // call useEffect to get correct index after childNames parameter loads
    useEffect(() => {
        if (currentChild) setSelected(childNames.indexOf(currentChild));
    }, [childNames, currentChild]);

    return (
        <Modal visible={visible} transparent onRequestClose={handleCancel} testID={testID}>
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
                                Select Child
                            </Text>
                            <Text className='subtitle'>
                                Select a child to switch to:
                            </Text>
                        </View>
                            <View className='max-h-[20em]'>
                                <ListSelect
                                    items={childNames}
                                    selected={selected}
                                    onSelect={setSelected}
                                    testID={testIDs.nameList}
                                />
                            </View>
                            <Button
                                text='Select'
                                action={() => handleSwitch(selected)}
                                textClass='font-bold'
                                buttonClass='button-normal mb-3 mt-3'
                                testID={testIDs.selectButton}
                            />
                            { !hideCancelButton &&
                                <Button
                                    text='Cancel'
                                    action={handleCancel}
                                    textClass='font-bold'
                                    buttonClass='bg-red-600 border-gray-500'
                                    testID={testIDs.cancelButton}
                                />
                            }
                    </View>
                </BlurView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
