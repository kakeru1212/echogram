import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

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

// DB接続してinstagram_dataを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const data_type = searchParams.get("data_type");

    if (!validateAccessToken(req)) {
      return NextResponse.json(
        { error: "無効なアクセストークンです" },
        { status: 401 }
      );
    }

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
