'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
} from 'recharts';

const dayMapping: Record<number, string> = {
  0: "日",
  1: "土",
  2: "金",
  3: "木",
  4: "水",
  5: "火",
  6: "月"
};


interface OriginalData {
  value: {
    [key: string]: number;
  };
  end_time: string;
}

interface TransformedData {
  value: {
    [key: string]: number;
  };
  end_time: string;
}

/**
 * オンラインフォロワーデータの時間帯を調整する関数
 * 元データの8時〜23時を0時〜15時に、0時〜7時を16時〜23時に変換します
 */
function transformOnlineFollowersData(originalData: OriginalData[]): TransformedData[] {
  // 最初と最後のデータを除くと変換できないため、少なくとも2日分以上のデータが必要
  if (originalData.length < 2) {
    return [];
  }

  const result: TransformedData[] = [];

  // 最初のデータと最後のデータを除いて処理する
  for (let i = 0; i < originalData.length - 1; i++) {
    const currentDay = originalData[i];
    const nextDay = originalData[i + 1];

    const newValue: { [key: string]: number } = {};

    // 現在の日の8時〜23時を0時〜15時に変換
    for (let hour = 8; hour <= 23; hour++) {
      newValue[(hour - 8).toString()] = currentDay.value[hour.toString()];
    }

    // 翌日の0時〜7時を16時〜23時に変換
    for (let hour = 0; hour <= 7; hour++) {
      newValue[(hour + 16).toString()] = nextDay.value[hour.toString()];
    }

    result.push({
      value: newValue,
      end_time: currentDay.end_time
    });
  }

  return result;
}


export default function OnlineFollowersBubbleChart({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      if (onDataLoaded) onDataLoaded();
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch(
          `/api/instagram/retrieve/instagram_data?user_id=${userId}&data_type=online_followers`
        );
        if (!response.ok) {
          throw new Error('データの取得に失敗しました。');
        }
        const json = await response.json();
        if (!json || !json.data || json.length === 0) {
          throw new Error('APIから有効なデータが返されませんでした。');
        }
        const results = transformOnlineFollowersData(json.data[0][0].jsonData.values);

        const chartData = results.map((dayEntry: any) => {
          const date = new Date(dayEntry.end_time);
          let dayIndex = date.getDay();
          if (dayIndex !== 0) {
            dayIndex = 7 - dayIndex;
          }
          const hoursData = dayEntry.value as Record<string, number>;

          return Object.entries(hoursData).map(([hour, count]) => {
            const hourGroup = Math.floor(Number(hour) / 3);
            const startHour = hourGroup * 3;
            const subHourInGroup = Number(hour) % 3;

            return {
              hourGroup: hourGroup,
              day: dayIndex,
              startHour: startHour,
              subHourInGroup: subHourInGroup,
              count: count,
              hoursData: hoursData,
              averageFollowers: Object.values(hoursData)
                .slice(startHour, startHour + 3)
                .reduce((sum: number, val: number) => sum + val, 0) / 3
            };
          });
        }).flat();

        setData(chartData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError("データ取得エラー");
      } finally {
        if (onDataLoaded) onDataLoaded();
      }
    }
    fetchData();
  }, [userId]);

  // カスタムTooltipコンポーネント
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const hoursData = point.hoursData || {};
      const averageFollowers = Math.round(point.averageFollowers);

      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold mb-2">
            {dayMapping[point.day]}曜日 {point.startHour}~{point.startHour + 3}時
          </p>
          <p>平均：{averageFollowers}人</p>
          {[0, 1, 2].map((offset) => {
            const hour = point.startHour + offset;
            return (
              <p key={hour}>
                {hour}~{hour + 1}時：{hoursData[hour] || 0}人
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (error) return <div className="w-auto h-full dashboard-bg ">Error: {error}</div>;

  return (
    <div className="dashboard-bg">
      <div className="text-lg font-semibold  mb-4">フォロワー数</div>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="hourGroup"
            name="時間帯"
            domain={[0, 7]}
            tickCount={8}
            tickFormatter={(tick) => {
              const labels = ["0~3", "3~6", "6~9", "9~12", "12~15", "15~18", "18~21", "21~24"];
              return labels[tick];
            }}
            axisLine={false}
            tickLine={false}
            tick={{ dy: 20 }}
          />
          <YAxis
            type="number"
            dataKey="day"
            name="曜日"
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(tick) => dayMapping[tick]}
            axisLine={false}
            tickLine={false}
            tick={{ dx: -20 }}
          />
          <ZAxis
            type="number"
            dataKey="averageFollowers"
            range={[50, 350]}
            domain={[0, 'dataMax']}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '5 5' }}
          />
          <Scatter
            data={data}
            fill="#8884d8"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}