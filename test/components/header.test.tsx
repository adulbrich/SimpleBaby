import Header from "@/components/header";
import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";


jest.mock("expo-router", () => ({
    router: {
        push: jest.fn(),
    },
}));


describe("header component", () => {

    beforeEach(() => {
        // to clear the info stored in .mock
        (router.push as jest.Mock).mockClear();
    });

    test("Renders titles and icons", () => {
        const testTitle = "test title";
        const testLabel = "test label";
        const testIcon = "test icon";
        render(<Header title={testTitle} headerLink={{icon: testIcon, title: testLabel, link: ":"}}></Header>);

        expect(screen.getByText(testTitle)).toBeTruthy();
        expect(screen.getByText(testLabel)).toBeTruthy();
        expect(screen.getByText(testIcon)).toBeTruthy();
    });

    test("Re-routes user on press", async () => {
        const testLink = "test:link";
        render(<Header title={""} headerLink={{icon: "", title: "", link: testLink}}></Header>);

        await userEvent.press(screen.getByTestId("header-link"));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect(router.push).toHaveBeenLastCalledWith(testLink);
    });
});
