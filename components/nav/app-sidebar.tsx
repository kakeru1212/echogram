"use client"

import type * as React from "react"
import { LuLayoutDashboard } from "react-icons/lu";
// import { LuLayoutDashboard, LuCalendarRange, LuSend, LuUserRoundSearch } from "react-icons/lu";
// import { FaUserCircle } from "react-icons/fa";
import { BsGrid3X3GapFill } from "react-icons/bs";
// import { MdOutlineHelpCenter } from "react-icons/md";
import { AiOutlineSetting } from "react-icons/ai";
// import { BiCodeAlt } from "react-icons/bi";
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useUser } from '@auth0/nextjs-auth0/client';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const data = {
    user: {
      name: user?.name || "ゲスト",
      email: user?.email || "",
      avatar: user?.picture || "/avatar.png",
    },
    navMain: [
      {
        title: "ダッシュボード",
        url: "/",
        icon: LuLayoutDashboard,
      },
      // {
      //   title: "マイアカウント",
      //   url: "#",
      //   icon: FaUserCircle,
      //   items: [
      //     {
      //       title: "インサイト",
      //       url: "#",
      //     },
      //     {
      //       title: "アカウント属性",
      //       url: "#",
      //     },
      //   ],
      // },
      {
        title: "投稿",
        url: "#",
        icon: BsGrid3X3GapFill,
        items: [
          {
            title: "投稿一覧",
            url: "/post/post-list",
          },
          {
            title: "フィード投稿",
            url: "/post/feed-post",
          },
          {
            title: "リール投稿",
            url: "/post/reel-post",
          },
        ],
      },
      // {
      //   title: "投稿カレンダー",
      //   url: "#",
      //   icon: LuCalendarRange,
      // },
      // {
      //   title: "ベンチマーク",
      //   url: "#",
      //   icon: LuUserRoundSearch,
      //   items: [
      //     {
      //       title: "インサイト",
      //       url: "#",
      //     },
      //     {
      //       title: "投稿一覧",
      //       url: "#",
      //     },
      //     {
      //       title: "ハッシュタグ",
      //       url: "#",
      //     },
      //     {
      //       title: "設定",
      //       url: "#",
      //     },
      //   ],
      // },
      // {
      //   title: "Test",
      //   url: "#",
      //   icon: BiCodeAlt,
      //   isActive: true,
      //   items: [
      //     {
      //       title: "Inbox",
      //       url: "/test/inbox",
      //     },
      //     {
      //       title: "Search",
      //       url: "/test/search",
      //     },
      //   ],
      // },
    ],
    navSecondary: [
      // {
      //   title: "ヘルプ",
      //   url: "#",
      //   icon: MdOutlineHelpCenter,
      // },
      // {
      //   title: "フィードバック",
      //   url: "#",
      //   icon: LuSend,
      // },
      {
        title: "設定",
        url: "/settings",
        icon: AiOutlineSetting,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" className="top-0 !h-[calc(100svh)]" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
    </Sidebar>
  )
}

