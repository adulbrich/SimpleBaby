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
        testID,
    } : {
        items: string[];
        selected: number;
        onSelect: (item: number) => void;
        testID?: string;
    }
) {
    const renderSelectButton = ({ item, index }: { item: string; index: number; }) => (
        <TouchableOpacity
            onPress={() => onSelect(index)}
            className={index === selected ? "list-select-item-selected" : "list-select-item"}
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
            testID={testID}
        />
    );
};
