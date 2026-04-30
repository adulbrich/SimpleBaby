import { Text, TextInput, View } from "react-native";
import stringLib from "@/assets/stringLibrary.json";


export default function NoteEntry({
    note,
    setNote,
    setIsTyping,
    placeholder,
    testID,
}: {
    note: string;
    setNote: (note: string) => void;
    setIsTyping?: (state: boolean) => void;
    placeholder?: string;
    testID?: string;
}) {
    return (
        <View
            className='tracker-section'
            testID={testID}
        >
            <View className='tracker-section-label'>
                <Text className='tracker-section-label-text'>
                    {stringLib.uiLabels.noteLabel}
                </Text>
            </View>
            <View className='ml-4 mr-4 mb-6'>
                <TextInput
                    className='text-input-note'
                    placeholder={placeholder}
                    multiline={true}
                    maxLength={200}
                    onFocus={() => setIsTyping?.(true)}
                    onBlur={() => setIsTyping?.(false)}
                    value={note}
                    onChangeText={setNote}
                    testID="text-entry"
                />
            </View>
        </View>
    );
}
