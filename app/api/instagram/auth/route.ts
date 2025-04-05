import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// TiDB 接続設定
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

// Instagramユーザー情報を取得
export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT instagram_user_id, instagram_username, access_token FROM instagram_user WHERE user_id = ?",
      [user_id]
    );

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json(rows[0], { status: 200 });
    } else {
      return NextResponse.json({ error: "データがありません" }, { status: 404 });
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
    return NextResponse.json({ error: "データ取得エラー" }, { status: 500 });
  }
}

// Instagramユーザー情報を登録または更新
export async function POST(req: NextRequest) {
  try {
    const { user_id, instagram_user_id, instagram_username, access_token } = await req.json();

    if (!user_id || !instagram_user_id || !instagram_username || !access_token) {
      return NextResponse.json({ error: "すべてのフィールドを入力してください" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // 既存データを確認
    const [existing] = await connection.execute(
      "SELECT id FROM instagram_user WHERE user_id = ?",
      [user_id]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // 既存データがある場合は UPDATE
      await connection.execute(
        "UPDATE instagram_user SET instagram_user_id = ?, instagram_username = ?, access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        [instagram_user_id, instagram_username, access_token, user_id]
      );
    } else {
      // 新規登録
      await connection.execute(
        "INSERT INTO instagram_user (user_id, instagram_user_id, instagram_username, access_token) VALUES (?, ?, ?, ?)",
        [user_id, instagram_user_id, instagram_username, access_token]
      );
    }

    await connection.end();
    return NextResponse.json({ message: "データを保存しました" }, { status: 200 });
  } catch (error) {
    console.error('データベースエラー:', error);
    return NextResponse.json({ error: "データベースエラー" }, { status: 500 });
  }
}

// Instagramユーザー情報を削除
export async function DELETE(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");
  if (!user_id) {
    return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM instagram_user WHERE user_id = ?", [user_id]);
    await connection.end();

    return NextResponse.json({ message: "データを削除しました" }, { status: 200 });
  } catch (error) {
    console.error('削除エラー:', error);
    return NextResponse.json({ error: "削除エラー" }, { status: 500 });
  }
}
