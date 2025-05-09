import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const getCACert = () => {
  if (process.env.CA_CERT) {
    const buff = Buffer.from(process.env.CA_CERT, 'base64');
    return buff.toString('ascii');
  }
  return undefined;
};

// TiDB 接続設定
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: true,
    ca: getCACert(),
  },
};

// user_idから登録データを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const fieldsParam = searchParams.get("fields") ?? "";
    const fields = fieldsParam
      .split(",")
      .map((f) => f.trim())
      .filter((f) =>
        ["instagram_username", "created_at", "updated_at", "profile_data"].includes(
          f
        )
      );

    if (!user_id || fields.length === 0) {
      return NextResponse.json(
        { error: "user_id と fields が必要です" },
        { status: 400 }
      );
    }

    const fieldList = fields.map((f) => `\`${f}\``).join(", ");
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT ${fieldList} FROM instagram_user WHERE user_id = ?`,
      [user_id]
    );

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Data not found",
        user_id
      }, { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
