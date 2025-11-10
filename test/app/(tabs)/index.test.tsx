import { render, screen } from "@testing-library/react-native";
import MainTab from "@/app/(tabs)";

jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock("@/library/auth-provider", () => ({
    useAuth: () => ({
        session: {
            user: {
                user_metadata: {
                    activeChild: false
                }
            }
        }
    }),
}));

jest.mock("@/library/supabase-client", () => ({
    supabase: {
        auth: {
        getUser: async () => ({ }),
        updateUser: async () => null
        },
        from: () => () => () => () => null
    }
}));

jest.mock("expo-blur", () => ({
    BlurView: () => <></>
}));


describe("Tracker screen", () => {
    test("Loads tracker option buttons", () => {
        render(<MainTab/>);

        expect(screen.getByTestId("sleep-button")).toBeTruthy();
        expect(screen.getByTestId("nursing-button")).toBeTruthy();
        expect(screen.getByTestId("milestone-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-button")).toBeTruthy();
        expect(screen.getByTestId("health-button")).toBeTruthy();
    });
});