import { decryptData, encryptData } from "@/library/crypto";
import { KEYS, TableName, createChild, deleteRow, enterGuestMode, exitGuestMode, getActiveChildId, insertRow, isGuestMode, listChildren, listRows, updateRow } from "@/library/local-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";


jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
    randomUUID: jest.fn(),
}));

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(),
    decryptData: jest.fn(string => `Decrypted: ${string}`),
}));

jest.mock("@/library/utils", () => ({
    formatName: jest.fn(name => name),
}));


describe("Local Store: enterGuestMode()", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (AsyncStorage.setItem as jest.Mock).mockClear();
    });

    test("Propagates setItem() error", async () => {
        const testError = new Error("Test set error");
        // AsyncStorage.setItem() should be mocked to throw an error
        (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
            async () => { throw testError; }
        );

        expect(enterGuestMode).rejects.toThrow(testError);
    });

    test("Propagates getItem() error", async () => {
        const testError = new Error("Test set error");
        // AsyncStorage.setItem() should be mocked to throw an error
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => { throw testError; }
        );

        expect(enterGuestMode).rejects.toThrow(testError);
    });

    test("Sets guest mode", async () => {
        await enterGuestMode();

        expect((AsyncStorage.setItem as jest.Mock).mock.calls[0][0]).toBe(KEYS.isGuest);
        expect((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]).toBe("1");
    });

    test("Sets new guest ID", async () => {
        const testID = "test guest ID";
        // AsyncStorage.setItem() should be mocked to return a test ID
        (Crypto.randomUUID as jest.Mock).mockImplementationOnce(
            () => testID
        );
        await enterGuestMode();

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
        expect((AsyncStorage.setItem as jest.Mock).mock.calls[1][0]).toBe(KEYS.guestId);
        expect((AsyncStorage.setItem as jest.Mock).mock.calls[1][1]).toBe(testID);
    });

    test("Keeps previous guest ID if set", async () => {
        // AsyncStorage.getItem() should be mocked to return:
        // /* truthy string */
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => "x"
        );
        await enterGuestMode();

        // set item should have only been called once, the first time being to set the guest mode indicator
        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
        expect((AsyncStorage.setItem as jest.Mock).mock.calls[0][0]).toBe(KEYS.isGuest);
    });
});


describe("Local Store: exitGuestMode()", () => {

    test("Propagates removeItem() error", async () => {
        const testError = new Error("Test set error");
        // AsyncStorage.removeItem() should be mocked to throw an error
        (AsyncStorage.removeItem as jest.Mock).mockImplementationOnce(
            async () => { throw testError; }
        );

        expect(exitGuestMode).rejects.toThrow(testError);
    });

    test("Removes guest mode indicator key", async () => {
        await enterGuestMode();

        expect((AsyncStorage.removeItem as jest.Mock).mock.calls[0][0]).toBe(KEYS.isGuest);
    });
});


describe("Local Store: isGuestMode()", () => {

    test("Propagates getItem() error", async () => {
        const testError = new Error("Test set error");
        // AsyncStorage.getItem() should be mocked to throw an error
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => { throw testError; }
        );

        expect(isGuestMode).rejects.toThrow(testError);
    });

    test("Removes guest mode indicator key", async () => {
        await enterGuestMode();

        expect((AsyncStorage.removeItem as jest.Mock).mock.calls[0][0]).toBe(KEYS.isGuest);
    });
});


