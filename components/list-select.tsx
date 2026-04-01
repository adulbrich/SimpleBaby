import {
    Text,
    FlatList,
    TouchableOpacity
} from 'react-native';
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.listSelect;


export default function ListSelect(
    {
        items,
        selected,
        onSelect,
    } : {
        items: string[];
        selected: number;
        onSelect: (item: number) => void;
    }
) {
    const renderSelectButton = ({ item, index }: { item: string; index: number; }) => (
        <TouchableOpacity
            onPress={() => onSelect(index)}
            className={`rounded-lg p-2 border-[1px] shadow-sm m-2 ${
                index === selected ? "bg-[#fff6c9] dark:bg-[#466755]" : "bg-gray-200"
            }`}
            testID={`${selected === index ? testIDs.listItemSelected : testIDs.listItem}-${index}`}
        >
            <Text className={`text-lg`}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={items}
            renderItem={renderSelectButton}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 16 }}
        />
    );
};
