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
        render(<NursingStopwatch leftTime={0} rightTime={0}/>);

        expect(screen.getByTestId("nursing-stopwatch-left")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-right")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-reset")).toBeTruthy();
    });

    test("Renders provided times", async () => {
        const testTimesInitial = { left: 45296, right: 156741 };  // 12:34:56 and 43:32:21
        const testTimesUpdated = { left: 109210, right: 37230 };  // 30:20:10 and 30:20:10
        const { rerender } = render(<NursingStopwatch
            leftTime={testTimesInitial.left}
            rightTime={testTimesInitial.right}
        />);

        // ensure hours, minutes, and seconds are displayed on screen for left
        expect(screen.getByText((testTimesInitial.left % 60).toString())).toBeTruthy();  // seconds
        expect(screen.getByText(Math.floor(testTimesInitial.left / 60 % 60).toString())).toBeTruthy();  // minutes
        expect(screen.getByText(Math.floor(testTimesInitial.left / 3600).toString())).toBeTruthy();  // hours
        // and for the right side
        await userEvent.press(
            screen.getByTestId("nursing-stopwatch-right")
        );
        expect(screen.getByText((testTimesInitial.right % 60).toString())).toBeTruthy();  // seconds
        expect(screen.getByText(Math.floor(testTimesInitial.right / 60 % 60).toString())).toBeTruthy();  // minutes
        expect(screen.getByText(Math.floor(testTimesInitial.right / 3600).toString())).toBeTruthy();  // hours

        // rerender with new values
        rerender(<NursingStopwatch
            leftTime={testTimesUpdated.left}
            rightTime={testTimesUpdated.right}
        />);

        // ensure hours, minutes, and seconds are displayed on screen for right
        expect(screen.getByText((testTimesUpdated.right % 60).toString())).toBeTruthy();  // seconds
        expect(screen.getByText(Math.floor(testTimesUpdated.right / 60 % 60).toString())).toBeTruthy();  // minutes
        expect(screen.getByText(Math.floor(testTimesUpdated.right / 3600).toString())).toBeTruthy();  // hours
        // and for the left side
        await userEvent.press(
            screen.getByTestId("nursing-stopwatch-left")
        );
        expect(screen.getByText((testTimesUpdated.left % 60).toString())).toBeTruthy();  // seconds
        expect(screen.getByText(Math.floor(testTimesUpdated.left / 60 % 60).toString())).toBeTruthy();  // minutes
        expect(screen.getByText(Math.floor(testTimesUpdated.left / 3600).toString())).toBeTruthy();  // hours
    });

    test("Switches stopwatch buttons", async () => {
        render(<NursingStopwatch leftTime={0} rightTime={0}/>);

        expect(screen.getByTestId("nursing-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-reset")).toBeTruthy();

        // start timer
        await userEvent.press(
            screen.getByTestId("nursing-stopwatch-start")
        );

        // stop button should now be shown, and reset button still present
        expect(screen.getByTestId("nursing-stopwatch-stop")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-reset")).toBeTruthy();

        // stop timer
        await userEvent.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // start button should be shown again, and reset button still present
        expect(screen.getByTestId("nursing-stopwatch-start")).toBeTruthy();
        expect(screen.getByTestId("nursing-stopwatch-reset")).toBeTruthy();
    });

    test("Updates time while started (left)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const leftTimeCallback = jest.fn();
        render(<NursingStopwatch leftTime={0} rightTime={0} onTimeUpdateLeft={leftTimeCallback}/>);

        // select left
        await user.press(
            screen.getByTestId("nursing-stopwatch-left")
        );

        // start timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );

        // wait for two one-second loops, ensure callback increments time
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback.mock.calls[0][0](0)).toBe(1);
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback.mock.calls[0][0](1)).toBe(2);
        expect(leftTimeCallback).toHaveBeenCalledTimes(2);

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(leftTimeCallback).toHaveBeenCalledTimes(2);
    });

    test("Updates time while started (right)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const rightTimeCallback = jest.fn();
        render(<NursingStopwatch leftTime={0} rightTime={0} onTimeUpdateRight={rightTimeCallback}/>);

        // select right
        await user.press(
            screen.getByTestId("nursing-stopwatch-right")
        );

        // start timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-start")
        );

        // wait for two one-second loops, ensure callback increments time
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback.mock.calls[0][0](0)).toBe(1);
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback.mock.calls[0][0](1)).toBe(2);
        expect(rightTimeCallback).toHaveBeenCalledTimes(2);

        // stop timer
        await user.press(
            screen.getByTestId("nursing-stopwatch-stop")
        );

        // ensure time has not been updated since
        await act(async () => jest.runOnlyPendingTimers());
        expect(rightTimeCallback).toHaveBeenCalledTimes(2);
    });

    test("Resets timer (left)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const leftTimeCallback = jest.fn();
        render(<NursingStopwatch leftTime={0} rightTime={0} onTimeUpdateLeft={leftTimeCallback}/>);

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
        expect(leftTimeCallback.mock.lastCall[0] === 0).toBeFalsy();

        // press the reset button
        await user.press(
            screen.getByTestId("nursing-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(leftTimeCallback).toHaveBeenLastCalledWith(0);
    });

    test("Resets timer (right)", async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});  // to sync userEvents with jest fake timers

        const rightTimeCallback = jest.fn();
        render(<NursingStopwatch leftTime={0} rightTime={0} onTimeUpdateRight={rightTimeCallback}/>);

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
        expect(rightTimeCallback.mock.lastCall[0] === 0).toBeFalsy();

        // press the reset button
        await user.press(
            screen.getByTestId("nursing-stopwatch-reset")
        );

        // ensure time has been changed to zero
        expect(rightTimeCallback).toHaveBeenLastCalledWith(0);
    });
});
