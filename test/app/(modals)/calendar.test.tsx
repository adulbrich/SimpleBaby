import { act, render, screen } from "@testing-library/react-native";
import CalendarModal from "@/app/(modals)/calendar";
import { useAuth } from "@/library/auth-provider";
import stringLib from "@/assets/stringLibrary.json";
import { format } from "date-fns";
import { Calendar } from "react-native-calendars";
import { fetchDaysWithLogsForMonth, fetchLogsForDay } from "@/library/calendar";
import { getActiveChildData } from "@/library/remote-store";


const testIDs = stringLib.testIDs.calendar;


jest.mock("@/library/auth-provider", () => ({
    useAuth: jest.fn(() => ({
        isGuest: false,
    })),
}));

jest.mock("react-native-calendars", () => {
    const View = jest.requireActual("react-native").View;
    const CalendarMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return { Calendar: CalendarMock };
});

jest.mock("@/library/remote-store", () => ({
    getActiveChildData: jest.fn(async () => ({ success: true, childId: true })),
}));

jest.mock("@/library/utils", () => ({
    toYMD: jest.fn(),
}));

jest.mock("@/library/calendar", () => ({
    fetchLogsForDay: jest.fn(async () => []),
    fetchDaysWithLogsForMonth: jest.fn(async () => new Set()),
    CalendarLog: jest.fn(),
}));


function manualPromise(): {
    promise: Promise<unknown>, resolve: (value?: any) => void
} {
    let resolvePromise: (value: any) => void = () => undefined;
    const promise = new Promise((resolve) => {
        resolvePromise = (value: any = undefined) => resolve(value);
    });
    return { promise, resolve: resolvePromise };
}


describe("Calendar screen", () => {

    test("Renders no logs indicator", async () => {
        render(<CalendarModal/>);

        await screen.findByTestId(testIDs.noLogs);
    });

    test("Renders calendar and label", async () => {
        render(<CalendarModal/>);

        await screen.findByTestId(testIDs.noLogs);

        expect(screen.getByTestId(testIDs.calendar)).toBeTruthy();
        expect(screen.getByTestId(testIDs.dateLabel)).toBeTruthy();
    });

    test("Changes date", async () => {
        const testDate = "2000-01-01";
        const testDateString = format(new Date(`${testDate}T00:00:00`), "MMMM d, yyyy");

        render(<CalendarModal/>);
        await screen.findByTestId(testIDs.noLogs);

        expect(screen.getByText(format(new Date(), "MMMM d, yyyy"))).toBeTruthy();
        expect(() => screen.getByText(testDateString)).toThrow();

        const calendarProps = (Calendar as unknown as jest.Mock).mock.lastCall[0];

        await act(async () => calendarProps.onDayPress({ dateString: testDate }));

        expect(() => screen.getByText(format(new Date(), "MMMM d, yyyy"))).toThrow();
        expect(screen.getByText(testDateString)).toBeTruthy();
    });

    test("Marks dates with logs", async () => {
        const testDates = new Set([
            "2000-01-01",
            "2000-01-02",
            "2000-01-03",
            "2000-01-12",
            "2000-01-26",
        ]);
        // library/calendar.ts -> fetchDaysWithLogsForMonth() should be mocked to return:
        // Set("YYYY-MM-dd"[])
        (fetchDaysWithLogsForMonth as jest.Mock).mockImplementationOnce(
            () => testDates
        );

        render(<CalendarModal/>);
        await screen.findByTestId(testIDs.noLogs);

        const calendarProps = (Calendar as unknown as jest.Mock).mock.lastCall[0];

        for (const date in Object.keys(calendarProps.markedDates)) {
            if (calendarProps.markedDates[date]?.marked) {
                expect(testDates.has(date)).toBeTruthy();
                testDates.delete(date);
            }
        }
    });

    test("Displays logs", async () => {
        const testLogs = [{
            type: "test type 1",
            id: "test log id 1",
            at: "2000-01-01T01:23",
            title: "test title 1",
            details: "test details 1",
        }, {
            type: "test type 2",
            id: "test log id 2",
            at: "2000-01-01T02:34",
            title: "test title 2",
        }];
        // library/calendar.ts -> fetchLogsForDay() should be mocked to return:
        // Set("YYYY-MM-dd"[])
        (fetchLogsForDay as jest.Mock).mockImplementationOnce(
            () => testLogs
        );

        render(<CalendarModal/>);
        await screen.findByTestId(testIDs.logList);

        for (const log of testLogs) {
            expect(screen.getByText(format(new Date(log.at), "h:mm a"))).toBeTruthy();
            expect(screen.getByText(log.title)).toBeTruthy();
            if (log.details) expect(screen.getByText(log.details)).toBeTruthy();
        }
    });

    test("Catches getActiveChildData error", async () => {
        const testError = "test error getActiveChildData";
        // library/remote-store.ts -> getActiveChildData() should be mocked to throw an error
        // this should cause error handling in app/(modals)/calendar.tsx -> loadDay()
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<CalendarModal/>);
        await screen.findByTestId(testIDs.logsError);

        expect(screen.getByText(testError)).toBeTruthy();
    });

    test("Catches fetchLogsForDay error", async () => {
        const testError = "test error fetchLogsForDay";
        // library/calendar.ts -> fetchLogsForDay() should be mocked to throw an error
        // this should cause error handling in app/(modals)/calendar.tsx -> loadDay()
        (fetchLogsForDay as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<CalendarModal/>);
        await screen.findByTestId(testIDs.logsError);

        expect(screen.getByText(testError)).toBeTruthy();
    });

    test("Displays loading indicator", async () => {
        const { promise: waitForLogs, resolve: resolveLogs } = manualPromise();
        // library/calendar.ts -> fetchLogsForDay() should be mocked to return:
        // a Promise that can be manually resolved to:
        // []
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => waitForLogs
        );

        render(<CalendarModal/>);
        expect(await screen.findByTestId(testIDs.loading)).toBeTruthy();

        await act(async () => resolveLogs([]));
        expect(() => screen.getByTestId(testIDs.loading)).toThrow();
    });
});


describe("Calendar screen (guest mode)", () => {

    test("Renders guest mode indicator", () => {
        // library/auth-provider.ts -> useAuth() should be mocked to return:
        // { isGuest: /* truthy value */ }
        (useAuth as jest.Mock).mockImplementation(
            () => ({ isGuest: true })
        );

        render(<CalendarModal/>);

        expect(screen.getByTestId(testIDs.guestMode)).toBeTruthy();
    });
});
