import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import RootIndex from "@/app/index";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
    router: {
        push: jest.fn(),
    },
}));

jest.mock("@/library/auth-provider", () => ({
    useAuth: () => ({
        session: null,
        loading: false,
    }),
}));

jest.mock("expo-crypto", () => ({}));

describe("Login screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (router.push as jest.Mock).mockClear();
    });

    test("Renders app logo", () => {
      render(<RootIndex/>);

      expect(screen.getByTestId("simple-baby-logo")).toBeTruthy();
    });

    test("Renders login buttons", () => {
        render(<RootIndex/>);

        expect(screen.getByTestId("sign-in-button")).toBeTruthy();
        expect(screen.getByTestId("sign-up-button")).toBeTruthy();
        expect(screen.getByTestId("guest-button")).toBeTruthy();
    });

    test("Redirects to sign in screen", async () => {
        render(<RootIndex/>);

        await userEvent.press(screen.getByTestId("sign-in-button"));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(auth)/signin");
    });

    test("Redirects to sign up screen", async () => {
        render(<RootIndex/>);

        await userEvent.press(screen.getByTestId("sign-up-button"));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(auth)/signup");
    });

    test("Redirects to guest screen", async () => {
        render(<RootIndex/>);

        await userEvent.press(screen.getByTestId("guest-button"));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(auth)/guest");
    });
});
