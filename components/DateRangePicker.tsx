import React, { useEffect } from "react";
import { DatePicker, Space } from "antd";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type Props = {
  onDateChange: (dates: [string, string] | null) => void;
};

const defaultRange: [Dayjs, Dayjs] = [dayjs().subtract(7, "d"), dayjs()];

// RangePicker のプリセット
const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: "Last 7 Days", value: [dayjs().subtract(7, "d"), dayjs()] },
  { label: "Last 14 Days", value: [dayjs().subtract(14, "d"), dayjs()] },
  { label: "Last 30 Days", value: [dayjs().subtract(30, "d"), dayjs()] },
  { label: "Last 60 Days", value: [dayjs().subtract(60, "d"), dayjs()] },
  { label: "Last 90 Days", value: [dayjs().subtract(90, "d"), dayjs()] },
];

export default function DateRangePicker({ onDateChange }: Props) {

  useEffect(() => {
    onDateChange([
      defaultRange[0].format("YYYY-MM-DD"),
      defaultRange[1].format("YYYY-MM-DD"),
    ]);
  }, [onDateChange]);

  const handleRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      onDateChange(dateStrings);
    } else {
      onDateChange(null);
    }
  };

  return (
    <Space direction="vertical" size={12}>
      <RangePicker
        defaultValue={defaultRange}
        presets={rangePresets}
        onChange={handleRangeChange}
      />
    </Space>
  );
}
