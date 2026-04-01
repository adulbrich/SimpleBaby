import { render, screen, userEvent, act } from "@testing-library/react-native";
import EditLogPopup, {
    editFieldCategory,
    editFieldDateTime,
    editFieldDuration,
    editFieldImage,
    editFieldText,
    insert,
} from "@/components/edit-log-popup";
import { format } from "date-fns";
import stringLib from "@/assets/stringLibrary.json";
import { Dropdown } from "react-native-element-dropdown";
import { View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";


const testIDs = stringLib.testIDs.editLog;


jest.mock("react-native-element-dropdown", () => {
    const Text = jest.requireActual("react-native").Text;
    return {
        Dropdown: jest.fn(({ value }: { value: string }) => <Text>{value}</Text>)
    };
});

jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({ testID }: { testID: string }) => <View testID={testID}></View>);
});


const testLog = {
    category_input: {
        title: "category title",
        type: "category",
        categories: ["test category 1", "test category 2"],
        value: "test category 1",
        testID: testIDs.categoryInput,
    } as editFieldCategory,
    text_input: {
        title: "text title",
        type: "text",
        value: "test text",
        testID: testIDs.textInput,
    } as editFieldText,
    time_input: {
        title: "time title",
        type: "time",
        value: new Date(),
        buttonTestID: testIDs.timeInputButton,
        pickerTestID: testIDs.timePickerTestID,
        doneButtonTestID: testIDs.timeDoneButton,
    } as editFieldDateTime,
    date_input: {
        title: "date title",
        type: "date",
        value: new Date(),
        buttonTestID: testIDs.dateInputButton,
        pickerTestID: testIDs.datePickerTestID,
        doneButtonTestID: testIDs.dateDoneButton,
    } as editFieldDateTime,
    duration_input: {
        title: "duration title",
        type: "duration",
        value: "test duration",
        testID: testIDs.durationInput,
    } as editFieldDuration,
    image_input: {
        title: "image title",
        type: "image",
        value: "test image",
        testID: testIDs.imageInput,
    } as editFieldImage,
    insert: {
        title: "insert title",
        type: "insert",
        value: <View testID={testIDs.insert}></View>,
    } as insert,
};

const testLogValues = Object.entries(testLog).map(([key, value]) => ({[key]: value.value}));


