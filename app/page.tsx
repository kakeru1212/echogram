'use client';

import { useEffect, useState } from "react";
import DateRangePicker from "@/components/DateRangePicker"
import LineChart from "@/components/LineChart";
import CountNumber from "@/components/CountNumber";
import DemographicsBarChart from "@/components/DemographicsBarChart";
import Header from "@/components/nav/Header";
import OnlineFollowersChart from "@/components/OnlineFollowersChart";
import SexRatioChart from "@/components/SexRatioChart";
import Loading from "@/components/Loading";

export default function Page() {

  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [componentLoading, setComponentLoading] = useState({
    isCountNumber: true,
    isLineChart: true,
    isSexRatioChart: true,
    isDemographicsBarChart: true,
    isOnlineFollowersChart: true
  });
  const [initialLoading, setInitialLoading] = useState(true);


  useEffect(() => {
    setTimeout(() => setInitialLoading(false), 500);
  }, []);

  const handleDataLoaded = (key: keyof typeof componentLoading) => {
    // console.log(`${key}のデータ読み込み完了`);
    setComponentLoading(prev => ({
      ...prev,
      [key]: false
    }));
  };

  const isLoading = Object.values(componentLoading).some(loading => loading);

  return (
    <div className="flex-1 flex flex-col overflow-hidden mx-12 my-8">
      <Header pageTitle="ダッシュボード" actions={<DateRangePicker onDateChange={setDateRange} />} />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="business_discovery"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="reach"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="views"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="website_clicks"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="profile_views"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
          {dateRange && <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="total_interactions"  onDataLoaded={() => handleDataLoaded("isCountNumber")} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3">
            {dateRange && <LineChart startDate={dateRange[0]} endDate={dateRange[1]} onDataLoaded={() => handleDataLoaded("isLineChart")} />}
          </div>
          <div className="lg:col-span-2">
            <SexRatioChart onDataLoaded={() => handleDataLoaded("isSexRatioChart")} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DemographicsBarChart onDataLoaded={() => handleDataLoaded("isDemographicsBarChart")} />
          </div>
          <div className="lg:col-span-2">
            <OnlineFollowersChart onDataLoaded={() => handleDataLoaded("isOnlineFollowersChart")} />
          </div>
        </div>
      </div>


      {(isLoading || initialLoading) && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
          <Loading />
        </div>
      )}
    </div>
  )
}

