// middleware.ts
import { NextResponse } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired(function middleware() {
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"], // 認証が必要なルート
};
