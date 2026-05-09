import SleepLogsView from "@/app/(logs)/sleep-logs";
import { render, screen, act } from "@testing-library/react-native";
import supabase from "@/library/supabase-client";
import { encryptData } from "@/library/crypto";
import { format } from 'date-fns';
import { Alert } from "react-native";
import { useAuth } from "@/library/auth-provider";
import { updateRow } from "@/library/local-store";
import EditLogPopup from "@/components/edit-log-popup";
import LogItem from "@/components/log-item";
import { fetchLogs, handleDeleteLog } from "@/library/log-functions";


jest.mock("@/library/supabase-client", () => {
    const del = jest.fn(async () => ({}));
    const updateId = jest.fn(async () => ({}));
    const updateData = jest.fn(() => ({ eq: updateId }));
    return ({
        from: () => ({
            delete: () => ({
                eq: del,
            }),
            update: updateData,
        }),
    });
});

jest.mock("@/components/edit-log-popup", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`),
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/auth-provider", () => ({
    useAuth: jest.fn(() => ({})),
}));

jest.mock("@/library/local-store", () => ({
    updateRow: jest.fn(async () => true),
}));

jest.mock("@/components/log-item.tsx", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({id}: {id?: string}) => (<View testID={`log-item-${id}`}></View>));
});

jest.mock("@/library/log-functions", () => ({
    fetchLogs: jest.fn(),
    handleDeleteLog: jest.fn(),
}));


const NOW = (new Date).getTime();
const TEST_LOGS = [{
    id: "test log id 1",
    start_time: new Date(NOW - 2*24*60*60*1000 - 60*1000),
    end_time: new Date(NOW - 2*24*60*60*1000),
    duration: "test duration 1",
    note: "test note 1",
}, {
    id: "test log id 2",
    start_time: new Date(NOW + 5*60*1000),
    end_time: new Date(NOW + 7*60*1000),
    duration: "test duration 2",
    note: "",
}];

// set default mocks to return test data
(fetchLogs as jest.Mock).mockImplementation(
    async () => ({ success: true, data: TEST_LOGS })
);


const pressButton = async (id: string, button: "delete" | "edit") => {
    const logItems = (LogItem as jest.Mock).mock.calls;
    const logItemProps = logItems.find(call => call[0].id === id)[0];
    if (button === "delete") await act(async () => logItemProps.onDelete());
    if (button === "edit") await act(async () => logItemProps.onEdit());
};


describe("Sleep logs screen", () => {

    beforeAll(() => {
        // set to account (not guest) mode:
        // library/auth-provider -> useAuth() should be mocked to return: { isGuest: /* falsy value */ }
        (useAuth as jest.Mock).mockImplementation(() => ({}));
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update as unknown as jest.Mock).mockClear();
        (EditLogPopup as jest.Mock).mockClear();
        (LogItem as jest.Mock).mockClear();
        (handleDeleteLog as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch fetchLogs() error", async () => {
        const testErrorMessage = "test error";

        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/sleep-logs.tsx -> fetchSleepLogs()
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<SleepLogsView/>);

        expect(await screen.findByTestId("sleep-logs-loading-error")).toBeTruthy();  // wait for loading to finish
        expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
    });

    test("Renders no logs (generic)", async () => {
        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* truthy value */, data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, data: [] })
        );
        await catchNoLogs("You don't have any sleep logs yet!");
    });

    test("Renders no logs (specific child)", async () => {
        const testChildName = "test child name";
        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* truthy value */, data: /* falsy value */, childName: /* truthy string */ }
        // This should cause a notification to the user of no logs found to be displayed with the child name
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, data: [], childName: testChildName })
        );
        await catchNoLogs(`You don't have any sleep logs for ${testChildName} yet!`);
    });

    test("Renders log buttons", rendersLogItems);

    test("Renders log values", async () => {
        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            const logItems = (LogItem as jest.Mock).mock.calls;
            const logItemProps = logItems.find(call => call[0].id === log.id)[0];
            const displayValues = logItemProps.logData.map((item: any) => item.value);

            expect(displayValues.includes(format(new Date(log.start_time), 'MMM dd, yyyy'))).toBeTruthy();
            expect(displayValues.includes(format(new Date(log.start_time), 'h:mm a'))).toBeTruthy();
            expect(displayValues.includes(format(new Date(log.end_time), 'h:mm a'))).toBeTruthy();
            expect(displayValues.includes(log.duration)).toBeTruthy();
            if (log.note) expect(displayValues.includes(log.note)).toBeTruthy();
        }
    });

    test("Calls handleDeleteLog() with correct values", async () => callsHandleDeleteLog(false));

    test("Blocks edit/delete when deleting", async () => {
        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // buttons should not be disabled
            let logItems = (LogItem as jest.Mock).mock.calls.slice(-TEST_LOGS.length);
            let logItemProps = logItems.find(call => call[0].id === log.id)[0];
            expect(logItemProps.buttonsDisabled).toBe(false);

            await pressButton(log.id, "delete");
            // record that the delete alert is visible
            const setAlertVisible = (handleDeleteLog as jest.Mock).mock.calls[0][3];
            await act(async () => setAlertVisible(true));

            // buttons should be disabled now
            logItems = (LogItem as jest.Mock).mock.calls.slice(-TEST_LOGS.length);
            logItemProps = logItems.find(call => call[0].id === log.id)[0];
            expect(logItemProps.buttonsDisabled).toBe(true);

            // record delete alert as hidden before next iteration
            await act(async () => setAlertVisible(false));

            // buttons should be enabled again
            logItems = (LogItem as jest.Mock).mock.calls.slice(-TEST_LOGS.length);
            logItemProps = logItems.find(call => call[0].id === log.id)[0];
            expect(logItemProps.buttonsDisabled).toBe(false);
        }
    });

    test("Updates displayed logs on delete", async () => {
        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        const deletedLog = TEST_LOGS[0];  // choose any log
        const updatedLogs = TEST_LOGS.filter(log => log.id !== log.id);

        // ensure log was passed to <LogItem/>
        const initialLogItems = (LogItem as jest.Mock).mock.calls;
        expect(initialLogItems.find(call => call[0].id === deletedLog.id)).toBeTruthy();

        // press delete
        await pressButton(deletedLog.id, "delete");

        (LogItem as jest.Mock).mockClear();  // clear the calls of <LogItem/>

        // get updater from handleDeleteLog()
        const updateLogs = (handleDeleteLog as jest.Mock).mock.calls[0][4];
        await act(async () => updateLogs((value: typeof TEST_LOGS) => {
            expect(value).toBe(TEST_LOGS);
            return updatedLogs;
        }));

        // confirm deleted log was not rerendered
        const updatedLogItems = (LogItem as jest.Mock).mock.calls;
        expect(updatedLogItems.find(call => call[0].id === deletedLog.id)).toBeFalsy();

        // confirm all logs in updated list are shown
        for (const log of updatedLogs) {
            expect(updatedLogItems.find(call => call[0].id === log.id)).toBeTruthy();
        }
    });

    test("Displays edit log", async () => {
        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        // open edit log pop-up
        await pressButton(TEST_LOGS[0].id, "edit");

        // ensure popup is in DOM
        expect(screen.getByTestId("sleep-logs-edit-popup")).toBeTruthy();
        // Ensure popup has been shown
        expect((EditLogPopup as jest.Mock).mock.lastCall[0].popupVisible).toBe(true);
    });

    test("Passes current values to edit log pop-up", async () => {
        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // open edit log pop-up
            await pressButton(log.id, "edit");

            // retrieve current editingLog from <EditingLogPopup/>
            const editingLog = (EditLogPopup as jest.Mock).mock.lastCall[0].editingLog;

            // check field values
            expect(editingLog.start_time.value).toBe(log.start_time);
            expect(editingLog.end_time.value).toBe(log.end_time);
            expect(editingLog.duration.value).toBe(log.duration);
            expect(editingLog.note.value).toBe(log.note);
        }
    });

    test("Catch encryption error edit log", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<SleepLogsView/>);
        await screen.findByTestId("sleep-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            if (!log.note) {
                continue;  // there are no fields to encrypt
            }

            // library/crypto -> encryptData() should be mocked to throw an error
            // This should cause error handling in callback defined in app/(logs)/sleep-logs.tsx -> handleSaveEdit
            (encryptData as jest.Mock).mockImplementationOnce(
                async () => { throw new Error; }
            );

            // open edit log pop-up
            await pressButton(log.id, "edit");

            // submit edit
            const submitCallback = (EditLogPopup as jest.Mock).mock.lastCall[0].handleSubmit;
            await act(async () => submitCallback());

            // Alert.alert called by sleep-logs.tsx -> handleSaveEdit()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Something went wrong during save.");
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Catch supabase error edit log", async () => catchUpdateError(() =>
        // supabase.from().update().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/sleep-logs.tsx -> handleSaveEdit
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (supabase.from("").update as unknown as jest.Mock).mockClear(),
        0,
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear(),
        1
    ));

    test("Updates displayed logs", async () => updateDisplayedLogs());
});


