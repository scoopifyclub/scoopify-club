const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.com';

export default async function sitemap() {
    const lastModified = new Date();

    const routes = [
        { path: '', priority: 1.0, changeFrequency: 'weekly' },
        { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
        { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
        { path: '/quote', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/signup', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
        { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
        { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
        { path: '/careers', priority: 0.4, changeFrequency: 'monthly' },
        { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    ];

    return routes.map(({ path, priority, changeFrequency }) => ({
        url: `${siteUrl}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
