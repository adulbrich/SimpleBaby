import { render, screen, userEvent } from "@testing-library/react-native";
import SettingScreen from "@/app/(tabs)/settings";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
    router: {
        push: jest.fn(),
    },
}));

describe("Settings screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls array
        (router.push as jest.Mock).mockClear();
    });

    test("Displays buttons", () => {
        render(<SettingScreen/>);

        expect(screen.getByTestId("settings-tos-button")).toBeTruthy();
        expect(screen.getByTestId("settings-privacy-button")).toBeTruthy();
    });
    
    test("Redirects to tos", async () => {
        render(<SettingScreen/>);
              
        // press tos button
        await userEvent.press(screen.getByTestId("settings-tos-button"));
        
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(modals)/tos");
    });
    
    test("Redirects to privacy policy", async () => {
        render(<SettingScreen/>);
              
        // press tos button
        await userEvent.press(screen.getByTestId("settings-privacy-button"));
        
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(modals)/privacypolicy");
    });
});
