import Button from "@/components/button";
import { render, screen, userEvent } from "@testing-library/react-native";


describe("Button component", () => {

    test("Renders button text", () => {
        const testLabel = "test label";
        render(<Button text={testLabel} action={() => {}} testID="button"/>);

        expect(screen.getByText(testLabel)).toBeTruthy();
    });

    test("Calls callback on press", async () => {
        const callback = jest.fn();
        render(<Button text={""} action={callback} testID="test-button"/>);

        await userEvent.press(screen.getByTestId("test-button"));

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
