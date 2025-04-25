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

export async function GET(req: NextRequest) {
	try {
		const version = process.env.INSTAGRAM_VERSION;
		const { searchParams } = new URL(req.url);
		const user_id = searchParams.get("user_id");
		const instagram_username = searchParams.get("instagram_username");
		const fields = searchParams.get("fields");

		if (!user_id) {
			return NextResponse.json({ error: "user_id is required" }, { status: 400 });
		} else if (!instagram_username) {
			return NextResponse.json({ error: "username is required" }, { status: 400 });
		} else if (!fields) {
			return NextResponse.json({ error: "fields parameter is required" }, { status: 400 });
		}

		const requiredFields = ["followers_count", "media_count"];
		const requestedFields = fields.split(",").map(field => field.trim());
		const hasAllRequiredFields = requiredFields.every(field => requestedFields.includes(field));

		// DB接続して `instagram_username` から Instagram 情報を取得
		const connection = await mysql.createConnection(dbConfig);
		const [rows] = await connection.execute(
			"SELECT instagram_user_id, access_token FROM instagram_user WHERE user_id = ?",
			[user_id]
		);
		if (!Array.isArray(rows) || rows.length === 0) {
			await connection.end();
			return NextResponse.json({ error: "Instagram user not found" }, { status: 404 });
		}

		const { instagram_user_id, access_token } = rows[0] as {
			instagram_user_id: string;
			access_token: string;
		};

		// フォロワー数、メディア数（business_discovery_{instagram_username}）
		const graphApiUrl = `https://graph.facebook.com/${version}/${instagram_user_id}?fields=business_discovery.username(${instagram_username}){${fields}}&access_token=${access_token}`;

		const apiResponse = await fetch(graphApiUrl);
		if (!apiResponse.ok) {
			const errorData = await apiResponse.json();
			await connection.end();
			return NextResponse.json({ error: "Graph API error", details: errorData }, { status: apiResponse.status });
		}
		const jsonData = await apiResponse.json();

		const dataType = `business_discovery_${instagram_username}`;

		if (hasAllRequiredFields) {
			await connection.execute(
				`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
         VALUES (?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
				[user_id, dataType, JSON.stringify(jsonData)]
			);
		}

		await connection.end();

		return NextResponse.json({
			message: "Data fetched" + (hasAllRequiredFields ? " and saved" : " (not saved, missing required fields)"),
			data: jsonData
		}, { status: 200 });

	} catch (error) {
		console.error("Business discovery error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
