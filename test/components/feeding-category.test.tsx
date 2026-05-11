import FeedingCategory, { FeedingCategoryList } from "@/components/feeding-category";
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
 *      Reads update handler from last call to CategoryModule
 *      Calls update handler with provided input
*/
async function setCategoryInput(
    category: string,
 ) {
    // get most recent call to <CategoryModule/>
    const onCategoryUpdate = (CategoryModule as jest.Mock).mock.lastCall[0].onCategoryUpdate;
    await act(() => onCategoryUpdate?.(category));
}


describe("Feeding component <FeedingCategory/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders input buttons and text fields", () => {
        // render with placeholder values
        render(<FeedingCategory category="Soft" itemName="" amount="" feedingTime={new Date()}/>);

        expect(screen.getByTestId("feeding-category-module")).toBeTruthy();
        expect(screen.getByTestId("feeding-item-name")).toBeTruthy();
        expect(screen.getByTestId("feeding-amount")).toBeTruthy();
        expect(screen.getByTestId("feeding-time-button")).toBeTruthy();
    });

    test("Renders provided values", () => {
        const testValuesInitial = {
            category: "Solid",
            itemName: "test item name",
            amount: "test amount",
            time: new Date(),
        };
        const testValuesUpdated = {
            category: "Soft",
            itemName: "test updated item name",
            amount: "test updated amount",
            time: new Date(new Date().getTime() - 142*60*1000),
        };
        const { rerender } = render(<FeedingCategory
            category={testValuesInitial.category as FeedingCategoryList}
            itemName={testValuesInitial.itemName}
            amount={testValuesInitial.amount}
            feedingTime={testValuesInitial.time}
        />);

        // ensure initial values are present in <CategoryModule/> props
        const categoryInitial = (CategoryModule as jest.Mock).mock.lastCall[0];
        expect(categoryInitial.selectedCategory).toBe(testValuesInitial.category);
        // ensure item name and amount are displayed
        expect(screen.getByDisplayValue(testValuesInitial.itemName)).toBeTruthy();
        expect(screen.getByDisplayValue(testValuesInitial.amount)).toBeTruthy();
        // ensure time is displayed on screen
        const formattedTimeInitial = testValuesInitial.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedTimeInitial)).toBeTruthy();

        // rerender with new values
        rerender(<FeedingCategory
            category={testValuesUpdated.category as FeedingCategoryList}
            itemName={testValuesUpdated.itemName}
            amount={testValuesUpdated.amount}
            feedingTime={testValuesUpdated.time}
        />);

        // ensure updated values are present in <CategoryModule/> props
        const categoryUpdated = (CategoryModule as jest.Mock).mock.lastCall[0];
        expect(categoryUpdated.selectedCategory).toBe(testValuesUpdated.category);
        // ensure item name and amount are displayed
        expect(screen.getByDisplayValue(testValuesUpdated.itemName)).toBeTruthy();
        expect(screen.getByDisplayValue(testValuesUpdated.amount)).toBeTruthy();
        // ensure time is displayed on screen
        const formattedTimeUpdated = testValuesUpdated.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedTimeUpdated)).toBeTruthy();
    });

    test("Changes feeding category", async () => {
        const onCategoryUpdate = jest.fn();
        // render with placeholder values, start with liquid category
        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()} onCategoryUpdate={onCategoryUpdate}/>);

        const testConsistencyCategories = ["Soft", "Solid", "Liquid"];

        for (const category of testConsistencyCategories) {
            await setCategoryInput(category);  // switch category
            expect(onCategoryUpdate.mock.lastCall[0]).toBe(category);
        }
    });

    test("Shows/hides date picker (ios)", async () => {
        Platform.OS = "ios";

        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()}/>);

        // Press change date button
        await userEvent.press(screen.getByTestId("feeding-time-button"));
        // ensure date picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        // Press change date button again to close
        await userEvent.press(screen.getByTestId("feeding-time-button"));
        // ensure date picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
    });

    test("updates date (ios)", async () => {
        Platform.OS = "ios";
        const testDate = new Date();
        const onTimeUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>

        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()} onTimeUpdate={onTimeUpdate}/>);

        // Press change date button
        await userEvent.press(screen.getByTestId("feeding-time-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure date has been updated once
        expect(onTimeUpdate).toHaveBeenCalledTimes(1);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onTimeUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Shows/hides date picker (android)", async () => {
        Platform.OS = "android";

        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()}/>);

        // ensure date picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // open start date editer
        await userEvent.press(screen.getByTestId("feeding-time-button"));

        // ensure date picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    });

    test("Updates date (android)", async () => {
        Platform.OS = "android";
        const testDate = new Date();

        const onTimeUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()} onTimeUpdate={onTimeUpdate}/>);

        await userEvent.press(screen.getByTestId("feeding-time-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once
        expect(onTimeUpdate).toHaveBeenCalledTimes(1);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onTimeUpdate.mock.calls[0][0]).toBe(testDate);
    });
});
