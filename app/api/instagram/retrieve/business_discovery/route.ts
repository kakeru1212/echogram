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

// DB接続して指定期間のbusiness_discoveryを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const instagram_username = searchParams.get("instagram_username");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!user_id || !instagram_username || !startDate || !endDate) {
      return NextResponse.json(
        { error: "user_id, instagram_username, startDate, endDate のパラメータが必要です" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);
    
    const dataType = `business_discovery_${instagram_username}`;
    const response = await connection.execute(
      `SELECT retrieved_at AS date, JSON_EXTRACT(data, '$.business_discovery.followers_count') AS requestData
       FROM instagram_chart
       WHERE user_id = ? AND data_type = ? AND retrieved_at BETWEEN ? AND ?
       ORDER BY retrieved_at`,
      [user_id, dataType, startDate, endDate]
    );

    await connection.end();

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error("error:", error);
    return NextResponse.json({ error: "データ取得に失敗しました" }, { status: 500 });
  }
}
