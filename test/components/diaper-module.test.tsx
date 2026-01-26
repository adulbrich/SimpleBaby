import DiaperModule from "@/components/diaper-module";
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


describe("Diaper component <DiaperModule/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders input buttons", () => {
        render(<DiaperModule/>);

        expect(screen.getByTestId("diaper-consistency-wet-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-consistency-dry-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-consistency-mixed-button")).toBeTruthy();

        expect(screen.getByTestId("diaper-amount-sm-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-amount-md-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-amount-lg-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-time-button")).toBeTruthy();
    });

    test("Changes consistency", async () => {
        const onConsistencyUpdate = jest.fn();
        render(<DiaperModule onConsistencyUpdate={onConsistencyUpdate}/>);

        // consistency should default to wet
        expect(onConsistencyUpdate).toHaveBeenCalledTimes(1);
        expect(onConsistencyUpdate.mock.calls[0][0]).toBe("Wet");

        // switch to dry
        await userEvent.press(screen.getByTestId("diaper-consistency-dry-button"));

        // consistency should last have been changed to dry
        expect(onConsistencyUpdate).toHaveBeenCalledTimes(2);
        expect(onConsistencyUpdate.mock.calls[1][0]).toBe("Dry");

        // switch to mixed
        await userEvent.press(screen.getByTestId("diaper-consistency-mixed-button"));

        // consistency should last have been changed to mixed
        expect(onConsistencyUpdate).toHaveBeenCalledTimes(3);
        expect(onConsistencyUpdate.mock.calls[2][0]).toBe("Mixed");

        // switch back to wet
        await userEvent.press(screen.getByTestId("diaper-consistency-wet-button"));

        // consistency should last have been changed to wet
        expect(onConsistencyUpdate).toHaveBeenCalledTimes(4);
        expect(onConsistencyUpdate.mock.calls[3][0]).toBe("Wet");
    });

    test("Changes amount", async () => {
        const onAmountUpdate = jest.fn();
        render(<DiaperModule onAmountUpdate={onAmountUpdate}/>);

        // amount should default to small
        expect(onAmountUpdate).toHaveBeenCalledTimes(1);
        expect(onAmountUpdate.mock.calls[0][0]).toBe("SM");

        // switch to medium
        await userEvent.press(screen.getByTestId("diaper-amount-md-button"));

        // amount should last have been changed to medium
        expect(onAmountUpdate).toHaveBeenCalledTimes(2);
        expect(onAmountUpdate.mock.calls[1][0]).toBe("MD");

        // switch to large
        await userEvent.press(screen.getByTestId("diaper-amount-lg-button"));

        // amount should last have been changed to large
        expect(onAmountUpdate).toHaveBeenCalledTimes(3);
        expect(onAmountUpdate.mock.calls[2][0]).toBe("LG");

        // switch back to small
        await userEvent.press(screen.getByTestId("diaper-amount-sm-button"));

        // amount should last have been changed to small
        expect(onAmountUpdate).toHaveBeenCalledTimes(4);
        expect(onAmountUpdate.mock.calls[3][0]).toBe("SM");
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
