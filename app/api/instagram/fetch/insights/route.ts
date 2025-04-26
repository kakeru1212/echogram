import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import { format, toZonedTime } from "date-fns-tz";

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

// 今日から指定した日数前の日付を取得する関数
function getDateDaysAgo(days: number) {
	const now = new Date();
	const jstDate = toZonedTime(now, "Asia/Tokyo");
	jstDate.setDate(jstDate.getDate() - days);
	return format(jstDate, "yyyy-MM-dd", { timeZone: "Asia/Tokyo" });
}

interface InstagramUser extends RowDataPacket {
	user_id: string;
	instagram_username: string;
	instagram_user_id: string;
	access_token: string;
}

// 各ユーザーのInstagramデータを取得する関数
async function fetchAndSaveInstagramData(connection: mysql.Connection, user: InstagramUser) {
	try {
		const { user_id, instagram_username, instagram_user_id, access_token } = user;
		const version = process.env.INSTAGRAM_VERSION;

		// フォロワーの人口統計学的特性（follower_demographics）
		const demographicsWeekUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=follower_demographics&period=lifetime&timeframe=this_week&metric_type=total_value&breakdown=age,gender&access_token=${access_token}`;
		const demographicsMonthUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=follower_demographics&period=lifetime&timeframe=this_month&metric_type=total_value&breakdown=age,gender&access_token=${access_token}`;

		// オンラインのフォロワー数（online_followers）
		const fourWeekSinceDate = getDateDaysAgo(10); // 初日を含む1週間+1日
		const fourWeekUntilDate = getDateDaysAgo(2);
		const onlineFollowersUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=online_followers&period=lifetime&timeframe=this_month&since=${fourWeekSinceDate}&until=${fourWeekUntilDate}&access_token=${access_token}`;

		const sinceDate = getDateDaysAgo(3);
		const untilDate = getDateDaysAgo(2);

		// リーチしたアカウント数（reach）
		const reachUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=reach&period=day&metric_type=total_value&breakdown=media_product_type&since=${sinceDate}&until=${untilDate}&access_token=${access_token}`;

		// 閲覧数（views）
		const viewsUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=views&period=day&metric_type=total_value&breakdown=media_product_type&since=${sinceDate}&until=${untilDate}&access_token=${access_token}`;

		// 外部リンクのタップ数（website_clicks）
		const websiteClicksUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=website_clicks&period=day&metric_type=total_value&since=${sinceDate}&until=${untilDate}&access_token=${access_token}`;

		// プロフィールへのアクセス数（profile_views）
		const profileViewsUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=profile_views&period=day&metric_type=total_value&since=${sinceDate}&until=${untilDate}&access_token=${access_token}`;

		// インタラクション数（いいね、コメント、シェアなどを含む）（total_interactions）
		const totalInteractionsUrl = `https://graph.facebook.com/${version}/${instagram_user_id}/insights?metric=total_interactions&period=day&metric_type=total_value&breakdown=media_product_type&since=${sinceDate}&until=${untilDate}&access_token=${access_token}`;

		// フォロワー数、メディア数（business_discovery）
		const businessDiscoveryUrl = `https://graph.facebook.com/${version}/${instagram_user_id}?fields=business_discovery.username(${instagram_username}){followers_count,media_count}&access_token=${access_token}`;

		const [businessDiscoveryResponse, demographicsWeekResponse, demographicsMonthResponse, onlineFollowersResponse, reachResponse, viewsResponse, websiteClicksResponse, profileViewsResponse, totalInteractionsResponse] = await Promise.all([
			fetch(businessDiscoveryUrl),
			fetch(demographicsWeekUrl),
			fetch(demographicsMonthUrl),
			fetch(onlineFollowersUrl),
			fetch(reachUrl),
			fetch(viewsUrl),
			fetch(websiteClicksUrl),
			fetch(profileViewsUrl),
			fetch(totalInteractionsUrl),
		]);

		if (!businessDiscoveryResponse.ok || !demographicsWeekResponse.ok || !demographicsMonthResponse.ok || !onlineFollowersResponse.ok || !reachResponse.ok || !viewsResponse.ok || !websiteClicksResponse.ok || !profileViewsResponse.ok || !totalInteractionsResponse.ok) {
			const errorDetails = {
				user_id,
				instagram_username,
				errors: {
					business_discovery: businessDiscoveryResponse.ok ? null : await businessDiscoveryResponse.json(),
					demographics_week: demographicsWeekResponse.ok ? null : await demographicsWeekResponse.json(),
					demographics_month: demographicsMonthResponse.ok ? null : await demographicsMonthResponse.json(),
					online_followers: onlineFollowersResponse.ok ? null : await onlineFollowersResponse.json(),
					reach: reachResponse.ok ? null : await reachResponse.json(),
					views: viewsResponse.ok ? null : await viewsResponse.json(),
					website_clicks: websiteClicksResponse.ok ? null : await websiteClicksResponse.json(),
					profile_views: profileViewsResponse.ok ? null : await profileViewsResponse.json(),
					total_interactions: totalInteractionsResponse.ok ? null : await totalInteractionsResponse.json(),
				}
			};
			return { success: false, error: errorDetails };
		}

		const businessDiscoveryData = await businessDiscoveryResponse.json();
		const demographicsWeekData = await demographicsWeekResponse.json();
		const demographicsMonthData = await demographicsMonthResponse.json();
		const onlineFollowersData = await onlineFollowersResponse.json();
		const reachData = await reachResponse.json();
		const viewsData = await viewsResponse.json();
		const websiteClicksData = await websiteClicksResponse.json();
		const profileViewsData = await profileViewsResponse.json();
		const totalInteractionsData = await totalInteractionsResponse.json();

		// 取得したデータをDBに保存
		const dataType = `business_discovery_${instagram_username}`;
		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
         VALUES (?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, dataType, JSON.stringify(businessDiscoveryData)]
		);

		await connection.execute(
			`INSERT INTO instagram_data (user_id, data_type, data) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "follower_demographics_week", JSON.stringify(demographicsWeekData)]
		);

		await connection.execute(
			`INSERT INTO instagram_data (user_id, data_type, data) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "follower_demographics_month", JSON.stringify(demographicsMonthData)]
		);

		await connection.execute(
			`INSERT INTO instagram_data (user_id, data_type, data) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "online_followers", JSON.stringify(onlineFollowersData)]
		);

		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
       VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "reach", JSON.stringify(reachData)]
		);

		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
       VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "views", JSON.stringify(viewsData)]
		);

		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
       VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "website_clicks", JSON.stringify(websiteClicksData)]
		);

		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
       VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "profile_views", JSON.stringify(profileViewsData)]
		);

		await connection.execute(
			`INSERT INTO instagram_chart (user_id, data_type, data, retrieved_at) 
       VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
			[user_id, "total_interactions", JSON.stringify(totalInteractionsData)]
		);

	} catch (error) {
		console.error("error:", error);
	}
}

export async function GET() {
	try {
		const connection = await mysql.createConnection(dbConfig);

		// すべてのユーザー情報を取得
		const [rows] = await connection.execute<InstagramUser[]>(
			"SELECT user_id, instagram_username, instagram_user_id, access_token FROM instagram_user"
		);

		if (!Array.isArray(rows) || rows.length === 0) {
			await connection.end();
			return NextResponse.json({ error: "No Instagram users found" }, { status: 404 });
		}

		// 各ユーザーのデータを取得
		const results = [];
		for (const user of rows) {
			const result = await fetchAndSaveInstagramData(connection, user);
			results.push({
				user_id: user.user_id,
				instagram_username: user.instagram_username,
				result
			});
		}

		await connection.end();
		return NextResponse.json({ success: true, results });

	} catch (error) {
		console.error("Error in GET handler:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}