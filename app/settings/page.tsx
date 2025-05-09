"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Header from '@/components/nav/Header';
import { FaInstagram } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IconType } from 'react-icons';
import Image from 'next/image';
import dayjs from 'dayjs';

export default function Page() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('instagram');
  const [message, setMessage] = useState('');
  const [instagramUserId, setInstagramUserId] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [profileData, setProfileData] = useState<{
    profile_picture_url?: string;
    username?: string;
    name?: string;
    biography?: string;
    created_at?: string;
  } | null>(null);


  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (user) {
      fetch(`/api/instagram/auth?user_id=${user.sub}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setInstagramUserId(data.data.instagram_user_id ?? "");
            setInstagramUsername(data.data.instagram_username ?? "");
            setAccessToken(data.data.access_token ?? "");
            setIsEditing(true);
            setIsVerified(true);
          }
        })
        .catch(() => setMessage("データ取得に失敗しました")
        );

      fetch(`/api/instagram/retrieve/instagram_user?user_id=${user.sub}&fields=profile_data,created_at`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {

            setProfileData({
              ...data.data.profile_data,
              created_at: data.data.created_at,
            });
          }
        })
        .catch(() => setMessage("データ取得に失敗しました")
        );
    }
  }, [user]);

  useEffect(() => {
    setIsVerified(false);
  }, [instagramUserId, instagramUsername, accessToken]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("ログインしてください");
      return;
    }

    const response = await fetch(`/api/instagram/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.sub,
        instagram_user_id: instagramUserId,
        instagram_username: instagramUsername,
        access_token: accessToken,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      setMessage("データを保存しました！");
      setIsEditing(true);
    } else {
      setMessage(`エラー: ${result.error}`);
    }
  };

  const handleCheckID = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("ログインしてください");
      return;
    }

    const response = await fetch(
      `/api/instagram/fetch/connect?user_id=${instagramUserId}&instagram_username=${instagramUsername}&access_token=${accessToken}`,
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage("接続できません");
      setIsVerified(false);
      return;
    }

    if (result.business_discovery_id === instagramUserId) {
      setIsVerified(true);
    } else {
      setMessage(`Username または User ID が一致しません`);
      setIsVerified(false);
    }
  };


  type SettingsTab = 'instagram';

  const tabs: { id: SettingsTab; label: string; icon: IconType }[] = [
    { id: "instagram" as SettingsTab, label: "インスタグラムアカウント", icon: FaInstagram },
  ];

  return (
    <div className="mx-12 my-8">
      <Header pageTitle="マイページ" />
      <div className="max-w-6xl mx-auto px-2 py-8">
        <div className="flex">

          {/* Navigation */}
          <div className="w-64 bg-neutral-100">
            <nav className="px-2 py-4 space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg ${activeTab === id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 rounded-2xl shadow-xl bg-white">

            {activeTab === "instagram" && (
              <div className='p-8 '>



                <div className="mb-6 bg-slate-50 rounded-lg shadow-md p-4 flex space-x-8 items-center">
                  {profileData?.profile_picture_url && (
                    <Image
                      src={profileData.profile_picture_url}
                      alt="Instagram プロフィール画像"
                      width={128}
                      height={128}
                      className="rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">
                        {profileData?.username || "未設定"}
                      </p>
                      <p className="text-sm text-gray-700">
                        登録日: {profileData?.created_at
                          ? dayjs(profileData.created_at).format("YYYY年MM月DD日")
                          : ""}
                      </p>
                    </div>
                    {profileData?.name && (
                      <p className="text-md mt-2 text-gray-700">{profileData.name}</p>
                    )}
                    {profileData?.biography && (
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                        {profileData.biography}
                      </p>
                    )}
                  </div>
                </div>




                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram Username
                    </label>
                    <input
                      type="text"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram User ID
                    </label>
                    <input
                      type="text"
                      value={instagramUserId}
                      onChange={(e) => setInstagramUserId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type={isVisible ? "text" : "password"}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className="absolute right-3 top-9 text-gray-500"
                    >
                      {isVisible ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="mt-6">
                    {isVerified ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full flex items-center justify-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-700"
                      >
                        {isEditing ? "更新" : "保存"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCheckID}
                        disabled={!instagramUserId || !instagramUsername || !accessToken}
                        className={`w-full flex items-center justify-center px-6 py-3 rounded-lg transition 
                            ${(!instagramUserId || !instagramUsername || !accessToken)
                            ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-700"
                          }`}
                      >
                        接続確認
                      </button>
                    )}
                  </div>
                </form>
                {message && (
                  <div className={`mt-4 text-sm ${isVerified ? "text-green-600" : "text-red-600"}`}>
                    {message}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
