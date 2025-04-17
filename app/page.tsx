'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState, useCallback } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import LineChart from "@/components/LineChart";
import CountNumber from "@/components/CountNumber";
import DemographicsBarChart from "@/components/DemographicsBarChart";
import Header from "@/components/nav/Header";
import OnlineFollowersChart from "@/components/OnlineFollowersChart";
import SexRatioChart from "@/components/SexRatioChart";
import Loading from "@/components/Loading";
import Link from 'next/link';

export default function Page() {
  const { user, isLoading: isAuthLoading } = useUser();
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

  const handleDataLoaded = useCallback((key: keyof typeof componentLoading) => {
    setComponentLoading(prev => ({
      ...prev,
      [key]: false
    }));
  }, []);

  const handleCountNumberLoaded = useCallback(() => handleDataLoaded("isCountNumber"), [handleDataLoaded]);
  const handleLineChartLoaded = useCallback(() => handleDataLoaded("isLineChart"), [handleDataLoaded]);
  const handleSexRatioLoaded = useCallback(() => handleDataLoaded("isSexRatioChart"), [handleDataLoaded]);
  const handleDemographicsLoaded = useCallback(() => handleDataLoaded("isDemographicsBarChart"), [handleDataLoaded]);
  const handleOnlineFollowersLoaded = useCallback(() => handleDataLoaded("isOnlineFollowersChart"), [handleDataLoaded]);

  const isComponentLoading = Object.values(componentLoading).some(loading => loading);

  if (isAuthLoading || initialLoading) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        <Link href="/api/auth/login" className="text-blue-500 underline">ログインしてください</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden mx-12 my-8">
      <Header
        pageTitle="ダッシュボード"
        actions={<DateRangePicker onDateChange={setDateRange} />}
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {dateRange && (
            <>
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="business_discovery" onDataLoaded={handleCountNumberLoaded} />
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="reach" onDataLoaded={handleCountNumberLoaded} />
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="views" onDataLoaded={handleCountNumberLoaded} />
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="website_clicks" onDataLoaded={handleCountNumberLoaded} />
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="profile_views" onDataLoaded={handleCountNumberLoaded} />
              <CountNumber startDate={dateRange[0]} endDate={dateRange[1]} dataType="total_interactions" onDataLoaded={handleCountNumberLoaded} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3">
            {dateRange && (
              <LineChart
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onDataLoaded={handleLineChartLoaded}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <SexRatioChart onDataLoaded={handleSexRatioLoaded} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DemographicsBarChart onDataLoaded={handleDemographicsLoaded} />
          </div>
          <div className="lg:col-span-2">
            <OnlineFollowersChart onDataLoaded={handleOnlineFollowersLoaded} />
          </div>
        </div>
      </div>

      {isComponentLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
          <Loading />
        </div>
      )}
    </div>
  );
}