describe("Edit Log Popup", () => {

    beforeEach(() => {
        // to clear the .mock.calls arrays
        (Dropdown as unknown as jest.Mock).mockClear();
        (DateTimePicker as jest.Mock).mockClear();
    });

    test("Modal show/hides", async () => {
        // render with visible=false
        const { rerender } = render(<EditLogPopup
            popupVisible={false}
            handleCancel={() => undefined}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();

        // re-render with visible=true
        rerender(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
            testID={testIDs.popup}
        />);
        expect(screen.getByTestId(testIDs.popup)).toBeVisible();
        
        // re-render with visible=false
        rerender(<EditLogPopup
            popupVisible={false}
            handleCancel={() => undefined}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();
    });

    test("Renders title", async () => {
        const testTitle = "test title";

        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={testTitle}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByText(testTitle)).toBeTruthy();
    });

    test("Displays basic inputs", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.saveButton)).toBeTruthy();
    });

    test("Displays category input value", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByText(testLog.category_input.value as string)).toBeTruthy();
    });

    test("Passes categories to <Dropdown/>", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        // fetch dropdown data and extract the label field
        const dropdownProps = (Dropdown as unknown as jest.Mock).mock.calls[0][0];
        const dropdownLabels = dropdownProps.data.map(
            (item: { [dropdownProps.data]: string}) => item[dropdownProps.labelField]
        );
        
        expect(dropdownLabels).toEqual(testLog.category_input.categories)
    });

    test("Updates category", async () => {
        const testCategoryUpdated = "test category updated";

        const updateHandler = jest.fn();

        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={updateHandler}
            handleSubmit={() => undefined}
        />);
        expect(screen.getByText(testLog.category_input.value as string)).toBeTruthy();

        // use callback from <Dropdown/> to change user's selection
        await act(async () =>
            (Dropdown as unknown as jest.Mock).mock.calls[0][0].onChange({ item: testCategoryUpdated })
        );

        // update handler should have been called with a callback containing the new category
        expect(updateHandler).toHaveBeenCalledTimes(1);
        const updatedLog = updateHandler.mock.calls[0][0](testLogValues);
        // ensure the intended log field was updated, and that other log fields remain the same
        expect(updatedLog).toEqual({ ...testLogValues, category_input: testCategoryUpdated });
    });

    test("Displays text input value", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByDisplayValue(testLog.text_input.value as string)).toBeTruthy();
    });

    test("Updates text", async () => {
        const testTextUpdated = "test category updated";

        const updateHandler = jest.fn();

        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={updateHandler}
            handleSubmit={() => undefined}
        />);
        expect(screen.getByDisplayValue(testLog.text_input.value as string)).toBeTruthy();

        await userEvent.clear(screen.getByTestId(testIDs.textInput));
        // update handler should have been called with a callback containing the new text
        expect(updateHandler).toHaveBeenCalledTimes(1);
        const updatedLog1 = updateHandler.mock.calls[0][0](testLogValues);
        // ensure the intended log field was updated, and that other log fields remain the same
        expect(updatedLog1).toEqual({ ...testLogValues, text_input: "" });

        await userEvent.paste(screen.getByTestId(testIDs.textInput), testTextUpdated);
        // update handler should have been called with a callback containing the new text
        expect(updateHandler).toHaveBeenCalledTimes(2);
        const updatedLog2 = updateHandler.mock.calls[1][0](testLogValues);
        // ensure the intended log field was updated, and that other log fields remain the same
        expect(updatedLog2).toEqual({ ...testLogValues, text_input: testTextUpdated });
    });

    test("Displays time input value", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByText(format(testLog.time_input.value, "hh:mm a"))).toBeTruthy();
    });

    test("Renders time picker", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByText(format(testLog.time_input.value, "hh:mm a"))).toBeTruthy();
        expect(() => screen.getByTestId(testIDs.timePickerTestID)).toThrow();

        await userEvent.press(screen.getByTestId(testIDs.timeInputButton));
        expect(screen.getByTestId(testIDs.timePickerTestID)).toBeTruthy();
        
        // ensure picker displays with the correct mode and time
        expect((DateTimePicker as jest.Mock).mock.calls[0][0].mode).toBe("time");
        expect((DateTimePicker as jest.Mock).mock.calls[0][0].value).toBe(testLog.time_input.value);
    });

    test("Updates time", async () =>
        updatesDateTime(testIDs.timeInputButton, testIDs.timePickerTestID, "time_input")
    );

    test("Hides time picker on dismiss", async () =>
        hidesDateTimePickerDismiss(testIDs.timeInputButton, testIDs.timePickerTestID)
    );

    test("Hides time picker on ios done button press", async () =>
        hidesDateTimePickerDone(testIDs.timeInputButton, testIDs.timePickerTestID, testIDs.timeDoneButton)
    );

    test("Renders date picker", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByText(format(testLog.date_input.value, "hh:mm a"))).toBeTruthy();
        expect(() => screen.getByTestId(testIDs.datePickerTestID)).toThrow();

        await userEvent.press(screen.getByTestId(testIDs.dateInputButton));
        expect(screen.getByTestId(testIDs.datePickerTestID)).toBeTruthy();
        
        // ensure picker displays with the correct mode and date
        expect((DateTimePicker as jest.Mock).mock.calls[0][0].mode).toBe("date");
        expect((DateTimePicker as jest.Mock).mock.calls[0][0].value).toBe(testLog.date_input.value);
    });

    test("Updates date", async () =>
        updatesDateTime(testIDs.dateInputButton, testIDs.datePickerTestID, "date_input")
    );

    test("Hides date picker on dismiss", async () =>
        hidesDateTimePickerDismiss(testIDs.dateInputButton, testIDs.datePickerTestID)
    );

    test("Hides date picker on ios done button press", async () =>
        hidesDateTimePickerDone(testIDs.dateInputButton, testIDs.datePickerTestID, testIDs.dateDoneButton)
    );

    test("Displays duration input value", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByDisplayValue(testLog.duration_input.value as string)).toBeTruthy();
    });

    test("Updates duration", async () => {
        const updateHandler = jest.fn();

        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={updateHandler}
            handleSubmit={() => undefined}
        />);
        expect(screen.getByDisplayValue(testLog.duration_input.value as string)).toBeTruthy();

        await userEvent.clear(screen.getByTestId(testIDs.durationInput));
        // update handler should have been called with a callback containing the new duration
        expect(updateHandler).toHaveBeenCalled();
        const updatedLog1 = updateHandler.mock.lastCall[0](testLogValues);
        // ensure the duration field was updated to default of "00:00:00", and that other log fields remain the same
        expect(updatedLog1).toEqual({ ...testLogValues, duration_input: "00:00:00" });
    });

    test("Displays image disclaimer", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByTestId(testIDs.imageInput)).toBeTruthy();
    });

    test("Displays insert", async () => {
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={testLog}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByTestId(testIDs.insert)).toBeTruthy();
    });

    test("Calls save handler", async () => {
        const saveHandler = jest.fn();
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={() => undefined}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={saveHandler}
        />);

        await userEvent.press(screen.getByTestId(testIDs.saveButton));
        expect(saveHandler).toHaveBeenCalledTimes(1);
    });

    test("Calls cancel handler", async () => {
        const cancelHandler = jest.fn();
        render(<EditLogPopup
            popupVisible={true}
            handleCancel={cancelHandler}
            title={""}
            editingLog={null}
            setLog={() => undefined}
            handleSubmit={() => undefined}
        />);

        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();  // ensure cancel button is visible
        await userEvent.press(screen.getByTestId(testIDs.cancelButton));
        expect(cancelHandler).toHaveBeenCalledTimes(1);
    });
});


