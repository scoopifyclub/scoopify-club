export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.com';

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/careers`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/signup`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/signin`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];

    // Service area pages (for local SEO)
    const serviceAreas = [
        'denver', 'boulder', 'aurora', 'lakewood', 'fort-collins', 
        'colorado-springs', 'arvada', 'westminster', 'pueblo', 'greeley'
    ];

    const areaPages = serviceAreas.map(area => ({
        url: `${baseUrl}/services/${area}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [...staticPages, ...areaPages];
} 