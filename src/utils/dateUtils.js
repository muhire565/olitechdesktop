/** Calendar YYYY-MM-DD in Africa/Kigali (store timezone), aligned with API daily filters */
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const rwandaFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Kigali",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatRwandaDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return rwandaFormatter.format(date).replace(",", "");
};
