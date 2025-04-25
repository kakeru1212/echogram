"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Header from '@/components/nav/Header';
import { FaInstagram } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IconType } from 'react-icons';
import { MdManageAccounts } from 'react-icons/md';

type SettingsTab = 'account' | 'instagram';

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

  useEffect(() => {
    if (user) {
      fetch(`/api/instagram/auth?user_id=${user.sub}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.instagram_user_id) {
            setInstagramUserId(data.instagram_user_id);
            setInstagramUsername(data.instagram_username);
            setAccessToken(data.access_token);
            setIsEditing(true);
            setIsVerified(true);
          }
        })
        .catch(() => setMessage("データ取得に失敗しました"));
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

    const apiAccessToken = process.env.NEXT_PUBLIC_API_ACCESS_TOKEN;  
    const response = await fetch(`/api/instagram/auth`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiAccessToken}`,
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

  // const handleDelete = async () => {
  //   if (!confirm("本当に削除しますか？")) return;

  //   const response = await fetch(`/api/instagram/auth?user_id=${user?.id}`, {
  //     method: "DELETE",
  //   });

  //   if (response.ok) {
  //     setInstagramUserId("");
  //     setInstagramUsername("");
  //     setAccessToken("");
  //     setIsEditing(false);
  //     setMessage("データを削除しました");
  //   } else {
  //     setMessage("削除に失敗しました");
  //   }
  // };


  const handleCheckID = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("ログインしてください");
      return;
    }

    const apiAccessToken = process.env.NEXT_PUBLIC_API_ACCESS_TOKEN;
    const response = await fetch(
      `/api/instagram/fetch/connect?user_id=${instagramUserId}&instagram_username=${instagramUsername}&access_token=${accessToken}`,
      {
        headers: {
          "Authorization": `Bearer ${apiAccessToken}`,
        },
      }
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


  const tabs: { id: SettingsTab; label: string; icon: IconType }[] = [
    { id: "instagram" as SettingsTab, label: "インスタグラムアカウント", icon: FaInstagram },
    { id: "account" as SettingsTab, label: "会員情報", icon: MdManageAccounts },
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

                <h2 className="text-2xl font-bold mb-6">
                  {isEditing ? "Instagram ユーザー編集" : "Instagram ユーザー登録"}
                </h2>
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

            {activeTab === "account" && (
              <div>
                {/* <UserProfile
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "shadow-sm rounded-2xl",
                      size: "flexible",
                    },
                  }}
                /> */}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
