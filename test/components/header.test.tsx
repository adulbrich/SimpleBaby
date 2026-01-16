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
        render(Header(testTitle, {icon: testIcon, title: testLabel, link: ":"}, undefined));

        expect(screen.getByText(testTitle)).toBeTruthy();
        expect(screen.getByText(testLabel)).toBeTruthy();
        expect(screen.getByText(testIcon)).toBeTruthy();
    });

    test("Re-routes user on press", async () => {
        const testLink = "test:link";
        render(Header("", {icon: "", title: "", link: testLink}, undefined));

        await userEvent.press(screen.getByTestId("header-link"));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect(router.push).toHaveBeenLastCalledWith(testLink);
    });
});
