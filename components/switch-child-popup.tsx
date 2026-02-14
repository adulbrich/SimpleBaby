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


export default function SwitchChildPopup(
    {
        visible,
        childNames,
        currentChild,
        handleSwitch,
        handleCancel
    } : {
        visible?: boolean;
        childNames: string[];
        currentChild: string;
        handleSwitch: (index: number) => void;
        handleCancel: () => void;
    }
) {
    const [selected, setSelected] = useState<number>(-1);

    // call useEffect to get correct index after childNames parameter loads
    useEffect(() => setSelected(childNames.indexOf(currentChild)), [childNames, currentChild]);

    return (
        <Modal visible={visible} transparent onRequestClose={handleCancel}>
            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
            >
                <BlurView
                    intensity={10}
                    className='grow items-center justify-center'
                >
                    <View className='p-8 h-[60%] w-[80%] bg-white dark:bg-black rounded-3xl border-[1px] border-gray-300 dark:border-gray-600'>
                        <View className='mb-5'>
                            <Text className='subheading font-bold mb-6'>
                                Change active child
                            </Text>
                            <Text className='subtitle'>
                                Select a child to switch to:
                            </Text>
                        </View>
                        <View className='justify-between'>
                            <View className='h-[50%]'>
                                <ListSelect
                                    items={childNames}
                                    selected={selected}
                                    onSelect={setSelected}
                                />
                            </View>
                                <Button
                                    text='Select'
                                    action={() => handleSwitch(selected)}
                                    textClass='font-bold'
                                    buttonClass='button-normal mb-2'
                                />
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
