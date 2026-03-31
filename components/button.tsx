import { TouchableOpacity, Text } from 'react-native';

export default function Button({
    text,
    action,
    disabled,
    buttonClass,
    textClass,
    testID,
}: {
    text: string
    action: () => void
    buttonClass?: string
    disabled?: boolean
    textClass?: string
    testID?: string
}) {
    return (
        <TouchableOpacity
            onPress={action}
            className={`button ${buttonClass}`}
            disabled={disabled === undefined ? false : disabled}
            testID={testID}
        >
            <Text className={`button-text ${textClass}`}>{text}</Text>
        </TouchableOpacity>
    );
}
