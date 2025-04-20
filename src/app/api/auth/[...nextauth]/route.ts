import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

console.log('NextAuth route initialized with auth config:', {
  providers: authOptions.providers.map(p => p.id),
  session: authOptions.session,
  pages: authOptions.pages,
  secret: !!authOptions.secret,
  debug: authOptions.debug,
  callbacks: Object.keys(authOptions.callbacks || {})
});

// Verify that the auth options are correctly configured for admin login
if (authOptions.providers[0].id === 'credentials') {
  console.log('Credentials provider is configured correctly');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 