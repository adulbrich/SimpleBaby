import NoteEntry from "@/components/note-entry";
import { render, screen, userEvent } from "@testing-library/react-native";
import stringLib from "@/assets/stringLibrary.json";



describe("Component <NoteEntry/>", () => {

    test("Renders labels", () => {
        const testPlaceholder = "test placeholder";
        render(<NoteEntry
            note=""
            placeholder={testPlaceholder}
            setNote={() => null}
        />);

        expect(screen.getByText(stringLib.uiLabels.noteLabel)).toBeTruthy();
        expect(screen.getByPlaceholderText(testPlaceholder)).toBeTruthy();
    });

    test("Renders note", () => {
        const testNote = "test note";
        render(<NoteEntry
            note={testNote}
            setNote={() => null}
        />);

        expect(screen.getByDisplayValue(testNote)).toBeTruthy();
    });

    test("Updates note", async () => {
        const testNote = "test note";
        const setNote = jest.fn();
        const { rerender } = render(<NoteEntry
            note=""
            setNote={setNote}
        />);

        // update the note prop when setNote called
        setNote.mockImplementation(newNote => rerender(
            <NoteEntry
                note={newNote}
                setNote={setNote}
            />
        ));

        await userEvent.type(
            screen.getByTestId("text-entry"),
            testNote
        );

        expect(setNote.mock.lastCall[0]).toBe(testNote);
    });

    test("Sets focus state", async () => {
        const setIsTyping = jest.fn();
        render(<NoteEntry
            note=""
            setNote={() => null}
            setIsTyping={setIsTyping}
        />);

        await userEvent.type(
            screen.getByTestId("text-entry"),
            "x"
        );

        expect(setIsTyping.mock.calls.find(call => call[0])).toBeTruthy();  // contains at least one call with true
        expect(setIsTyping.mock.lastCall[0]).toBe(false);  // most recent call is false
    });
});
