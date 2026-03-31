import DiaperModule from "@/components/diaper-module";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from "react-native";
import CategoryModule from "@/components/category-module";


jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return {
        __esModule: true,
        default: jest.fn(({testID}: {testID: string}) => <View testID={testID}/>),
        DateTimePickerAndroid: { open: jest.fn() },
    };
});

jest.mock("@/components/category-module", () => {
    const Text = jest.requireActual("react-native").Text;
    const CategoryModuleMock = jest.fn(
        ({testID, selectedCategory}: {testID?: string; selectedCategory: string}) =>
            (<Text testID={testID}>{selectedCategory}</Text>)
    );
    return CategoryModuleMock;
});


/*
 *  setCategoryInput:
 *      Reads update handlers from CategoryModule mocks
 *      filters calls by a provided testID
 *      Calls update handler with provided input
*/
async function setCategoryInput(
    category: string,
    testID: string,
 ) {
    // get calls to <CategoryModule/> matching provided test ID
    const calls = (CategoryModule as jest.Mock).mock.calls.filter(
        call => call[0].testID === testID  // filter calls by test id
    );
    // get update callback from most recent call
    const onCategoryUpdate = calls.slice(-1)[0][0].onCategoryUpdate;

    await act(() => onCategoryUpdate?.(category));
}


describe("Diaper component <DiaperModule/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders inputs", () => {
        render(<DiaperModule/>);

        expect(screen.getByTestId("diaper-category-consistency-module")).toBeTruthy();
        expect(screen.getByTestId("diaper-category-amount-module")).toBeTruthy();
        expect(screen.getByTestId("diaper-time-button")).toBeTruthy();
    });

    test("Changes consistency", async () => {
        const onConsistencyUpdate = jest.fn();
        render(<DiaperModule onConsistencyUpdate={onConsistencyUpdate}/>);

        // consistency should default to wet
        expect(onConsistencyUpdate).toHaveBeenCalledTimes(1);
        expect(onConsistencyUpdate.mock.calls[0][0]).toBe("Wet");

        const testConsistencyCategories = ["Dry", "Mixed", "Wet"];

        for (const category of testConsistencyCategories) {
            await setCategoryInput(category, "diaper-category-consistency-module");  // switch category
            expect(onConsistencyUpdate.mock.lastCall[0]).toBe(category);
        }
    });

    test("Changes amount", async () => {
        const onAmountUpdate = jest.fn();
        render(<DiaperModule onAmountUpdate={onAmountUpdate}/>);

        // amount should default to small
        expect(onAmountUpdate).toHaveBeenCalledTimes(1);
        expect(onAmountUpdate.mock.calls[0][0]).toBe("SM");

        const testAmountCategories = ["MD", "LG", "SM"];

        for (const category of testAmountCategories) {
            await setCategoryInput(category, "diaper-category-amount-module");  // switch category
            expect(onAmountUpdate.mock.lastCall[0]).toBe(category);
        }
    });

    test("Shows/hides date picker (ios)", async () => {
        Platform.OS = "ios";

        render(<DiaperModule/>);

        // Press change date button
        await userEvent.press(screen.getByTestId("diaper-time-button"));
        // ensure date picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        // Press change date button again to close
        await userEvent.press(screen.getByTestId("diaper-time-button"));
        // ensure date picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
    });

    test("updates date (ios)", async () => {
        Platform.OS = "ios";
        const testDate = new Date();
        const onTimeUpdate = jest.fn();  // to capture callbacks by <DiaperModule/>

        // record pre and post render times
        const timeBeforeNow = new Date();
        render(<DiaperModule onTimeUpdate={onTimeUpdate}/>);
        const timeAfterNow = new Date();

        // ensure time was initialized to approximately the current time
        expect(onTimeUpdate).toHaveBeenCalledTimes(1);
        expect(onTimeUpdate.mock.calls[0][0].getTime()).toBeGreaterThanOrEqual(timeBeforeNow.getTime());
        expect(onTimeUpdate.mock.calls[0][0].getTime()).toBeLessThanOrEqual(timeAfterNow.getTime());

        // Press change date button
        await userEvent.press(screen.getByTestId("diaper-time-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure date has been updated once since first useEffect() call
        expect(onTimeUpdate).toHaveBeenCalledTimes(2);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onTimeUpdate.mock.calls[1][0]).toBe(testDate);
    });
    
    test("Shows/hides date picker (android)", async () => {
        Platform.OS = "android";

        render(<DiaperModule/>);

        // ensure date picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // open start date editer
        await userEvent.press(screen.getByTestId("diaper-time-button"));

        // ensure date picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    });
    
    test("Updates date (android)", async () => {
        Platform.OS = "android";
        const testDate = new Date();
        const onTimeUpdate = jest.fn();  // to capture callbacks by <DiaperModule/>

        // record pre and post render times
        const timeBeforeNow = new Date();
        render(<DiaperModule onTimeUpdate={onTimeUpdate}/>);
        const timeAfterNow = new Date();

        // ensure time was initialized to approximately the current time
        expect(onTimeUpdate).toHaveBeenCalledTimes(1);
        expect(onTimeUpdate.mock.calls[0][0].getTime()).toBeGreaterThanOrEqual(timeBeforeNow.getTime());
        expect(onTimeUpdate.mock.calls[0][0].getTime()).toBeLessThanOrEqual(timeAfterNow.getTime());

        await userEvent.press(screen.getByTestId("diaper-time-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once since first useEffect() call
        expect(onTimeUpdate).toHaveBeenCalledTimes(2);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onTimeUpdate.mock.calls[1][0]).toBe(testDate);
    });
});
