import { TouchableOpacity, Text } from 'react-native'

export default function Button({
    text,
    action,
    buttonClass,
    textClass,
    testID
}: {
    text: string
    action: () => void
    buttonClass?: string | undefined
    textClass?: string | undefined
    testID?: string | undefined
}) {
    return (
        <TouchableOpacity onPress={action} className={`button ${buttonClass}`} testID={testID}>
            <Text className={`button-text ${textClass}`}>{text}</Text>
        </TouchableOpacity>
    )
}
