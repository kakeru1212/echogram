"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  startDate: string;
  endDate: string;
  onDataLoaded: () => void;
};

type DataTypeOption = {
  value: string;
  label: string;
};

export default function FollowersChart({ startDate, endDate, onDataLoaded }: Props) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataType, setDataType] = useState<string>("business_discovery");

  const dataTypeOptions: DataTypeOption[] = [
    { value: "business_discovery", label: "フォロワー数" },
    { value: "reach", label: "リーチ数" },
    { value: "views", label: "ビュー数" },
    { value: "website_clicks", label: "Webサイトクリック" },
    { value: "profile_views", label: "プロフィールビュー" },
    { value: "total_interactions", label: "インタラクション数" }
  ];

  // データタイプのタイトルを取得する関数
  const getDataTypeTitle = () => {
    const option = dataTypeOptions.find(opt => opt.value === dataType);
    return option ? option.label : "Error";
  };

  useEffect(() => {
    async function fetchChartData() {
      if (!userId || !startDate || !endDate) return;

      try {
        let response;
        if (dataType === "business_discovery") {
          const igUsernameResponse = await fetch(
            `/api/instagram/retrieve/username?user_id=${userId}`
          );
          const igUsernameJson = await igUsernameResponse.json();
          if (!igUsernameResponse.ok) {
            throw new Error('データの取得に失敗しました。');
          }
          const igUsername = igUsernameJson.instagram_username;

          response = await fetch(
            `/api/instagram/retrieve/business_discovery?user_id=${userId}&instagram_username=${igUsername}&start_date=${startDate}&end_date=${endDate}`
          );
        } else {
          response = await fetch(
            `/api/instagram/retrieve/instagram_chart?user_id=${userId}&data_type=${dataType}&start_date=${startDate}&end_date=${endDate}`
          );
        }

        if (!response.ok) {
          throw new Error('データの取得に失敗しました。');
        }
        const json = await response.json();
        if (!json || !json.data || json.data.length === 0) {
          throw new Error('APIから有効なデータが返されませんでした。');
        }

        const results = json.data[0];
        const formattedData = results.map((entry: { date: string; JSONData: number }) => ({
          date: dayjs(entry.date).format("YYYY-MM-DD"),
          value: Math.round(entry.JSONData),
          displayDate: dayjs(entry.date).format("M/D"),
        }));

        formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setChartData(formattedData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError("データ取得エラー");
      } finally {
        onDataLoaded();
      }
    }

    fetchChartData();
  }, [userId, startDate, endDate, dataType]);

  const yAxisProps = () => {
    if (chartData.length === 0) return { domain: [0, 0], ticks: [0] };

    const values = chartData.map(item => item.value);
    const min = Math.max(0, Math.min(...values) - 5);
    const max = Math.max(...values) + 5;

    const range = max - min;
    let interval = Math.ceil(range / 12);

    const magnitude = 10 ** Math.floor(Math.log10(interval));
    const normalizedInterval = interval / magnitude;

    if (normalizedInterval <= 0.2) interval = 0.2 * magnitude;
    else if (normalizedInterval <= 0.5) interval = 0.5 * magnitude;
    else if (normalizedInterval <= 1) interval = 1 * magnitude;
    else if (normalizedInterval <= 2) interval = 2 * magnitude;
    else interval = 5 * magnitude;

    const adjustedMin = Math.floor(min / interval) * interval;
    const adjustedMax = Math.ceil(max / interval) * interval;

    const ticks = [];
    for (let i = adjustedMin; i <= adjustedMax; i += interval) {
      ticks.push(i);
    }

    return { domain: [adjustedMin, adjustedMax], ticks };
  };

  const xAxisTicks = () => {
    if (chartData.length <= 1) return [];

    const numTicks = Math.min(7, chartData.length);
    const interval = Math.ceil(chartData.length / numTicks);

    const ticks = [];
    for (let i = 0; i < chartData.length; i += interval) {
      ticks.push(chartData[i].displayDate);
    }

    if (chartData.length > 0 && !ticks.includes(chartData[chartData.length - 1].displayDate)) {
      ticks.push(chartData[chartData.length - 1].displayDate);
    }

    return ticks;
  };

  const shouldShowDotsValue = 60;
  const shouldShowDots = chartData.length < shouldShowDotsValue;

  const yAxis = yAxisProps();
  const xTicks = xAxisTicks();

  if (error) return <div className="w-auto h-full dashboard-bg ">Error: {error}</div>;

  return (
    <div className="dashboard-bg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">{getDataTypeTitle()}</div>
        <select
          className="bg-white border border-gray-300 rounded-md py-1 px-3 text-sm"
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
        >
          {dataTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 5, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            tickMargin={10}
            ticks={xTicks}
          />
          <YAxis
            domain={yAxis.domain}
            ticks={yAxis.ticks}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <Tooltip
            formatter={(value) => [Math.round(Number(value)), getDataTypeTitle()]}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(75,192,192,0.8)"
            strokeWidth={2}
            fill="rgba(75,192,192,0.5)"
            dot={shouldShowDots ? { r: 3, strokeWidth: 1, fill: "#fff", fillOpacity: 0.6, stroke: "rgba(75,192,192,0.8)" } : false}
            activeDot={{ r: 5, strokeWidth: 1 }}
            name={getDataTypeTitle()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}