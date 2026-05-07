import ManualEntry from "@/components/sleep-manual-entry";
import { act, render, screen, userEvent } from "@testing-library/react-native";
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


describe("Sleep Component <ManualEntry/>", () => {
    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders inputs", () => {
        Platform.OS = "ios";
        render(<ManualEntry startDate={new Date()} endDate={new Date()}/>);

        expect(screen.getByTestId("sleep-manual-start-time")).toBeTruthy();
        expect(screen.getByTestId("sleep-manual-end-time")).toBeTruthy();
    });

    test("Renders provided values", () => {
        const nowMS = new Date().getTime();
        const testValuesInitial = { start: new Date(nowMS), end: new Date(nowMS + 3*60*1000) };
        const testValuesUpdated = { start: new Date(nowMS - 143*60*1000), end: new Date(nowMS - 10*60*1000) };
        const { rerender } = render(<ManualEntry
            startDate={testValuesInitial.start}
            endDate={testValuesInitial.end}
        />);

        // ensure times are displayed on screen
        const formattedStartInitial = testValuesInitial.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedStartInitial)).toBeTruthy();
        const formattedEndInitial = testValuesInitial.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedEndInitial)).toBeTruthy();

        // rerender with new values
        rerender(<ManualEntry
            startDate={testValuesUpdated.start}
            endDate={testValuesUpdated.end}
        />);

        // ensure updated times are displayed on screen
        const formattedStartUpdated = testValuesUpdated.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedStartUpdated)).toBeTruthy();
        const formattedEndUpdated = testValuesUpdated.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        expect(screen.getByText(formattedEndUpdated)).toBeTruthy();
    });

    test("Displays time picker (ios)", async () => {
        Platform.OS = "ios";

        render(<ManualEntry startDate={new Date()} endDate={new Date()}/>);

        // ensure time picker isn't visible yet
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();

        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // ensure time picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // ensure time picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();

        // repeat for end time button
        await userEvent.press(screen.getByTestId("sleep-manual-end-time"));

        // ensure time picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        await userEvent.press(screen.getByTestId("sleep-manual-end-time"));

        // ensure time picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
    });

    test("Time picker closes on non 'set' events (ios)", async () => {
        Platform.OS = "ios";
        const testEvent = "cancel";  // must be !== "set"

        const onDatesUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>

        render(<ManualEntry
            onStartDateUpdate={onDatesUpdate}
            onEndDateUpdate={onDatesUpdate}
            startDate={new Date()}
            endDate={new Date()}
        />);

        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;

        // simulate date change with callback
        await act(() => onDateChange(testEvent));

        // ensure time picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
        // ensure date has not been updated since first useEffect() call
        expect(onDatesUpdate).toHaveBeenCalledTimes(0);
    });

    test("Updates start date (ios)", async () => {
        Platform.OS = "ios";
        const testDate = new Date();

        const onDatesUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>
        render(<ManualEntry
            onStartDateUpdate={onDatesUpdate}
            startDate={new Date()}
            endDate={new Date()}
        />);

        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure time picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
        // ensure date has been updated once with the test date as the start date
        expect(onDatesUpdate).toHaveBeenCalledTimes(1);
        expect(onDatesUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Updates end date (ios)", async () => {
        Platform.OS = "ios";
        const testDate = new Date();

        const onDatesUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>
        render(<ManualEntry
            onEndDateUpdate={onDatesUpdate}
            startDate={new Date()}
            endDate={new Date()}
        />);

        await userEvent.press(screen.getByTestId("sleep-manual-end-time"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure time picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
        // ensure date has been updated once with the test date as the end time
        expect(onDatesUpdate).toHaveBeenCalledTimes(1);
        expect(onDatesUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Displays time picker (android)", async () => {
        Platform.OS = "android";

        render(<ManualEntry startDate={new Date()} endDate={new Date()}/>);

        // ensure time picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // open start time editer
        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // ensure time picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);

        // open end time editer
        await userEvent.press(screen.getByTestId("sleep-manual-end-time"));

        // ensure time picker has been shown again
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2);
    });

    test("Updates start date (android)", async () => {
        Platform.OS = "android";
        const testDate = new Date();

        const onDatesUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>
        render(<ManualEntry
            onStartDateUpdate={onDatesUpdate}
            startDate={new Date()}
            endDate={new Date()}
        />);

        await userEvent.press(screen.getByTestId("sleep-manual-start-time"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once with the test date as the start date
        expect(onDatesUpdate).toHaveBeenCalledTimes(1);
        expect(onDatesUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Updates end date (android)", async () => {
        Platform.OS = "android";
        const testDate = new Date();

        const onDatesUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>
        render(<ManualEntry
            onEndDateUpdate={onDatesUpdate}
            startDate={new Date()}
            endDate={new Date()}
        />);

        await userEvent.press(screen.getByTestId("sleep-manual-end-time"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once with the test date as the end date
        expect(onDatesUpdate).toHaveBeenCalledTimes(1);
        expect(onDatesUpdate.mock.calls[0][0]).toBe(testDate);
    });
});
