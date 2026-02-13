import {
    Modal,
    View,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Button from '@/components/button';


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
        handleSwitch: (name: string) => void;
        handleCancel: () => void;
    }
) {
    const renderChildSelectButton = ({ item }: { item: string }) => (
        currentChild === item ? <></> :
        <Button
            text={item}
            action={() => handleSwitch(item)}
            textClass='font-bold text-black'
            buttonClass='bg-[#fff6c9] dark:bg-[#466755] border-[#c4b798] dark:border-[#152619]'
        />
    );

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
                                Change active child
                            </Text>
                            <Text className='subtitle'>
                                Currently tracking progress for {currentChild}.
                                Select another child to switch to:
                            </Text>
                        </View>
                        <View className='grow justify-between'>
                            <View>
                                <FlatList
                                    data={childNames}
                                    renderItem={renderChildSelectButton}
                                    keyExtractor={(item) => item}
                                    contentContainerStyle={{ paddingBottom: 16 }}
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
