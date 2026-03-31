import { render, screen, userEvent, act } from "@testing-library/react-native";
import Feeding from "@/app/(trackers)/feeding";
import { router } from "expo-router";
import { Alert } from "react-native";
import FeedingCategory, { FeedingCategoryList } from '@/components/feeding-category';
import { field, formatStringList, saveLog } from "@/library/log-functions";


jest.mock("expo-router", () => {
    const replace = jest.fn();
    return ({
        router: {
            replace: replace,
        },
    });
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/components/feeding-category.tsx", () => {
    const { View, TextInput } = jest.requireActual("react-native");
    const FeedingCategoryMock = jest.fn((
        { testID, category, itemName, amount, feedingTime }:
        { testID?: string; category: FeedingCategoryList; itemName: string; amount: string; feedingTime: Date; }
    ) => (
        <View testID={testID}>
            <TextInput value={category}/>
            <TextInput value={itemName}/>
            <TextInput value={amount}/>
            <TextInput value={feedingTime}/>
        </View>
    ));
    return FeedingCategoryMock;
});

jest.mock("@/library/auth-provider", () => ({
    useAuth: () => ({ isGuest: false }),
}));

jest.mock("@/library/log-functions", () => ({
    saveLog: jest.fn(async () => ({ success: true })),
    formatStringList: jest.fn(),
}));

/*
 *  setFeedingInputs:
 *      Reads update handlers from first call to FeedingCategory mock
 *      Calls update handlers with provided inputs
 *      Calls userEvent.type for note
*/
async function setFeedingInputs({
    category,
    itemName,
    amount,
    time,
    note,
} : {
    category?: FeedingCategoryList;
    itemName?: string;
    amount?: string;
    time?: Date;
    note?: string;
}) {
    // read parameters to first call of DiaperModule
    const {
        onCategoryUpdate,
        onItemNameUpdate,
        onAmountUpdate,
        onTimeUpdate,
    } = (FeedingCategory as jest.Mock).mock.calls[0][0];

    // call update handlers for feeding info
    if (category != null) {
        await act(() => onCategoryUpdate?.(category));
    }
    if (itemName != null) {
        await act(() => onItemNameUpdate?.(itemName));
    }
    if (amount != null) {
        await act(() => onAmountUpdate?.(amount));
    }
    if (time != null) {
        await act(() => onTimeUpdate?.(time));
    }

    // type into <TextInput/> components for note
    if (note != null) {
        await userEvent.type(
            screen.getByTestId("feeding-note-entry"),
            note
        );
    }
}


describe("Track feeding screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array for each
        (Alert.alert as jest.Mock).mockClear();
        (router.replace as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (FeedingCategory as jest.Mock).mockClear();
        (saveLog as jest.Mock).mockClear();
    });

    test("Renders feeding tracking inputs", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-data-entry")).toBeTruthy();
        expect(screen.getByTestId("feeding-note-entry")).toBeTruthy();
    });
    
    test("Renders form control buttons", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-reset-form-button")).toBeTruthy();
    });
    
    test("Refreshes on reset", async () => {
        const testCategory = "Soft";
        const testName = "test name";
        const testAmount = "test amount";
        const testNote = "test note";

        render(<Feeding/>);

        // simulate user input
        await setFeedingInputs({
            category: testCategory,
            itemName: testName,
            amount: testAmount,
            note: testNote,
        });

        // check values are there before we reset
        expect(screen.getByDisplayValue(testCategory)).toBeTruthy();
        expect(screen.getByDisplayValue(testName)).toBeTruthy();
        expect(screen.getByDisplayValue(testAmount)).toBeTruthy();
        expect(screen.getByDisplayValue(testNote)).toBeTruthy();

        await userEvent.press(screen.getByTestId("feeding-reset-form-button"));

        // after reset, those values should no longer be in any input
        expect(screen.queryByDisplayValue(testCategory)).toBeNull();
        expect(screen.queryByDisplayValue(testName)).toBeNull();
        expect(screen.queryByDisplayValue(testAmount)).toBeNull();
        expect(screen.queryByDisplayValue(testNote)).toBeNull();
    });
    
    test("Catch unfilled inputs", async () => {
        const testFormattedList = "test list";

        render(<Feeding/>);
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );
        
        const testInputs = [
            { itemName: "", amount: "" },
            { itemName: " ", amount: " " },
            { itemName: "test food", amount: "" },
            { itemName: "", amount: "test amount" },
        ];

        for (const testInput of testInputs) {
            (Alert.alert as jest.Mock).mockClear();  // clear calls between iterations

            // library/log-functions.ts -> formatStringList() should be mocked to return a test string
            // This is to ensure its return value is displayed properly
            (formatStringList as jest.Mock).mockImplementationOnce(
                () => testFormattedList
            );

            // fill in test inputs
            await setFeedingInputs(testInput);
            await userEvent.press(
                screen.getByTestId("feeding-save-log-button")
            );

            expect(formatStringList as jest.Mock).toHaveBeenLastCalledWith(
                Object.entries(testInput).map(([field, value]) =>
                    value.trim() ? null :
                    field === "itemName" ? "item name" :
                    field
                ).filter(field => field)
            );

            // error message generated by app/(trackers)/feeding.tsx -> checkInputs()
            // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Missing Information`);
            expect((Alert.alert as jest.Mock).mock.calls[0][1])
                .toBe(`Failed to save the Feeding log. You are missing the following fields: ${testFormattedList}.`);
        }
    });

    test("Catch saveLog() error", async () => {
        const testErrorMessage = "test error";

        // library/log-functions.ts -> saveLog() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        (saveLog as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });

        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by library/log-functions.ts -> saveLog()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save feeding log: ${testErrorMessage}`);
    });

    test("Redirects user on successful submit", async () => {
        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.replace as jest.Mock).mock.calls[0][0]).toBe(`/(tabs)`);
        expect((router.replace as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Feeding log saved successfully!`);
    });
        
    test("Saves correct values", async () => {
        const testNote = "test note";
        const testName = "test food";
        const testAmount = "test amount";
        const testCategory = "Solid";
        const testTime = new Date();

        render(<Feeding/>);

        // simulate user input
        await setFeedingInputs({
            category: testCategory,
            itemName: testName,
            amount: testAmount,
            note: testNote,
            time: testTime,
        });

        // submit log
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        const savedValues = (saveLog as jest.Mock).mock.calls[0][0].fields;

        // Ensure saveLog() was called with the correct values
        const findfield = (name: string, value: any) =>
            (field: field) => field.dbFieldName === name && field.value === value;
        expect(savedValues.find(findfield("item_name", testName))).toBeTruthy();
        expect(savedValues.find(findfield("category", testCategory))).toBeTruthy();
        expect(savedValues.find(findfield("amount", testAmount))).toBeTruthy();
        expect(savedValues.find(findfield("note", testNote))).toBeTruthy();
        expect(savedValues.find(findfield("feeding_time", testTime))).toBeTruthy();

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Feeding log saved successfully!`);
    });

});
