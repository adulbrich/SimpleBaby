import { startOfDay, addDays } from "date-fns";
import supabase from "@/library/supabase-client";
import { decryptData } from "@/library/crypto";

type CalendarLogType = "Sleep" | "Feeding" | "Diaper" | "Nursing" | "Health" | "Milestone";

async function safeDecrypt(value: string | null): Promise<string> {
    if (!value) {
        return "";
    } else if (!value.includes("U2FsdGVkX1")) {
        return value;
    }
    try {
        return await decryptData(value);
    } catch {
        return "";
    }
}

export type CalendarLog = {
    type: CalendarLogType;
    id: string;
    at: string;
    title: string;
    details?: string;
    raw: any;
};

export async function fetchLogsForDay(childId: string, date: Date): Promise<CalendarLog[]> {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const [
    sleepRes,
    feedingRes,
    diaperRes,
    nursingRes,
    healthRes,
    milestoneRes,
  ] = await Promise.all([
    supabase
      .from("sleep_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("start_time", dayStart.toISOString())
      .lt("start_time", dayEnd.toISOString()),

    supabase
      .from("feeding_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("feeding_time", dayStart.toISOString())
      .lt("feeding_time", dayEnd.toISOString()),

    supabase
      .from("diaper_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("change_time", dayStart.toISOString())
      .lt("change_time", dayEnd.toISOString()),

    supabase
      .from("nursing_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("logged_at", dayStart.toISOString())
      .lt("logged_at", dayEnd.toISOString()),

    supabase
      .from("health_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("date", dayStart.toISOString())
      .lt("date", dayEnd.toISOString()),

    supabase
      .from("milestone_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("achieved_at", dayStart.toISOString())
      .lt("achieved_at", dayEnd.toISOString()),
  ]);

  const errors = [sleepRes.error, feedingRes.error, diaperRes.error, nursingRes.error, healthRes.error, milestoneRes.error].filter(Boolean);
  if (errors.length) {
    throw errors[0];
  }

  const sleepLogs: CalendarLog[] = (sleepRes.data ?? []).map((row: any) => ({
    type: "Sleep",
    id: row.id,
    at: row.start_time,
    title: "Sleep",
    details: `Time: ${row.duration ?? "N/A"}`,
    raw: row,
  }));

  const feedingLogs: CalendarLog[] = await Promise.all((feedingRes.data ?? []).map(async (row: any) => {
    const category = await safeDecrypt(row.category);
    const item = await safeDecrypt(row.item_name);
    const amount = await safeDecrypt(row.amount);
    return {
      type: "Feeding",
      id: row.id,
      at: row.feeding_time,
      title: `Feeding • ${category}`,
      details: [item, amount].filter(Boolean).join(" • "),
      raw: row,
    };
  }));

  const diaperLogs: CalendarLog[] = await Promise.all((diaperRes.data ?? []).map(async (row: any) => {
    const consistency = await safeDecrypt(row.consistency);
    const amount = await safeDecrypt(row.amount);
    return {
      type: "Diaper",
      id: row.id,
      at: row.change_time,
      title: `Diaper • ${consistency}`,
      details: amount ? `Amount: ${amount}` : "",
      raw: row,
    };
  }));

  const nursingLogs: CalendarLog[] = await Promise.all((nursingRes.data ?? []).map(async (row: any) => {
    const leftDuration = await safeDecrypt(row.left_duration);
    const rightDuration = await safeDecrypt(row.right_duration);
    return {
      type: "Nursing",
      id: row.id,
      at: row.logged_at,
      title: "Nursing",
      details: leftDuration && rightDuration ? `Left Duration: ${leftDuration} \nRight Duration: ${rightDuration}` : "",
      raw: row,
    };
  }));

  const healthLogs: CalendarLog[] = await Promise.all((healthRes.data ?? []).map(async (row: any) => {
    const category = await safeDecrypt(row.category);
    const note = await safeDecrypt(row.note) ?? "N/A";
    return {
      type: "Health",
      id: row.id,
      at: row.date,
      title: `Health • ${category}`,
      details: note,
      raw: row,
    };
  }));

  const milestoneLogs: CalendarLog[] = await Promise.all((milestoneRes.data ?? []).map(async (row: any) => {
    const title = await safeDecrypt(row.title);
    return {
      type: "Milestone",
      id: row.id,
      at: row.achieved_at,
      title: `Milestone • ${title}`,
      details: row.category ?? "",
      raw: row,
    };
  }));

  return [...sleepLogs, ...feedingLogs, ...diaperLogs, ...nursingLogs, ...healthLogs, ...milestoneLogs]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
