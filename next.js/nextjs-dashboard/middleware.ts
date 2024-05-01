import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// initializing NextAuth.js
export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // the protected routes will not even start rendering until the Middleware verifies the authentication
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
