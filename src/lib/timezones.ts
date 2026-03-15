export interface TimezoneOption {
  label: string;
  offset: string;
  value: string;
}

export const TIMEZONE_GROUPS: { region: string; zones: TimezoneOption[] }[] = [
  {
    region: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern", offset: "UTC-5" },
      { value: "America/Chicago", label: "Central", offset: "UTC-6" },
      { value: "America/Denver", label: "Mountain", offset: "UTC-7" },
      { value: "America/Los_Angeles", label: "Pacific", offset: "UTC-8" },
      { value: "America/Anchorage", label: "Alaska", offset: "UTC-9" },
      { value: "Pacific/Honolulu", label: "Hawaii", offset: "UTC-10" },
      { value: "America/Toronto", label: "Toronto", offset: "UTC-5" },
      { value: "America/Vancouver", label: "Vancouver", offset: "UTC-8" },
      { value: "America/Mexico_City", label: "Mexico City", offset: "UTC-6" },
      { value: "America/Sao_Paulo", label: "São Paulo", offset: "UTC-3" },
      {
        value: "America/Argentina/Buenos_Aires",
        label: "Buenos Aires",
        offset: "UTC-3",
      },
      { value: "America/Bogota", label: "Bogotá", offset: "UTC-5" },
    ],
  },
  {
    region: "Europe",
    zones: [
      { value: "Europe/London", label: "London", offset: "UTC+0" },
      { value: "Europe/Paris", label: "Paris", offset: "UTC+1" },
      { value: "Europe/Berlin", label: "Berlin", offset: "UTC+1" },
      { value: "Europe/Amsterdam", label: "Amsterdam", offset: "UTC+1" },
      { value: "Europe/Madrid", label: "Madrid", offset: "UTC+1" },
      { value: "Europe/Rome", label: "Rome", offset: "UTC+1" },
      { value: "Europe/Zurich", label: "Zurich", offset: "UTC+1" },
      { value: "Europe/Stockholm", label: "Stockholm", offset: "UTC+1" },
      { value: "Europe/Helsinki", label: "Helsinki", offset: "UTC+2" },
      { value: "Europe/Athens", label: "Athens", offset: "UTC+2" },
      { value: "Europe/Istanbul", label: "Istanbul", offset: "UTC+3" },
      { value: "Europe/Moscow", label: "Moscow", offset: "UTC+3" },
    ],
  },
  {
    region: "Asia & Pacific",
    zones: [
      { value: "Asia/Dubai", label: "Dubai", offset: "UTC+4" },
      { value: "Asia/Kolkata", label: "India (IST)", offset: "UTC+5:30" },
      { value: "Asia/Singapore", label: "Singapore", offset: "UTC+8" },
      { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "UTC+8" },
      { value: "Asia/Shanghai", label: "Shanghai", offset: "UTC+8" },
      { value: "Asia/Seoul", label: "Seoul", offset: "UTC+9" },
      { value: "Asia/Tokyo", label: "Tokyo", offset: "UTC+9" },
      { value: "Asia/Jakarta", label: "Jakarta", offset: "UTC+7" },
      { value: "Australia/Sydney", label: "Sydney", offset: "UTC+11" },
      { value: "Australia/Melbourne", label: "Melbourne", offset: "UTC+11" },
      { value: "Pacific/Auckland", label: "Auckland", offset: "UTC+13" },
    ],
  },
  {
    region: "Africa & Middle East",
    zones: [
      { value: "Africa/Cairo", label: "Cairo", offset: "UTC+2" },
      { value: "Africa/Lagos", label: "Lagos", offset: "UTC+1" },
      { value: "Africa/Johannesburg", label: "Johannesburg", offset: "UTC+2" },
      { value: "Africa/Nairobi", label: "Nairobi", offset: "UTC+3" },
      { value: "Asia/Riyadh", label: "Riyadh", offset: "UTC+3" },
      { value: "Asia/Tehran", label: "Tehran", offset: "UTC+3:30" },
    ],
  },
];

export const ALL_TIMEZONES = TIMEZONE_GROUPS.flatMap((g) => g.zones);

export function getTimezoneLabel(tz: string): string {
  const found = ALL_TIMEZONES.find((z) => z.value === tz);
  return found
    ? `${found.label} (${found.offset})`
    : (tz.replace(/_/g, " ").split("/").pop() ?? tz);
}

export function getShortTimezoneLabel(tz: string): string {
  const found = ALL_TIMEZONES.find((z) => z.value === tz);
  return found ? found.label : (tz.split("/").pop()?.replace(/_/g, " ") ?? tz);
}
