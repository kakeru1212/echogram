"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
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

// カスタムアニメーション用のシェイプを定義
const VerticalRectangle = (props: any) => {
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

export default function DemographicsBarChart({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("month");
  const dataType = `follower_demographics_${selectedPeriod}`;
  const [chartData, setChartData] = useState<any>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeBars, setActiveBars] = useState<string[]>(["F", "M", "U"]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        if (onDataLoaded) onDataLoaded();
        return;
      }

      try {
        const response = await fetch(
          `/api/instagram/retrieve/instagram_data?user_id=${userId}&data_type=${dataType}`
        );
        if (!response.ok) {
          throw new Error('データの取得に失敗しました。');
        }
        const json = await response.json();
        if (!json || !json.data || json.length === 0) {
          throw new Error('APIから有効なデータが返されませんでした。');
        }
        const results = json.data.requestData.total_value.breakdowns[0].results;
        const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

        const data = ageGroups.map((age) => {
          const entry: any = { age };
          GENDER_KEYS.forEach((gender) => {
            const result = results.find(
              (r: any) =>
                r.dimension_values[0] === age && r.dimension_values[1] === gender
            );
            entry[gender] = result ? result.value : 0;
          });
          return entry;
        });

        setChartData(data);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError("データ取得エラー");
      } finally {
        if (onDataLoaded) onDataLoaded();
      }
    }
    fetchData();
  }, [userId, dataType]);

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    if (activeBars.includes(dataKey)) {
      setActiveBars(activeBars.filter((key) => key !== dataKey));
    } else {
      setActiveBars([...activeBars, dataKey]);
    }
  };

  // CSS for the vertical animation
  const animationStyle = `
    @keyframes growVertically {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
  `;

  if (error) return <div className="w-auto h-full dashboard-bg ">Error: {error}</div>;

  return (
    <div className="dashboard-bg">
      <style>{animationStyle}</style>
      {/* タイトル部分：左側にタイトル、右上にプルダウン */}
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
              shape={<VerticalRectangle animationDuration={800} animationBegin={0} />}
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