describe("Local Store: listChildren()", () => {

    test("Returns empty list on getItem() error", async () => {
        // AsyncStorage.getItem() should be mocked to throw an error
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );

        expect(await listChildren()).toEqual([]);
    });

    test("Returns empty list on getItem() returning empty string", async () => {
        // AsyncStorage.getItem() should be mocked to return: ""
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => ""
        );

        expect(await listChildren()).toEqual([]);
    });

    test("Returns unencrypted child names", async () => {
        const testChildren = [
            { name: "child name 1" },
            { name: "child name 2" }
        ];
        // AsyncStorage.getItem() should be mocked to return a json string of:
        // { name: /* test string */ }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testChildren)
        );

        expect(await listChildren()).toEqual(testChildren);
    });

    test("Returns decrypted child names", async () => {
        const testChildren = [
            { name: "child name 1 U2FsdGVkX1" },
            { name: "child name 2 U2FsdGVkX1" }
        ];
        const decryptedTestChildren = await Promise.all(testChildren.map(
            async child => ({ name: await decryptData(child.name) })
        ));
        // AsyncStorage.getItem() should be mocked to return a json string of:
        // { name: /* test string that includes "U2FsdGVkX1" */ }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testChildren)
        );

        expect(await listChildren()).toEqual(decryptedTestChildren);
    });

    test("Returns non-decrypted child names on decryption error", async () => {
        const testChildren = [
            { name: "child name 1 U2FsdGVkX1" },
            { name: "child name 2 U2FsdGVkX1" }
        ];
        // AsyncStorage.getItem() should be mocked to return a json string of:
        // { name: /* test string that includes "U2FsdGVkX1" */ }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testChildren)
        );

        // library/crypto -> decryptData() should be mocked to throw an error twice
        // this should cause error handling in library/local-store.ts -> listChildren()
        (decryptData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        ).mockImplementationOnce(
            async () => { throw new Error(); }
        );

        expect(await listChildren()).toEqual(testChildren);
    });
});


describe("Local Store: createChild()", () => {

    beforeEach(() => {
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (AsyncStorage.setItem as jest.Mock).mockClear();
    });

    test("Throws error on blank name", async () => {
        expect(async () => createChild("")).rejects.toThrow();
        expect(async () => createChild("  ")).rejects.toThrow();
    });

    test("Throws error on encryptData() error", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
        // library/crypto -> encryptData() should be mocked to throw an error
        // this should cause error handling in library/local-store.ts -> createChild()
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );
        expect(async () => createChild("x")).rejects.toThrow();
    });

    test("Throws error on setItem() error", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
        // AsyncStorage.setItem() should be mocked to throw an error
        // this should cause error handling in library/local-store.ts -> createChild()
        (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );
        expect(async () => createChild("x")).rejects.toThrow();
    });

    test("Creates child with random ID", async () => {
        const testID = "test child id";
        // Crypto.randomUUID() should be mocked to return:
        // /* test string */
        (Crypto.randomUUID as jest.Mock).mockImplementationOnce(
            () => testID
        );

        await createChild("x");
        const children = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        expect(children[0].id).toBe(testID);
    });

    test("Creates child with encrypted name", async () => {
        const testName = "test child name";
        // library/crypto -> encryptData() should be mocked to return:
        // /* test string */
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => testName
        );
        
        await createChild("x");
        const children = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        expect(children[0].name).toBe(testName);
    });

    test("Creates child with correct date", async () => {
        const beforeTime = (new Date()).getTime();
        await createChild("x");
        const afterTime = (new Date()).getTime();

        const children = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        expect((new Date(children[0].created_at)).getTime()).toBeGreaterThanOrEqual(beforeTime);
        expect((new Date(children[0].created_at)).getTime()).toBeLessThanOrEqual(afterTime);
    });

    test("Sets active child ID", async () => {
        const testID = "test child id";
        // Crypto.randomUUID() should be mocked to return:
        // /* test string */
        (Crypto.randomUUID as jest.Mock).mockImplementationOnce(
            () => testID
        );
        await createChild("x");

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
        const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[1];
        expect(setItemCall[0]).toBe(KEYS.activeChildId);
        expect(setItemCall[1]).toBe(testID);
    });
});


