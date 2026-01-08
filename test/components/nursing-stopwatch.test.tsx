import NursingStopwatch from "@/components/nursing-stopwatch";
import { render, screen, userEvent, act } from "@testing-library/react-native";


describe("Nursing component <NursingStopwatch/>", () => {

    beforeEach(() => {
        // mock timers inside tests
        jest.useFakeTimers({advanceTimers: true});  // advanceTimers: to sync userEvents with jest fake timers
    });
    
    afterEach(() => {
        // reset timers for test clean-up
        jest.useRealTimers();
    });

    test("Renders stopwatch buttons", () => {
        render(<NursingStopwatch onTimeUpdateLeft={undefined} onTimeUpdateRight={undefined}/>);

        expect(screen.getByTestId("nursing-stopwatch-left")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-right")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-stop")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-reset")).toBeTruthy();
    });

    test("Updates time while started (left)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const leftTimeCallback = jest.fn();
        render(<NursingStopwatch onTimeUpdateLeft={leftTimeCallback} onTimeUpdateRight={undefined}/>);
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:00");  // the callback should immediately be called with "00:00:00"

        // select left
        await user.press(
            screen.getByTestId("nursing-stopwatch-left")
        );

        // start timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );

        // wait for two one-second loops, ensure time is updated after each
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:01");
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(leftTimeCallback).toHaveBeenCalledTimes(3);

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(leftTimeCallback).toHaveBeenCalledTimes(3);
    });

    test("Updates time while started (right)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const rightTimeCallback = jest.fn();
        render(<NursingStopwatch onTimeUpdateLeft={undefined} onTimeUpdateRight={rightTimeCallback}/>);
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:00");  // the callback should immediately be called with "00:00:00"

        // select right
        await user.press(
            screen.getByTestId("nursing-stopwatch-right")
        );

        // start timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );

        // wait for two one-second loops, ensure time is updated after each
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:01");
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(rightTimeCallback).toHaveBeenCalledTimes(3);

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:02");
        expect(rightTimeCallback).toHaveBeenCalledTimes(3);
    });

    test("Resets timer (left)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const leftTimeCallback = jest.fn();
        render(<NursingStopwatch onTimeUpdateLeft={leftTimeCallback} onTimeUpdateRight={undefined}/>);

        // select left
        await user.press(
            screen.getByTestId("nursing-stopwatch-left")
        );

        // start timer, wait one second loop
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );
        await act(async () => jest.runOnlyPendingTimers());

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time was updated with a non-zero value
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:01");

        // press the reset button
        await user.press(
            screen.getByTestId("nursing-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(leftTimeCallback).toHaveBeenLastCalledWith("00:00:00");
    });

    test("Resets timer (right)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const rightTimeCallback = jest.fn();
        render(<NursingStopwatch onTimeUpdateLeft={undefined} onTimeUpdateRight={rightTimeCallback}/>);

        // select right
        await user.press(
            screen.getByTestId("nursing-stopwatch-right")
        );

        // start timer, wait one second loop
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );
        await act(async () => jest.runOnlyPendingTimers());

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time was updated with a non-zero value
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:01");

        // press the reset button
        await user.press(
            screen.getByTestId("nursing-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(rightTimeCallback).toHaveBeenLastCalledWith("00:00:00");
    });
});
