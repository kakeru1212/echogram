import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = 'force-dynamic';

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: true,
  },
};

// DB接続してinstagram_usernameを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id のパラメータが必要です" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT instagram_username FROM instagram_user WHERE user_id = ?",
      [user_id]
    );

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Instagram user not found", user_id },
        { status: 404 }
      );
    }

    const { instagram_username } = rows[0] as { instagram_username: string };
    return NextResponse.json({ success: true, instagram_username }, { status: 200 });

  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
