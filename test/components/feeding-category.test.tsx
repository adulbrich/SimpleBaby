import FeedingCategory from "@/components/feeding-category";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from "react-native";


jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return {
        __esModule: true,
        default: jest.fn(({testID}: {testID: string}) => <View testID={testID}/>),
        DateTimePickerAndroid: { open: jest.fn() },
    };
});


describe("Feeding component <FeedingCategory/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders input buttons and text fields", () => {
        // render with placeholder values
        render(<FeedingCategory category="Soft" itemName="" amount="" feedingTime={new Date()}/>);

        expect(screen.getByTestId("feeding-category-liquid-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-category-soft-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-category-solid-button")).toBeTruthy();

        expect(screen.getByTestId("feeding-item-name")).toBeTruthy();
        expect(screen.getByTestId("feeding-amount")).toBeTruthy();
        expect(screen.getByTestId("feeding-time-button")).toBeTruthy();
    });

    test("Changes feeding category", async () => {
        const onCategoryUpdate = jest.fn();
        // render with placeholder values, start with liquid category
        render(<FeedingCategory category="Liquid" itemName="" amount="" feedingTime={new Date()} onCategoryUpdate={onCategoryUpdate}/>);

        // switch to soft
        await userEvent.press(screen.getByTestId("feeding-category-soft-button"));

        // category should last have been changed to soft
        expect(onCategoryUpdate).toHaveBeenCalledTimes(1);
        expect(onCategoryUpdate.mock.calls[0][0]).toBe("Soft");

        // switch to solid
        await userEvent.press(screen.getByTestId("feeding-category-solid-button"));

        // category should last have been changed to solid
        expect(onCategoryUpdate).toHaveBeenCalledTimes(2);
        expect(onCategoryUpdate.mock.calls[1][0]).toBe("Solid");

        // switch to liquid
        await userEvent.press(screen.getByTestId("feeding-category-liquid-button"));

        // category should last have been changed to liquid
        expect(onCategoryUpdate).toHaveBeenCalledTimes(3);
        expect(onCategoryUpdate.mock.calls[2][0]).toBe("Liquid");
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

        // ensure date has been updated once since first useEffect() call
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

        // ensure date has been updated once since first useEffect() call
        expect(onTimeUpdate).toHaveBeenCalledTimes(1);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onTimeUpdate.mock.calls[0][0]).toBe(testDate);
    });
});
