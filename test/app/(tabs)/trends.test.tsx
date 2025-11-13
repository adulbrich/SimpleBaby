import { render, screen } from "@testing-library/react-native";
import Tab from "@/app/(tabs)/trends";

jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));


describe("Trends screen", () => {
    test("Loads trends option buttons", () => {
        render(<Tab/>);

        expect(screen.getByTestId("trends-Sleep-button")).toBeTruthy();
        expect(screen.getByTestId("trends-Nursing-button")).toBeTruthy();
        expect(screen.getByTestId("trends-Milestone-button")).toBeTruthy();
        expect(screen.getByTestId("trends-Feeding-button")).toBeTruthy();
        expect(screen.getByTestId("trends-Diaper-button")).toBeTruthy();
        expect(screen.getByTestId("trends-Health-button")).toBeTruthy();
    });
});
