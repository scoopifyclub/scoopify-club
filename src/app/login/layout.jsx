export const metadata = {
    title: 'Sign In',
    description: 'Sign in to your Scoopify Club account to manage weekly dog waste removal service.',
    robots: { index: false, follow: false },
    openGraph: {
        title: 'Sign In | Scoopify Club',
        description: 'Sign in to manage your Scoopify Club dog waste removal service.',
        url: '/login',
    },
    twitter: {
        title: 'Sign In | Scoopify Club',
        description: 'Sign in to manage your Scoopify Club dog waste removal service.',
    },
};

export default function LoginLayout({ children }) {
    return children;
}
