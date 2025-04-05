import React, { useEffect, useState } from 'react';
import type { StatisticProps } from 'antd';
import { Col, Row, Statistic } from 'antd';
import CountUp from 'react-countup';
import { useUser } from "@clerk/nextjs";


const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

type Props = {
  startDate: string;
  endDate: string;
  dataType: string;
  onDataLoaded: () => void;
};

type DataTypeOption = {
  value: string;
  label: string;
};

export default function CountNumber({ startDate, endDate, dataType, onDataLoaded }: Props) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [error, setError] = useState<string | null>(null);
  const [value, setvalue] = useState<number>(0);
  const dataTypeOptions: DataTypeOption[] = [
    { value: "business_discovery", label: "フォロワー数" },
    { value: "reach", label: "リーチ数" },
    { value: "views", label: "ビュー数" },
    { value: "website_clicks", label: "Webサイトクリック" },
    { value: "profile_views", label: "プロフィールビュー" },
    { value: "total_interactions", label: "インタラクション数" }
  ];
  const getDataTypeTitle = () => {
    const option = dataTypeOptions.find(opt => opt.value === dataType);
    return option ? option.label : "Error";
  };

  useEffect(() => {
    async function fetchChartData() {
      if (!userId || !startDate || !endDate) {
        if (onDataLoaded) onDataLoaded();
        return;
      }

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
          throw new Error('APIから有効なデータが返されませんでした。');
        }
        const json = await response.json();
        if (!json || !json.data || json.length === 0) {
          throw new Error('APIから有効なデータが返されませんでした。');
        }
        const results = json.data[0];

        if (dataType === "business_discovery") {
          const lastEntry = results[results.length - 1];
          setvalue(lastEntry.requestData);
        } else {
          const totalValue = results.reduce((sum: number, item: { requestData: number }) => sum + item.requestData, 0);
          setvalue(totalValue);
        }

      } catch (error) {
        console.error('データ取得エラー:', error);
        setError("データ取得エラー");
      } finally {
        if (onDataLoaded) onDataLoaded();
      }
    }

    fetchChartData();
  }, [userId, startDate, endDate]);

  if (error) return <div className="w-auto h-full dashboard-bg ">Error: {error}</div>;

  return (
    <div className='dashboard-bg'>
      <Row gutter={16}>
        <Col span={24}>
          <Statistic title={getDataTypeTitle()} value={value} formatter={formatter} />
        </Col>
      </Row>
    </div>
  );
}

