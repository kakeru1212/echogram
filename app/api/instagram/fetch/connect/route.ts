import { NextRequest, NextResponse } from "next/server";

// 接続テスト
export async function GET(req: NextRequest) {
	try {
		const version = process.env.INSTAGRAM_VERSION;
		const { searchParams } = new URL(req.url);
		const instagram_username = searchParams.get("instagram_username");
		const user_id = searchParams.get("user_id");
		const access_token = searchParams.get("access_token");

		if (!instagram_username) {
			return NextResponse.json({ error: "Instagram Username is required" }, { status: 400 });
		} else if (!user_id) {
			return NextResponse.json({ error: "Instagram User ID is required" }, { status: 400 });
		} else if (!access_token) {
			return NextResponse.json({ error: "Access Token is required" }, { status: 400 });
		}

		// Instagram接続情報取得
		const connectionUrl = `https://graph.facebook.com/${version}/${user_id}?fields=business_discovery.username(${instagram_username}){id}&access_token=${access_token}`;

		const response = await fetch(connectionUrl);
		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json(
				{ error: "Instagram API error", details: errorData },
				{ status: response.status }
			);
		}

		const jsonData = await response.json();
		if (!jsonData.business_discovery?.id) {
			return NextResponse.json(
				{ error: "Business discovery ID not found", details: jsonData },
				{ status: 404 }
			);
		}

		const business_discovery_id = jsonData.business_discovery.id;
		return NextResponse.json({ success: true, business_discovery_id }, { status: 200 });

	} catch (error) {
		console.error("Business discovery error:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}
