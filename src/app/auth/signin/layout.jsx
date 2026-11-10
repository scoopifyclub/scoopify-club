export const metadata = {
    title: 'Sign In',
    description: 'Sign in to Scoopify Club to access your customer or scooper account.',
    robots: { index: false, follow: false },
    openGraph: {
        title: 'Sign In | Scoopify Club',
        description: 'Sign in to Scoopify Club to access your account.',
        url: '/auth/signin',
    },
    twitter: {
        title: 'Sign In | Scoopify Club',
        description: 'Sign in to Scoopify Club to access your account.',
    },
};

export default function AuthSignInLayout({ children }) {
    return children;
}
