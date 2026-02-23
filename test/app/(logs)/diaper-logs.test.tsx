import DiaperLogsView from "@/app/(logs)/diaper-logs";
import { render, screen, userEvent, act, waitFor } from "@testing-library/react-native";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData } from "@/library/crypto";
import { format } from 'date-fns';


jest.mock("@/library/supabase-client", () => {
    const order = jest.fn();
    return ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: order,
                }),
            }),
        }),
    });
});

jest.mock("@/library/crypto", () => ({
    //encryptData: jest.fn(async (string) => `Encrypted: ${string}`),
    decryptData: jest.fn(async (string) => `Decrypted: ${string}`),
}));

jest.mock("@/library/utils", () => ({
    getActiveChildId: jest.fn(async () => ({ success: true, childId: true })),
}));


const TEST_LOGS = [{
    id: "test log id",
    child_id: "test child id",
    consistency: "test consistency U2FsdGVkX1",
    amount: "test amount U2FsdGVkX1",
    logged_at: (new Date()).toISOString(),
    note: "test note U2FsdGVkX1",
}];

// set default mock
(supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
    async () => ({ data: TEST_LOGS })
);


describe("Diaper logs screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Renders loading error", async () => {
        const testErrorMessage = "testErrorGetID";
    
        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/diaper-logs.tsx -> fetchDiaperLogs()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
        
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<DiaperLogsView/>);

        expect(await screen.findByTestId("diaper-logs-loading-error")).toBeTruthy();  // wait for loading to finish
        expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
    });

    test("Renders no logs", async () => {
        // supabase.from().select().eq().order() should be mocked to return:
        // { data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({})
        );

        render(<DiaperLogsView/>);
        expect(await screen.findByTestId("diaper-no-logs")).toBeTruthy();
    });

    test("Renders log buttons", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        expect(screen.getByTestId("diaper-logs-edit-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-logs-delete-button")).toBeTruthy();
    });

    test("Renders log values", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        TEST_LOGS.forEach(async log => {
            expect(screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
            expect(screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.consistency), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.amount), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();
        });
    });

});
