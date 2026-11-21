const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scoopify.club';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/dashboard/', '/employee/', '/customer/'],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
