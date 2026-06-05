import { render, screen } from "@testing-library/react-native";
import Tab from "@/app/(tabs)/logs";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.logs;


jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));


describe("Logs screen", () => {
    test("Loads logs option buttons", () => {
        render(<Tab/>);

        expect(screen.getByTestId(testIDs.sleepButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.nursingButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.milestoneButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.feedingButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.diaperButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.healthButton)).toBeTruthy();
    });
});
