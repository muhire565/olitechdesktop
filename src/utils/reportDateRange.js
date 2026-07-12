const KIGALI = "Africa/Kigali";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KIGALI,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toKigaliYmd(d) {
  return ymdFormatter.format(d);
}

export function addDaysKigali(ymd, deltaDays) {
  const t = new Date(`${ymd}T12:00:00+02:00`).getTime() + deltaDays * 86400000;
  return toKigaliYmd(new Date(t));
}

function kigaliWeekdayIndexMon0(ymd) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KIGALI,
    weekday: "short",
  }).formatToParts(new Date(`${ymd}T12:00:00+02:00`));
  const raw = parts.find((p) => p.type === "weekday")?.value || "";
  const w = raw.replace(/\.$/, "").slice(0, 3);
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[w] ?? 0;
}

function monthBounds(ymd) {
  const [y, hm] = ymd.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const from = `${y}-${pad(hm)}-01`;
  const lastDay = new Date(Date.UTC(y, hm, 0)).getUTCDate();
  const to = `${y}-${pad(hm)}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function yearBounds(ymd) {
  const y = Number(ymd.slice(0, 4));
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

/**
 * @param {"daily" | "weekly" | "monthly" | "yearly"} preset
 * @param {string} anchorYmd
 */
export function getReportRange(preset, anchorYmd) {
  if (preset === "daily") {
    const label = new Intl.DateTimeFormat("en-GB", {
      timeZone: KIGALI,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${anchorYmd}T12:00:00+02:00`));
    return { from: anchorYmd, to: anchorYmd, label };
  }

  if (preset === "weekly") {
    const idx = kigaliWeekdayIndexMon0(anchorYmd);
    const from = addDaysKigali(anchorYmd, -idx);
    const to = addDaysKigali(from, 6);
    const a = new Date(`${from}T12:00:00+02:00`);
    const b = new Date(`${to}T12:00:00+02:00`);
    const fmtShort = new Intl.DateTimeFormat("en-GB", {
      timeZone: KIGALI,
      day: "numeric",
      month: "short",
    });
    const fmtYear = new Intl.DateTimeFormat("en-GB", { timeZone: KIGALI, year: "numeric" });
    const label = `${fmtShort.format(a)} – ${fmtShort.format(b)} ${fmtYear.format(b)}`;
    return { from, to, label };
  }

  if (preset === "monthly") {
    const { from, to } = monthBounds(anchorYmd);
    const label = new Intl.DateTimeFormat("en-GB", {
      timeZone: KIGALI,
      month: "long",
      year: "numeric",
    }).format(new Date(`${anchorYmd}T12:00:00+02:00`));
    return { from, to, label };
  }

  if (preset === "yearly") {
    const { from, to } = yearBounds(anchorYmd);
    return { from, to, label: anchorYmd.slice(0, 4) };
  }

  return { from: anchorYmd, to: anchorYmd, label: anchorYmd };
}

export const REPORT_PRESETS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];
