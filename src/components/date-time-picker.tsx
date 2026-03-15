"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Clock01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs, { userTimezone } from "@/lib/dayjs";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const QUICK_DATES = [
  { label: "Now", offset: -1 },
  { label: "Today", offset: 0 },
  { label: "Tomorrow", offset: 1 },
  { label: "+3 days", offset: 3 },
  { label: "+1 week", offset: 7 },
];

function tzAbbr(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return (
      parts.find((p) => p.type === "timeZoneName")?.value ??
      tz.split("/").pop()?.replace(/_/g, " ") ??
      tz
    );
  } catch {
    return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  }
}

function formatDateLabel(date: Date | null, tz?: string): string {
  if (!date) {
    return "Pick date & time";
  }
  const d = dayjs(date);
  let label: string;
  if (d.isToday()) {
    label = `Today · ${d.format("h:mm A")}`;
  } else if (d.isTomorrow()) {
    label = `Tomorrow · ${d.format("h:mm A")}`;
  } else {
    label = d.format("MMM D · h:mm A");
  }
  if (tz) {
    label += ` ${tzAbbr(tz)}`;
  }
  return label;
}

function buildCalendarDays(month: Dayjs) {
  const start = month.startOf("month");
  const end = month.endOf("month");
  const startDay = start.day();
  const days: (Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (
    let d = start;
    d.isBefore(end) || d.isSame(end, "day");
    d = d.add(1, "day")
  ) {
    days.push(d);
  }
  return days;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  leadTimezone,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  className?: string;
  leadTimezone?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? dayjs(value).startOf("month") : dayjs().startOf("month")
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [timeStr, setTimeStr] = useState(
    value ? dayjs(value).format("HH:mm") : "10:00"
  );

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const today = dayjs().startOf("day");
  const effectiveLeadTz =
    leadTimezone && leadTimezone !== userTimezone ? leadTimezone : null;

  function applyDateTime(date: Dayjs, time: string) {
    const [h, m] = time.split(":").map(Number);
    const result = date
      .hour(h || 0)
      .minute(m || 0)
      .second(0)
      .toDate();
    setSelectedDate(result);
    onChange(result);
  }

  function handleDayClick(d: Dayjs) {
    applyDateTime(d, timeStr);
  }

  function handleQuickDate(offset: number) {
    if (offset === -1) {
      const now = dayjs();
      setViewMonth(now.startOf("month"));
      setTimeStr(now.format("HH:mm"));
      const result = now.second(0).toDate();
      setSelectedDate(result);
      onChange(result);
      return;
    }
    const d = dayjs().add(offset, "day").startOf("day");
    setViewMonth(d.startOf("month"));
    applyDateTime(d, timeStr);
  }

  function handleTimeChange(time: string) {
    setTimeStr(time);
    if (selectedDate) {
      applyDateTime(dayjs(selectedDate), time);
    }
  }

  function prevMonth() {
    setViewMonth((m) => m.subtract(1, "month"));
  }
  function nextMonth() {
    setViewMonth((m) => m.add(1, "month"));
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <button
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-xs transition-colors hover:bg-muted/40",
              !value && "text-muted-foreground",
              className
            )}
            type="button"
          />
        }
      >
        <HugeiconsIcon
          className="shrink-0 text-muted-foreground"
          icon={Calendar01Icon}
          size={13}
          strokeWidth={1.5}
        />
        <span className="flex-1 truncate">
          {formatDateLabel(value, userTimezone)}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0">
        {/* quick dates */}
        <div className="flex gap-0.5 border-b px-2 py-1.5">
          {QUICK_DATES.map((qd) => (
            <button
              className="flex-1 rounded-md px-1 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              key={qd.label}
              onClick={() => handleQuickDate(qd.offset)}
              type="button"
            >
              {qd.label}
            </button>
          ))}
        </div>

        {/* month nav */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <button
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            onClick={prevMonth}
            type="button"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} strokeWidth={2} />
          </button>
          <span className="font-medium text-xs">
            {viewMonth.format("MMMM YYYY")}
          </span>
          <button
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            onClick={nextMonth}
            type="button"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2} />
          </button>
        </div>

        {/* calendar grid */}
        <div className="px-3 pb-2">
          <div className="mb-1 grid grid-cols-7 gap-0">
            {WEEKDAYS.map((wd) => (
              <div
                className="py-1 text-center font-medium text-[9px] text-muted-foreground"
                key={wd}
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((d, i) => {
              if (!d) {
                return <div key={`empty-${String(i)}`} />;
              }
              const isSelected =
                selectedDate && d.isSame(dayjs(selectedDate), "day");
              const isDayToday = d.isSame(today, "day");
              const isPast = d.isBefore(today, "day");
              let dayStyle = "text-foreground hover:bg-muted/60";
              if (isSelected) {
                dayStyle = "bg-primary font-semibold text-primary-foreground";
              } else if (isDayToday) {
                dayStyle = "font-semibold text-primary hover:bg-primary/10";
              } else if (isPast) {
                dayStyle = "text-muted-foreground/40";
              }
              return (
                <button
                  className={cn(
                    "mx-auto flex size-7 items-center justify-center rounded-full text-[11px] transition-colors",
                    dayStyle
                  )}
                  key={d.format("YYYY-MM-DD")}
                  onClick={() => handleDayClick(d)}
                  type="button"
                >
                  {d.date()}
                </button>
              );
            })}
          </div>
        </div>

        {/* time section */}
        <div className="space-y-1.5 border-t px-3 py-2.5">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              className="shrink-0 text-muted-foreground"
              icon={Clock01Icon}
              size={12}
              strokeWidth={1.5}
            />
            <input
              className="h-7 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(e) => handleTimeChange(e.target.value)}
              type="time"
              value={timeStr}
            />
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {tzAbbr(userTimezone)}
            </span>
          </div>

          {effectiveLeadTz && selectedDate && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <HugeiconsIcon
                className="shrink-0"
                icon={Globe02Icon}
                size={12}
                strokeWidth={1.5}
              />
              <span className="flex-1">
                {dayjs(selectedDate).tz(effectiveLeadTz).format("h:mm A")}{" "}
                lead's time
              </span>
              <span>{tzAbbr(effectiveLeadTz)}</span>
            </div>
          )}
        </div>

        {/* confirm */}
        <div className="border-t p-2">
          <Button
            className="w-full"
            disabled={!selectedDate}
            onClick={() => setOpen(false)}
            size="sm"
          >
            {selectedDate ? (
              <span className="flex items-center gap-1.5">
                <span>{formatDateLabel(selectedDate)}</span>
                {effectiveLeadTz && (
                  <span className="font-normal text-primary-foreground/60">
                    / {dayjs(selectedDate).tz(effectiveLeadTz).format("h:mm A")}
                  </span>
                )}
              </span>
            ) : (
              "Select a date"
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
