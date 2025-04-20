"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarProps,
} from 'recharts';

const GENDER_KEYS = ["F", "M", "U"];
const GENDER_LABELS: Record<string, string> = {
  F: "女性",
  M: "男性",
  U: "不明",
};
const GENDER_COLORS: Record<string, string> = {
  F: "rgb(241,107,101, 0.6)", // 女性用
  M: "rgb(95,175,241, 0.6)", // 男性用
  U: "rgb(186, 186, 186, 0.6)",  // 不明
};

interface VerticalRectangleProps {
  fill: string;
  x: number;
  y: number;
  width: number;
  height: number;
  animationDuration: number;
  animationBegin: number;
}

// カスタムアニメーション用のシェイプを定義
const VerticalRectangle = (props: VerticalRectangleProps) => {
  const { fill, x, y, width, height, animationDuration, animationBegin } = props;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={1}
      className="recharts-bar-rectangle"
      style={{
        transformOrigin: 'bottom',
        transform: 'scaleY(1)',
        animation: `growVertically ${animationDuration}ms ease-out forwards`,
      }}
    >
      <animate
        attributeName="height"
        from="0"
        to={height}
        dur={`${animationDuration}ms`}
        begin={`${animationBegin}ms`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.23, 1, 0.32, 1"
      />
      <animate
        attributeName="y"
        from={y + height}
        to={y}
        dur={`${animationDuration}ms`}
        begin={`${animationBegin}ms`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.23, 1, 0.32, 1"
      />
    </rect>
  );
};

interface ChartDataEntry {
  age: string;
  [key: string]: string | number;
}

interface ResultData {
  dimension_values: string[];
  value: number;
}

export default function DemographicsBarChart({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const { user } = useUser();
  const userId = user?.sub || null;
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("month");
  const dataType = `follower_demographics_${selectedPeriod}`;
  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);
  const [activeBars, setActiveBars] = useState<string[]>(["F", "M", "U"]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    if (!dataKey) return;
    if (activeBars.includes(dataKey.toString())) {
      setActiveBars(activeBars.filter((key) => key !== dataKey.toString()));
    } else {
      setActiveBars([...activeBars, dataKey.toString()]);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        if (onDataLoaded) onDataLoaded();
        return;
      }

      const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
      const initialValueData: ChartDataEntry[] = ageGroups.map(age => ({
        age,
        F: 0,
        M: 0,
        U: 0,
      }));

      try {
        const apiAccessToken = process.env.NEXT_PUBLIC_API_ACCESS_TOKEN;
        const response = await fetch(
          `/api/instagram/retrieve/instagram_data?user_id=${userId}&data_type=${dataType}`,
          {
            headers: {
              Authorization: `Bearer ${apiAccessToken}`
            }
          }
        );

        if (!response.ok) {
          console.warn('データの取得に失敗しました。');
          setChartData(initialValueData);
          return;
        }

        const json = await response.json();
        if (!json?.data?.requestData?.total_value?.breakdowns?.[0]?.results) {
          console.warn('APIから有効なデータが返されませんでした。');
          setChartData(initialValueData);
          return;
        }

        const results: ResultData[] = json.data.requestData.total_value.breakdowns[0].results;

        const data = ageGroups.map((age) => {
          const entry: ChartDataEntry = { age, F: 0, M: 0, U: 0 };
          GENDER_KEYS.forEach((gender) => {
            const r = results.find(
              (d) =>
                d.dimension_values[0] === age &&
                d.dimension_values[1] === gender
            );
            entry[gender] = r ? r.value : 0;
          });
          return entry;
        });

        setChartData(data);
      } catch (error) {
        console.error('Demographics fetch error:', error);
        setChartData(initialValueData);
      } finally {
        if (onDataLoaded) onDataLoaded();
      }
    }
    fetchData();
  }, [userId, dataType, onDataLoaded]);

  const animationStyle = `
    @keyframes growVertically {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
  `;

  return (
    <div className="dashboard-bg">
      <style>{animationStyle}</style>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">年齢・性別分布</div>
        <div>
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value as "week" | "month")
            }
            className="px-3 py-1 border border-gray-300 rounded"
          >
            <option value="month">今月</option>
            <option value="week">今週</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} />
          <XAxis dataKey="age" />
          <YAxis tickCount={8} interval="preserveStartEnd" allowDataOverflow />
          <Tooltip formatter={(value, name) => [`${value}`, GENDER_LABELS[name] || name]} />
          <Legend
            onClick={handleLegendClick}
            formatter={(value) => GENDER_LABELS[value] || value}
          />
          {GENDER_KEYS.map((gender) => (
            <Bar
              key={gender}
              dataKey={gender}
              stackId="a"
              fill={GENDER_COLORS[gender]}
              isAnimationActive={true}
              animationEasing="ease-in-out"
              animationDuration={0}
              animationBegin={0}
              hide={!activeBars.includes(gender)}
              shape={(props: BarProps) => {
                const { fill = '', x = 0, y = 0, width = 0, height = 0 } = props;
                return (
                  <VerticalRectangle
                    fill={fill}
                    x={Number(x) || 0}
                    y={Number(y) || 0}
                    width={Number(width) || 0}
                    height={Number(height) || 0}
                    animationDuration={800}
                    animationBegin={0}
                  />
                );
              }}
            >
              {chartData.map((_: unknown, index: number) => (
                <Cell key={`cell-${index}`} fill={GENDER_COLORS[gender]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
