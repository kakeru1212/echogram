'use client';

import { useUser } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#f16b65', '#5faff1', '#bababa'];

// カスタムアクティブシェイプ（ホバー時に中央に情報を表示）
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      {/* 円グラフのセクター */}
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

      {/* 中央のラベル（性別・パーセンテージ・人数） */}
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
  const userId = user?.id || null;
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
    updateRadius(); // 初回レンダリング時に呼び出し
    window.addEventListener('resize', updateRadius); // リサイズイベントをリスン

    return () => {
      window.removeEventListener('resize', updateRadius); // クリーンアップ
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        if (onDataLoaded) onDataLoaded();
        return;
      }
        
      try {
        const response = await fetch(
          `/api/instagram/retrieve/instagram_data?user_id=${userId}&data_type=follower_demographics_month`
        );
        if (!response.ok) {
          throw new Error('データの取得に失敗しました。');
        }
        const json = await response.json();
        if (!json || !json.data || json.length === 0) {
          throw new Error('APIから有効なデータが返されませんでした。');
        }
        const results = json.data[0][0].jsonData.total_value.breakdowns[0].results;

        // 性別ごとの合計を計算
        const genderCounts: Record<string, number> = { F: 0, M: 0, U: 0 };

        results.forEach((entry: any) => {
          const gender = entry.dimension_values[1]; // "F", "M", "U"
          genderCounts[gender] = (genderCounts[gender] || 0) + entry.value;
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
  }, [userId]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
            startAngle={90}   // 12時の方向を開始位置に設定
            endAngle={-270}   // 時計回りに描画
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
