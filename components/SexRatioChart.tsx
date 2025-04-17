'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#f16b65', '#5faff1', '#bababa'];

interface ResultEntry {
  dimension_values: string[];
  value: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />

      <text x={cx} y={cy * 0.85} textAnchor="middle" fill={fill} fontSize={20} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy * 1.05} textAnchor="middle" fill="#66ba12" fontSize={30} fontWeight="bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <text x={cx} y={cy * 1.2} textAnchor="middle" fill="#9e9e9e" fontSize={18}>
        {`${value}人`}
      </text>
    </g>
  );
};

export default function SexRatioChart({ onDataLoaded }: { onDataLoaded?: () => void }) {
  const { user } = useUser();
  const userId = user?.org_id || null;
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [innerRadius, setInnerRadius] = useState(80);
  const [outerRadius, setOuterRadius] = useState(110);

  const updateRadius = () => {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const windowSize = Math.min(height, width);
    setInnerRadius(Math.max(10, windowSize * 0.1));
    setOuterRadius(Math.max(30, windowSize * 0.15));
  };

  useEffect(() => {
    updateRadius();
    window.addEventListener('resize', updateRadius);

    return () => {
      window.removeEventListener('resize', updateRadius);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        if (onDataLoaded) onDataLoaded();
        return;
      }

      try {
        const apiAccessToken = process.env.NEXT_PUBLIC_API_ACCESS_TOKEN;
        const response = await fetch(
          `/api/instagram/retrieve/instagram_data?user_id=${userId}&data_type=follower_demographics_month`,
          {
            headers: {
              "Authorization": `Bearer ${apiAccessToken}`,
            },
          }
        );

        const json = response.ok ? await response.json() : null;
        const results: ResultEntry[] = json?.data?.requestData?.total_value?.breakdowns?.[0]?.results ?? [];

        const genderCounts: Record<string, number> = { F: 0, M: 0, U: 0 };
        results.forEach((entry: ResultEntry) => {
          const gender = entry.dimension_values[1];
          if (genderCounts.hasOwnProperty(gender)) {
            genderCounts[gender] += entry.value;
          }
        });

        setData([
          { name: '女性', value: genderCounts.F },
          { name: '男性', value: genderCounts.M },
          { name: '不明', value: genderCounts.U },
        ]);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError("データ取得エラー");
      } finally {
        if (onDataLoaded) onDataLoaded();
      }
    }
    fetchData();
  }, [userId, onDataLoaded]);

  const onPieEnter = (_: unknown, index: number) => setActiveIndex(index);


  if (error) return <div className="w-auto h-full dashboard-bg ">Error: {error}</div>;

  return (
    <div className="dashboard-bg">
      <div className="text-lg font-semibold">性別 フォロワー数</div>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
