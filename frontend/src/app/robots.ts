import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://foldexa.com' // TODO: Replace with your actual domain

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            // disallow: '/private/', // Add disallowed paths here if needed
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
