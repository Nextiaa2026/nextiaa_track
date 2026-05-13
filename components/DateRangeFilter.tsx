"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps {
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: DateRangeFilterProps) {
  const date: DateRange | undefined = React.useMemo(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartDateChange(format(range.from, "yyyy-MM-dd"));
    } else {
      onStartDateChange("");
    }

    if (range?.to) {
      onEndDateChange(format(range.to, "yyyy-MM-dd"));
    } else {
      onEndDateChange("");
    }
  };

  return (
    <div className={cn("grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-11 rounded-xl border-gray-200 justify-start text-left font-normal text-xs bg-white w-[260px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y") + " - " + format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          <div className="p-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold"
                onClick={() => {
                    onStartDateChange("");
                    onEndDateChange("");
                }}
            >
                Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
