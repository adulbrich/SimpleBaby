import Stopwatch from "@/components/stopwatch";
import { render, screen, userEvent, act } from "@testing-library/react-native";


describe("Sleep component <Stopwatch/>", () => {

    beforeEach(() => {
        // mock timers inside tests
        jest.useFakeTimers({advanceTimers: true});  // advanceTimers: to sync userEvents with jest fake timers
    });
    
    afterEach(() => {
        // reset timers for test clean-up
        jest.useRealTimers();
    });

    test("Renders stopwatch buttons", () => {
        render(<Stopwatch onTimeUpdate={undefined}/>);

        expect(screen.getByTestId("sleep-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-stop")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-reset")).toBeTruthy();
    });

    test("Updates time while started", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const setTimeCallback = jest.fn();
        render(<Stopwatch onTimeUpdate={setTimeCallback}/>);
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:00");  // the callback should immediately be called with "00:00:00"

        // start timer
        await user.press(
            screen.getByTestId("sleep-stopwatch-start")
        );

        // wait for two one-second loops, ensure time is updated after each
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:01");
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(setTimeCallback).toHaveBeenCalledTimes(3);

        // stop timer
        await user.press(
            screen.getByTestId("sleep-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(setTimeCallback).toHaveBeenCalledTimes(3);
    });

    test("Resets timer", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const setTimeCallback = jest.fn();
        render(<Stopwatch onTimeUpdate={setTimeCallback}/>);

        // start timer, wait one second loop
        await user.press(
            screen.getByTestId("sleep-stopwatch-start")
        );
        await act(async () => jest.runOnlyPendingTimers());

        // stop timer
        await user.press(
            screen.getByTestId("sleep-stopwatch-stop")
        );

        // ensure time was updated with a non-zero value
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:01");

        // press the reset button
        await user.press(
            screen.getByTestId("sleep-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(setTimeCallback).toHaveBeenLastCalledWith("00:00:00");
    });
});
