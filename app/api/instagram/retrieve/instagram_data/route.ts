import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Next.jsの設定を追加して動的ルートであることを明示
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// DB接続してinstagram_dataを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const data_type = searchParams.get("data_type");

    if (!user_id || !data_type) {
      return NextResponse.json(
        { error: "user_id, data_typeのパラメータが必要です" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT JSON_EXTRACT(data, '$.data[0]') AS requestData
       FROM instagram_data
       WHERE user_id = ? AND data_type = ?`,
      [user_id, data_type]
    );
    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Data not found", user_id, data_type },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
      user_id,
      data_type
    }, { status: 200 });

  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
