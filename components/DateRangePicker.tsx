"use client";

import React, { useEffect, useState } from "react";
import { DatePicker, Space } from "antd";
import jaLocale from "antd/es/date-picker/locale/ja_JP";
import dayjs, { Dayjs } from "dayjs";
import { useUser } from "@auth0/nextjs-auth0/client";

const { RangePicker } = DatePicker;

type Props = {
  onDateChange: (dates: [string, string] | null) => void;
};

// プリセット
const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: "過去7日間", value: [dayjs().subtract(7, "day"), dayjs()] },
  { label: "過去14日間", value: [dayjs().subtract(14, "day"), dayjs()] },
  { label: "過去30日間", value: [dayjs().subtract(30, "day"), dayjs()] },
  { label: "過去60日間", value: [dayjs().subtract(60, "day"), dayjs()] },
  { label: "過去90日間", value: [dayjs().subtract(90, "day"), dayjs()] },
];

export default function DateRangePicker({ onDateChange }: Props) {
  const { user } = useUser();

  const [createDate, setCreateDate] = useState<Dayjs | null>(null);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/instagram/retrieve/instagram_user?user_id=${user.sub}&fields=created_at`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.created_at) {
          setCreateDate(dayjs(data.data.created_at));
        }
      });
  }, [user]);

  useEffect(() => {
    if (!createDate) return;

    const todayEnd = dayjs().endOf("day");
    const days = todayEnd.diff(createDate.startOf("day"), "day") + 1;

    const start = days < 7
      ? createDate.startOf("day")
      : todayEnd.subtract(7, "day");

    const newRange: [Dayjs, Dayjs] = [start, todayEnd];
    setRange(newRange);
    onDateChange([start.format("YYYY-MM-DD"), todayEnd.format("YYYY-MM-DD")]);
  }, [createDate, onDateChange]);

  const handleRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setRange([dates[0], dates[1]]);
      onDateChange(dateStrings);
    }
  };

  const disabledDate = (current: Dayjs) => {
    const todayEnd = dayjs().endOf("day");
    if (!createDate) {
      return current.isAfter(todayEnd, "day");
    }
    return (
      current.isBefore(createDate.startOf("day"), "day") ||
      current.isAfter(todayEnd, "day")
    );
  };

  return (
    <Space direction="vertical" size={12}>
      <RangePicker
        locale={jaLocale}
        value={range}
        presets={rangePresets}
        onChange={handleRangeChange}
        allowClear={false}
        disabledDate={disabledDate}
      />
    </Space>
  );
}
