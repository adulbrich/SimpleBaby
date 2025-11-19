import { render, screen, userEvent } from "@testing-library/react-native";
import Feeding from "@/app/(trackers)/feeding";


jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock("@/library/supabase-client", () => ({
    from: () => null
}));

jest.mock("@/library/crypto", () =>({
    encryptData: async () => ""
}));


describe("Track sleep screen", () => {

    test("Renders sleep tracking inputs", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-data-entry")).toBeTruthy();
        expect(screen.getByTestId("feeding-note")).toBeTruthy();
    });
    
    test("Renders form control buttons", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-reset-form-button")).toBeTruthy();
    });

});
