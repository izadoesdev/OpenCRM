"use client";

import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { SectionHeader } from "@/components/micro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

const QUICK_DATES = [
  { label: "Today", fn: () => dayjs().startOf("day").toDate() },
  {
    label: "Tomorrow",
    fn: () => dayjs().add(1, "day").startOf("day").toDate(),
  },
  {
    label: "In 3 days",
    fn: () => dayjs().add(3, "day").startOf("day").toDate(),
  },
  {
    label: "Next week",
    fn: () => dayjs().add(1, "week").startOf("day").toDate(),
  },
  {
    label: "In 2 weeks",
    fn: () => dayjs().add(2, "week").startOf("day").toDate(),
  },
];

const QUICK_TIMES = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const RE_TIME = /^\d{2}:\d{2}$/;

function formatDateLabel(date: Date | null): string {
  if (!date) {
    return "Pick date & time";
  }
  const d = dayjs(date);
  if (d.isToday()) {
    return `Today · ${d.format("h:mm A")}`;
  }
  if (d.isTomorrow()) {
    return `Tomorrow · ${d.format("h:mm A")}`;
  }
  return d.format("MMM D · h:mm A");
}

export function DateTimePicker({
  value,
  onChange,
  className,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [timeStr, setTimeStr] = useState(
    value ? dayjs(value).format("HH:mm") : "10:00"
  );

  function handleDateSelect(date: Date) {
    const [h, m] = timeStr.split(":").map(Number);
    const withTime = dayjs(date).hour(h).minute(m).second(0).toDate();
    setSelectedDate(withTime);
    onChange(withTime);
  }

  function handleTimeSelect(time: string) {
    setTimeStr(time);
    if (selectedDate) {
      const [h, m] = time.split(":").map(Number);
      const updated = dayjs(selectedDate).hour(h).minute(m).second(0).toDate();
      setSelectedDate(updated);
      onChange(updated);
    }
  }

  function handleTimeInput(time: string) {
    setTimeStr(time);
    if (selectedDate && RE_TIME.test(time)) {
      const [h, m] = time.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const updated = dayjs(selectedDate)
          .hour(h)
          .minute(m)
          .second(0)
          .toDate();
        setSelectedDate(updated);
        onChange(updated);
      }
    }
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <button
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border bg-transparent px-2.5 text-left text-xs transition-colors hover:bg-muted/40",
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
        <span className="flex-1 truncate">{formatDateLabel(value)}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <div className="border-b p-2">
          <SectionHeader className="px-1 text-muted-foreground">
            Date
          </SectionHeader>
          <div className="space-y-0.5">
            {QUICK_DATES.map((qd) => {
              const d = qd.fn();
              const active =
                selectedDate && dayjs(selectedDate).isSame(d, "day");
              return (
                <button
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted/60"
                  )}
                  key={qd.label}
                  onClick={() => handleDateSelect(d)}
                  type="button"
                >
                  {qd.label}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {dayjs(d).format("ddd, MMM D")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-2">
          <SectionHeader className="px-1 text-muted-foreground">
            Time
          </SectionHeader>
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <HugeiconsIcon
              className="shrink-0 text-muted-foreground"
              icon={Clock01Icon}
              size={12}
              strokeWidth={1.5}
            />
            <Input
              className="h-7 flex-1 font-mono text-xs"
              onChange={(e) => handleTimeInput(e.target.value)}
              type="time"
              value={timeStr}
            />
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {QUICK_TIMES.map((t) => (
              <button
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-[10px] transition-colors",
                  timeStr === t
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                key={t}
                onClick={() => handleTimeSelect(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t p-2">
          <Button
            className="w-full"
            disabled={!selectedDate}
            onClick={() => setOpen(false)}
            size="sm"
          >
            {selectedDate ? formatDateLabel(selectedDate) : "Select a date"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