describe("Local Store: getActiveChildId()", () => {

    test("Returns active child ID", async () => {
        const testID = "test child id";
        // AsyncStorage.getItem() should be mocked to return:
        // /* test string */
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => testID
        );
        expect(await getActiveChildId()).toBe(testID);
    });

    test("Returns empty active child ID", async () => {
        // AsyncStorage.getItem() should be mocked to return:
        // ""
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => ""
        );
        expect(await getActiveChildId()).toBe("");
    });
});


describe("Local Store: insertRow()", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (AsyncStorage.setItem as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Requests rows from correct table", async () => {
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            await insertRow(tableName, {});
            expect((AsyncStorage.getItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Catches setItem() error", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
        // AsyncStorage.setItem() should be mocked to throw an error
        // this should cause error handling in library/local-store.ts -> insertRow()
        (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );
        expect(await insertRow("diaper_logs", {})).toBe(false);
    });

    test("Assigns rows to correct table", async () => {
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            await insertRow(tableName, {});
            expect((AsyncStorage.setItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Creates log with random ID", async () => {
        const testID = "test log id";
        // Crypto.randomUUID() should be mocked to return:
        // /* test string */
        (Crypto.randomUUID as jest.Mock).mockImplementationOnce(
            () => testID
        );

        expect(await insertRow("diaper_logs", {})).toBe(true);
        const logs = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        expect(logs[0].id).toBe(testID);
    });

    test("Creates log with correct date", async () => {
        const beforeTime = (new Date()).getTime();
        expect(await insertRow("diaper_logs", {})).toBe(true);
        const afterTime = (new Date()).getTime();

        const logs = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        expect((new Date(logs[0].created_at)).getTime()).toBeGreaterThanOrEqual(beforeTime);
        expect((new Date(logs[0].created_at)).getTime()).toBeLessThanOrEqual(afterTime);
    });

    test("Creates log with given values", async () => {
        const testLog = {
            testKey1: "test value 1",
            testKey2: "test value 2",
            testKey3: "test value 3",
        };
        
        expect(await insertRow("diaper_logs", testLog)).toBe(true);
        const logs = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        for (const [key, value] of Object.entries(testLog)) {
            expect(logs[0][key]).toBe(value);
        }
    });
});


describe("Local Store: listRows()", () => {

    test("Requests rows from correct table", async () => {
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            await listRows(tableName);
            expect((AsyncStorage.getItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Returns rows", async () => {
        const testLogs = [
            { testKey1: "test value 1" },
            { testKey2: "test value 2" },
            { testKey3: "test value 3" },
        ];
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // Object[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testLogs)
        );
        expect(await listRows("diaper_logs")).toEqual(testLogs);
    });

    test("Returns no rows", async () => {
        // AsyncStorage.getItem() should be mocked to return ""
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => ""
        );
        expect(await listRows("diaper_logs")).toEqual([]);
    });
});


describe("Local Store: updateRow()", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (AsyncStorage.setItem as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Requests rows from correct table", async () => {
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            await updateRow(tableName, "", {});
            expect((AsyncStorage.getItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Catches invalid id", async () => {
        const testLogs = [
            { id: "test id 1" },
            { id: "test id 2" },
            { id: "test id 3" },
        ];
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // { id: /* string */ }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testLogs)
        );
        expect(await updateRow("diaper_logs", "invalid id", {})).toBe(false);
    });

    test("Catches setItem() error", async () => {
        const testID = "test ID";
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // [{ id: /* test string */ }]
        // this will allow updateRow() to successfully find a log matching the provided id
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify([{ id: testID }])
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
        // AsyncStorage.setItem() should be mocked to throw an error
        // this should cause error handling in library/local-store.ts -> updateRow()
        (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );
        expect(await updateRow("diaper_logs", testID, {})).toBe(false);
    });

    test("Assigns rows to correct table2", async () => {
        const testID = "test ID";
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            // AsyncStorage.getItem() should be mocked to return a JSON string of:
            // [{ id: /* test string */ }]
            // this will allow updateRow() to successfully find a log matching the provided id
            (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
                async () => JSON.stringify([{ id: testID }])
            );
            await updateRow(tableName, testID, {});
            expect((AsyncStorage.setItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Successfully updates log", async () => {
        const testLogs = [
            { id: "test id 1", testKey0: "retained value", testKey1: "value to be overwritten" },
            { id: "test id 2" },
            { id: "test id 3" },
        ];
        const testLogPatch = {
            testKey1: "test value 1",
            testKey2: "test value 2",
            testKey3: "test value 3",
        };
        const testLogIndex = 0;
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // { id: /* string */ ... }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testLogs)
        );

        // update a row with test patch
        expect(await updateRow("diaper_logs", testLogs[testLogIndex].id, testLogPatch)).toBe(true);
        const logs = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        const updatedLog = logs.find((log: any) => log.id === testLogs[testLogIndex].id);
        // ensure each item in the patch was saved
        for (const [key, value] of Object.entries(testLogPatch)) {
            expect(updatedLog[key]).toBe(value);
        }
        // ensure items in the original log but not in the patch are kept
        for (const [key, value] of Object.entries(testLogs[testLogIndex])) {
            if (!Object.keys(testLogPatch).includes(key)) {  // for keys not in the patch
                expect(updatedLog[key]).toBe(value);
            }
        }
    });
});


describe("Local Store: deleteRow()", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (AsyncStorage.setItem as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Requests rows from correct table", async () => {
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            await deleteRow(tableName, "");
            expect((AsyncStorage.getItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Catches invalid id", async () => {
        const testLogs = [
            { id: "test id 1" },
            { id: "test id 2" },
            { id: "test id 3" },
        ];
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // { id: /* string */ }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testLogs)
        );
        expect(await deleteRow("diaper_logs", "invalid id")).toBe(false);
    });

    test("Catches setItem() error", async () => {
        const testID = "test ID";
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // [{ id: /* test string */ }]
        // this will allow updateRow() to successfully find a log matching the provided id
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify([{ id: testID }])
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
        // AsyncStorage.setItem() should be mocked to throw an error
        // this should cause error handling in library/local-store.ts -> updateRow()
        (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );
        expect(await deleteRow("diaper_logs", testID)).toBe(false);
    });

    test("Assigns rows to correct table", async () => {
        const testID = "test ID";
        const testTables = [
            "feeding_logs",
            "nursing_logs",
            "milestone_logs",
            "diaper_logs",
            "health_logs",
            "sleep_logs",
        ] as TableName[];
        for (const tableName of testTables) {
            // AsyncStorage.getItem() should be mocked to return a JSON string of:
            // [{ id: /* test string */ }]
            // this will allow updateRow() to successfully find a log matching the provided id
            (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
                async () => JSON.stringify([{ id: testID }])
            );
            await deleteRow(tableName, testID);
            expect((AsyncStorage.setItem as jest.Mock).mock.lastCall[0]).toBe(KEYS.table(tableName));
        }
    });

    test("Successfully deletes log", async () => {
        const testLogs = [
            { id: "test id 1" },
            { id: "test id 2" },
            { id: "test id 3" },
        ];
        const testLogIndex = 0;
        // AsyncStorage.getItem() should be mocked to return a JSON string of:
        // { id: /* string */ ... }[]
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
            async () => JSON.stringify(testLogs)
        );

        // update a row with test patch
        expect(await deleteRow("diaper_logs", testLogs[testLogIndex].id)).toBe(true);
        const logs: typeof testLogs = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
        // ensure deleted log is no longer present
        expect(logs.find(log => log.id === testLogs[testLogIndex].id)).toBe(undefined);
        // ensure other logs are kept
        for (const keptLog of testLogs) {
            if (keptLog !== testLogs[testLogIndex]) {  // for logs not selected for deletion
                expect(logs.find(log => log.id === keptLog.id)).toBeTruthy();
            }
        }
    });
});
