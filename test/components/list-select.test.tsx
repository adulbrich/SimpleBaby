import { render, screen, userEvent } from "@testing-library/react-native";
import ListSelect from "@/components/list-select";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.listSelect;


const testListItems = [
    "test list item 1",
    "test list item 2",
    "test list item 3",
];


describe("List Select", () => {

    test("Displays items", async () => {
        render(<ListSelect
            items={testListItems}
            selected={0}
            onSelect={() => undefined}
        />);

        for (const item of testListItems) {
            expect(screen.getByText(item)).toBeTruthy();
        }
    });

    test("Calls selection callback", async () => {
        const onSelect = jest.fn();
        render(<ListSelect
            items={testListItems}
            selected={-1}
            onSelect={onSelect}
        />);

        for (const index of testListItems.keys()) {
            await userEvent.press(screen.getByTestId(`${testIDs.listItem}-${index}`));
            expect(onSelect).toHaveBeenLastCalledWith(index);
        }
    });

    test("Tracks current selection", async () => {
        const testSelection = 1;

        const onSelect = jest.fn();
        render(<ListSelect
            items={testListItems}
            selected={testSelection}
            onSelect={onSelect}
        />);

        for (const checkIndex of testListItems.keys()) {
            if (checkIndex === testSelection) {
                expect(screen.getByTestId(`${testIDs.listItemSelected}-${checkIndex}`)).toBeTruthy();
                expect(() => screen.getByTestId(`${testIDs.listItem}-${checkIndex}`)).toThrow();
            } else {
                expect(screen.getByTestId(`${testIDs.listItem}-${checkIndex}`)).toBeTruthy();
                expect(() => screen.getByTestId(`${testIDs.listItemSelected}-${checkIndex}`)).toThrow();
            }
        }
    });
});
