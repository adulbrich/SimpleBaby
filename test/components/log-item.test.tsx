import { render, screen } from "@testing-library/react-native";
import LogItem, { logRenderData } from "@/components/log-item";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.logItem;


const testLog = [
    { type: "title", value: "test title" },
    { type: "text", value: "test text" },
    { type: "item", label: "test item label", value: "test item value" },
    { type: "note", value: "test note" },
    { type: "image", uri: "test uri" },
] as logRenderData[];


describe("Log item", () => {

    test("Displays buttons", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={[]}
        />);

        expect(screen.getByTestId(testIDs.editButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.deleteButton)).toBeTruthy();
    });

    test("Displays title", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={testLog}
        />);

        for (const logField of testLog) {
            if (logField && logField.type === "title") {
                expect(screen.getByText(logField.value)).toBeTruthy();
            }
        }
    });

    test("Displays text", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={testLog}
        />);

        for (const logField of testLog) {
            if (logField && logField.type === "text") {
                expect(screen.getByText(logField.value)).toBeTruthy();
            }
        }
    });

    test("Displays item pair", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={testLog}
        />);

        for (const logField of testLog) {
            if (logField && logField.type === "item") {
                expect(screen.getByText(`${logField.label}: ${logField.value}`)).toBeTruthy();
            }
        }
    });

    test("Displays note", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={testLog}
        />);

        for (const logField of testLog) {
            if (logField && logField.type === "note" && logField.value) {
                expect(screen.getByText(`📝 ${logField.value}`)).toBeTruthy();
            }
        }
    });

    test("Displays image", async () => {
        render(<LogItem
            onEdit={() => undefined}
            onDelete={() => undefined}
            logData={testLog}
        />);

        // get all displayed <Image/> elements
        const images = screen.getAllByTestId(testIDs.image);

        for (const logField of testLog) {
            if (logField && logField.type === "image" && logField.uri) {
                // one <Image/> should have a matching URI
                expect(images.find((call: any) =>
                    call._fiber.memoizedProps.source.uri === logField.uri
                ) !== undefined).toBeTruthy();
            }
        }
    });
});
