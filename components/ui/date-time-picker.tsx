"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { ISTTime } from "@/lib/utils/ist-time"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className,
  minDate,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState<string>(value ? format(value, "HH:mm") : "")
  const [isOpen, setIsOpen] = React.useState(false)

  // Set minimum date to current time + 5 minutes if not provided
  const minimumDate = minDate || new Date(Date.now() + 5 * 60 * 1000)

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setTimeValue(format(value, "HH:mm"))
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      updateDateTime(date, timeValue)
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (selectedDate) {
      updateDateTime(selectedDate, time)
    }
  }

  const updateDateTime = (date: Date, time: string) => {
    if (!date || !time) return

    const [hours, minutes] = time.split(":").map(Number)
    const newDateTime = new Date(date)
    newDateTime.setHours(hours, minutes, 0, 0)

    // Validate minimum time
    if (newDateTime.getTime() < minimumDate.getTime()) {
      return // Don't update if before minimum time
    }

    onChange(newDateTime)
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setTimeValue("")
    onChange(undefined)
    setIsOpen(false)
  }

  const handleConfirm = () => {
    if (selectedDate && timeValue) {
      updateDateTime(selectedDate, timeValue)
    }
    setIsOpen(false)
  }

  const displayValue = value ? format(value, "dd MMM yyyy, hh:mm a") : ""

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time (IST)
            </Label>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>

          {selectedDate && timeValue && (
            <div className="p-3 bg-blue-50 rounded-lg border">
              <p className="text-sm text-blue-800">
                <strong>Scheduled for:</strong>
                <br />
                {format(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    Number.parseInt(timeValue.split(":")[0]),
                    Number.parseInt(timeValue.split(":")[1]),
                  ),
                  "dd MMM yyyy, hh:mm a",
                )}{" "}
                IST
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 bg-transparent">
              Clear
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={!selectedDate || !timeValue} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
