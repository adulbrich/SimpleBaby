import TrackerButton from "@/components/tracker-button";
import { render, screen, userEvent } from "@testing-library/react-native";
import { useAudioPlayer } from 'expo-audio';
import { router } from "expo-router";


jest.mock("expo-router", () => ({
    router: {
        push: jest.fn(),
    },
}));

jest.mock("expo-audio", () => {
    const seekTo = jest.fn();
    const play = jest.fn();
    return {
        useAudioPlayer: jest.fn(() => ({
            seekTo: seekTo,
            play: play,
        })),
    };
});


describe("Tracker button component", () => {

    beforeEach(() => {
        // to clear the info stored in .mock
        (router.push as jest.Mock).mockClear();
        (useAudioPlayer().seekTo as jest.Mock).mockClear();
        (useAudioPlayer().play as jest.Mock).mockClear();
    });

    test("Renders button text", () => {
        const testLabel = "test label";
        const testIcon = "test icon";
        render(<TrackerButton button={{label: testLabel, icon: testIcon, link: ":"}}/>);

        expect(screen.getByText(testLabel)).toBeTruthy();
        expect(screen.getByText(testIcon)).toBeTruthy();
    });

    test("Re-routes user on press", async () => {
        const testLink = "test:link";
        render(<TrackerButton button={{label: "", icon: "", link: testLink}} testID="test-button"/>);

        await userEvent.press(screen.getByTestId("test-button"));

        expect(router.push).toHaveBeenCalledTimes(1);
    });

    test("Plays sound on press", async () => {
        render(<TrackerButton button={{label: "", icon: "", link: ":"}} testID="test-button"/>);

        await userEvent.press(screen.getByTestId("test-button"));

        expect(useAudioPlayer().play).toHaveBeenCalledTimes(1);
    });
});