async function updatesDateTime(
    showPickerButtonID: string,
    pickerID: string,
    logField: string
) {
    const testDateTimeUpdated = new Date();

    const updateHandler = jest.fn();

    render(<EditLogPopup
        popupVisible={true}
        handleCancel={() => undefined}
        title={""}
        editingLog={testLog}
        setLog={updateHandler}
        handleSubmit={() => undefined}
    />);
    await userEvent.press(screen.getByTestId(showPickerButtonID));
    expect(screen.getByTestId(pickerID)).toBeTruthy();

    const onDateTimeChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
    await act(async () => onDateTimeChange("set", testDateTimeUpdated));

    // update handler should have been called with a callback containing the new date/time
    expect(updateHandler).toHaveBeenCalledTimes(1);
    const updatedLog = updateHandler.mock.calls[0][0](testLogValues);
    expect(updatedLog).toEqual({ ...testLogValues, [logField]: testDateTimeUpdated });

    // date/time picker should now be hidden
    expect(() => screen.getByTestId(pickerID)).toThrow();
}

async function hidesDateTimePickerDismiss(
    showPickerButtonID: string,
    pickerID: string,
) {
    const updateHandler = jest.fn();

    render(<EditLogPopup
        popupVisible={true}
        handleCancel={() => undefined}
        title={""}
        editingLog={testLog}
        setLog={updateHandler}
        handleSubmit={() => undefined}
    />);
    await userEvent.press(screen.getByTestId(showPickerButtonID));
    expect(screen.getByTestId(pickerID)).toBeTruthy();

    const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
    await act(async () => onDateChange({ type: "dismissed" }, new Date()));

    // update handler should not have been called, and picker should be hidden
    expect(updateHandler).toHaveBeenCalledTimes(0);
    expect(() => screen.getByTestId(pickerID)).toThrow();
}

async function hidesDateTimePickerDone(
    showPickerButtonID: string,
    pickerID: string,
    pickerDoneButtonID: string,
) {
    Platform.OS = "ios";

    const updateHandler = jest.fn();

    render(<EditLogPopup
        popupVisible={true}
        handleCancel={() => undefined}
        title={""}
        editingLog={testLog}
        setLog={updateHandler}
        handleSubmit={() => undefined}
    />);
    expect(() => screen.getByTestId(pickerID)).toThrow();
    expect(() => screen.getByTestId(pickerDoneButtonID)).toThrow();

    await userEvent.press(screen.getByTestId(showPickerButtonID));
    expect(screen.getByTestId(pickerDoneButtonID)).toBeTruthy();

    await userEvent.press(screen.getByTestId(pickerDoneButtonID));

    // date picker and done button should be hidden
    expect(() => screen.getByTestId(pickerID)).toThrow();
    expect(() => screen.getByTestId(pickerDoneButtonID)).toThrow();
}
