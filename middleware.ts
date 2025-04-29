import { NextResponse } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired(function middleware() {
  return NextResponse.next();
});

export const config = {
  matcher: [
    // business_discovery ,insights へのパスは除外
    '/((?!api/instagram/fetch/(?:business_discovery|insights)).*)'
  ],
};
