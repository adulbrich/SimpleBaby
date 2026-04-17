import { format } from "date-fns";


// A function to format a user inputted child name
export function formatName(text: string) {
    const trimmed = text.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}


// A function to convert a string array into a human-readable string
// eg, ["item1", "item2", "item3"] -> "item1, item2 and item3"
export function formatStringList(strings: string[]): string {
    return strings.length > 1
            ? `${strings.slice(0, -1).join(", ")} and ${strings.slice(-1)}`
            : strings[0];
}


// A function to convert a date to "yyyy-MM-dd" format
export function toYMD(d: Date) {
    return format(d, "yyyy-MM-dd");
}
