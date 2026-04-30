import { fetchLogsForDay } from "@/library/calendar";
import supabase from "@/library/supabase-client";


jest.mock("@/library/crypto", () => ({
    safeDecrypt: jest.fn(async (string) => string ? `Decrypted: ${string}` : ""),
}));


jest.mock("@/library/supabase-client", () => ({ from: jest.fn() }));

const filterBuilder = jest.fn();  // this should roughly match the PostgrestFilterBuilder type
const supabaseFilter = jest.fn();  // this is a helper function to change the behavior of filterBuilder
filterBuilder.mockImplementation((args, ...prevArgs) => {
    // genericMethod() represents any chainedfunction, eg filterBuilder().select()
    const genericMethod = (...newArgs: any[]) => filterBuilder(newArgs, args, ...prevArgs);
    return {
        select: genericMethod,
        eq: genericMethod,
        gte: genericMethod,
        lt: genericMethod,
        error: undefined,  // default to no error
        data: [],  // default data returned
        ...(supabaseFilter([args, ...prevArgs]) || {}),  // apply any changes specified by supabaseFilter()
    };
});
(supabase.from as jest.Mock).mockImplementation((table: string) => filterBuilder([table], []));


describe("fetchLogsForDay()", () => {

    test("Throws on Supabase error", async () => {
        const tables = [
            "diaper_logs",
            "feeding_logs",
            "health_logs",
            "milestone_logs",
            "nursing_logs",
            "sleep_logs",
        ];

        for (const table of tables.slice(0,1)) {
            const testError = `test error ${table}`;
            supabaseFilter.mockImplementation(args => {
                // return error when call matches: supabase.from(table).select().eq().gte().lt(),
                if (args.length === 6 && args[4][0] === table) {
                    return { error: testError, success: false };
                }
            });

            expect(async () => await fetchLogsForDay("", new Date())).rejects.toMatch(testError);
        }
    });
});
