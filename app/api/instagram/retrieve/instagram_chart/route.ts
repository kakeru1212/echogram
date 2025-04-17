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

function validateAccessToken(req: NextRequest): boolean {
  const validToken = process.env.API_ACCESS_TOKEN;

  if (!validToken) {
    console.error("API_ACCESS_TOKEN is not set in environment variables");
    return false;
  }

  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === validToken;
}

// DB接続して指定期間のinstagram_chartを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const dataType = searchParams.get("data_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    
    if (!validateAccessToken(req)) {
      return NextResponse.json(
        { error: "無効なアクセストークンです" },
        { status: 401 }
      );
    }

    if (!user_id || !dataType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "user_id, dataType, startDate, endDate のパラメータが必要です" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);
    const response = await connection.execute(
      `SELECT retrieved_at AS date, JSON_EXTRACT(data, '$.data[0].total_value.value') AS requestData
       FROM instagram_chart
       WHERE user_id = ? AND data_type = ? AND retrieved_at BETWEEN ? AND ?
       ORDER BY retrieved_at`,
      [user_id, dataType, startDate, endDate]
    );
    await connection.end();

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
