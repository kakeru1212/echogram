import { NextResponse } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired(function middleware() {
  return NextResponse.next();
});

export const config = {
  matcher: [
    // 認可不要のパスを除外して、それ以外は認証必須
    // 除外: Auth0のエンドポイント, 一部のInstagram fetch API, Nextの静的アセット
    '/((?!api/auth|api/instagram/fetch/(?:business_discovery|insights)|_next/static|_next/image|favicon.ico).*)'
  ],
};
