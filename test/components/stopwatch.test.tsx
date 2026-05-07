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
        render(<Stopwatch time={0} onTimeUpdate={undefined}/>);

        expect(screen.getByTestId("sleep-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-reset")).toBeTruthy();
    });

    test("Switches stopwatch buttons", async () => {
        render(<Stopwatch time={0} onTimeUpdate={undefined}/>);

        expect(screen.getByTestId("sleep-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-reset")).toBeTruthy();

        // start timer
        await userEvent.press(
            screen.getByTestId("sleep-stopwatch-start")
        );

        // stop button should now be shown, and reset button still present
        expect(screen.getByTestId("sleep-stopwatch-stop")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-reset")).toBeTruthy();

        // stop timer
        await userEvent.press(
            screen.getByTestId("sleep-stopwatch-stop")
        );

        // start button should be shown again, and reset button still present
        expect(screen.getByTestId("sleep-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("sleep-stopwatch-reset")).toBeTruthy();
    });

    test("Updates time while started", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const setTimeCallback = jest.fn();
        render(<Stopwatch time={0} onTimeUpdate={setTimeCallback}/>);

        // start timer
        await user.press(
            screen.getByTestId("sleep-stopwatch-start")
        );

        // wait for two one-second loops, ensure callback increments time
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback.mock.calls[0][0](0)).toBe(1);
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback.mock.calls[0][0](1)).toBe(2);
        expect(setTimeCallback).toHaveBeenCalledTimes(2);

        // stop timer
        await user.press(
            screen.getByTestId("sleep-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(setTimeCallback).toHaveBeenCalledTimes(2);
    });

    test("Resets timer", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const setTimeCallback = jest.fn();
        render(<Stopwatch time={1} onTimeUpdate={setTimeCallback}/>);

        // press the reset button
        await user.press(
            screen.getByTestId("sleep-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(setTimeCallback).toHaveBeenLastCalledWith(0);
    });
});