describe("sleep logs screen (guest mode)", () => {

    beforeAll(() => {
        // change to guest mode
        (useAuth as jest.Mock).mockImplementation(() => ({isGuest: true}));
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (EditLogPopup as jest.Mock).mockClear();
        (LogItem as jest.Mock).mockClear();
        (handleDeleteLog as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Renders log buttons (guest)", rendersLogItems);

    test("Calls handleDeleteLog() with correct values (guest)", async () => callsHandleDeleteLog(true));

    test("Catch local storage error edit log", async () => catchUpdateError(() =>
        // library/local-store.ts -> updateRow should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(logs)/sleep-logs.tsx -> handleSaveEdit
        (updateRow as jest.Mock).mockImplementationOnce(
            async () => false
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (updateRow as jest.Mock).mockClear(),
        2,  // updateRow() is called wit the data object as the 3rd argument
        (updateRow as jest.Mock).mockClear(),
        1  // updateRow() is called wit the log id as the 2nd argument
    ));

    test("Updates displayed logs", async () => updateDisplayedLogs());
});


async function catchNoLogs(message: string) {
    render(<SleepLogsView/>);
    expect(await screen.findByText(message)).toBeTruthy();
}

async function rendersLogItems() {
    render(<SleepLogsView/>);
    await screen.findByTestId("sleep-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByTestId(`log-item-${log.id}`)).toBeTruthy();
    }
}

async function callsHandleDeleteLog(isGuest: boolean) {
    render(<SleepLogsView/>);
    await screen.findByTestId("sleep-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        await pressButton(log.id, "delete");
        expect((handleDeleteLog as jest.Mock).mock.lastCall[0]).toBe("sleep_logs");
        expect((handleDeleteLog as jest.Mock).mock.lastCall[1]).toBe(log.id);
        expect(!!(handleDeleteLog as jest.Mock).mock.lastCall[2]).toBe(isGuest);
    }

    expect(handleDeleteLog).toHaveBeenCalledTimes(TEST_LOGS.length);  // once for each log
}

async function catchUpdateError(mockFailingEdit: () => void) {
    render(<SleepLogsView/>);
    await screen.findByTestId("sleep-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingEdit();

        // open edit log pop-up
        await pressButton(log.id, "edit");

        // submit edit
        const submitCallback = (EditLogPopup as jest.Mock).mock.lastCall[0].handleSubmit;
        await act(async () => submitCallback());

        // Alert.alert called by sleep-logs.tsx -> handleSaveEdit()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Failed to update log");
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function updateRemoteLogs(dataMock: jest.Mock, dataArgI: number, idMock: jest.Mock, idArgI: number) {
    render(<SleepLogsView/>);
    await screen.findByTestId("sleep-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        const editedStartTime = new Date((new Date(log.start_time)).getTime() - 61*1000);
        const editedEndTime = new Date((new Date(log.end_time)).getTime() - 61*1000);
        const editedDuration = `edited duration ${log.id}`;
        const editedNote = `edited note ${log.id}`;

        // clear .mock.calls array each loop
        idMock.mockClear();
        dataMock.mockClear();

        // open edit log pop-up
        await pressButton(log.id, "edit");

        // retrieve setLog callback from <EditingLogPopup/>
        const setLog = (EditLogPopup as jest.Mock).mock.lastCall[0].setLog;

        // clear set new field values from <EditLogPopup/>
        await act(async () =>
            setLog((prev: object) => ({
                ...prev,
                start_time: editedStartTime,
                end_time: editedEndTime,
                duration: editedDuration,
                note: editedNote,
            }))
        );

        // submit edit
        const submitCallback = (EditLogPopup as jest.Mock).mock.lastCall[0].handleSubmit;
        await act(async () => submitCallback());

        // Ensure mock was called with correct (updated) values
        expect(dataMock.mock.calls[0][dataArgI])
            .toEqual({  // loose comparison for objects
                start_time: editedStartTime.toISOString(),
                end_time: editedEndTime.toISOString(),
                duration: editedDuration,
                note: await encryptData(editedNote),
            });
        // Ensure mock was called with correct id
        expect(idMock.mock.calls[0][idArgI]).toBe(log.id);
    }
}

async function updateDisplayedLogs() {
    const log = TEST_LOGS[0];  // use any log

    const editedLog = {
        id: "test log id 1",
        start_time: new Date(NOW - 4*24*60*60*1000 - 4*60*1000),
        end_time: new Date(NOW - 4*24*60*60*1000 - 3*60*1000),
        duration: "edited duration",
        note: "edited note",
    };
    const updatedLogs = [editedLog].concat(  // join new edited log
        TEST_LOGS.filter((item) => item !== log)  // and remove previous log
    );

    render(<SleepLogsView/>);
    await screen.findByTestId("sleep-logs");  // wait for log list to render

    // open edit log pop-up
    await pressButton(log.id, "edit");

    // library/log-functions.ts -> fetchLogs() should be mocked to return:
    // { success: /* truthy value */, data: /* updated logs */ }
    // This should not cause any errors
    (fetchLogs as jest.Mock).mockImplementationOnce(
        async () => ({ success: true, data: updatedLogs })
    );

    // clear the calls of <LogItem/> to track which items are re-rendered from this point onwards
    (LogItem as jest.Mock).mockClear();

    // submit edit
    const submitCallback = (EditLogPopup as jest.Mock).mock.lastCall[0].handleSubmit;
    await act(async () => submitCallback());

    await act(async () => {
        const logItems = (LogItem as jest.Mock).mock.calls;
        const logItemProps = logItems.find(call => call[0].id === log.id)[0];
        const displayValues = logItemProps.logData.map((item: any) => item.value);
        // ensure new values were passed...
        expect(displayValues.includes(format(editedLog.start_time, "MMM dd, yyyy"))).toBeTruthy();
        expect(displayValues.includes(format(editedLog.start_time, "h:mm a"))).toBeTruthy();
        expect(displayValues.includes(format(editedLog.end_time, "h:mm a"))).toBeTruthy();
        expect(displayValues.includes(editedLog.duration)).toBeTruthy();
        expect(displayValues.includes(editedLog.note)).toBeTruthy();
        // ...and that the previous values are not
        expect(displayValues.includes(format(log.start_time, "MMM dd, yyyy"))).toBeFalsy();
        expect(displayValues.includes(format(log.start_time, "h:mm a"))).toBeFalsy();
        expect(displayValues.includes(format(log.end_time, "h:mm a"))).toBeFalsy();
        expect(displayValues.includes(log.duration)).toBeFalsy();
        expect(displayValues.includes(log.note)).toBeFalsy();
    });
}
