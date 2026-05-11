import type { Metadata } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

async function fetchCompanyMeta(slug: string) {
    try {
        const res = await fetch(`${API_BASE}/public/companies/${slug}`, { next: { revalidate: 3600 } })
        return res.ok ? (await res.json()).data : null
    } catch {
        return null
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ companySlug: string }> }
): Promise<Metadata> {
    const { companySlug } = await params
    const company = await fetchCompanyMeta(companySlug)

    if (!company) {
        return { title: 'Careers' }
    }

    const title = `Careers at ${company.name}`
    const description = `Join ${company.name}. Browse open roles and apply today.`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fluxberry.ai'
    const canonicalUrl = `${appUrl}/${companySlug}/careers`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'website',
            images: company.logoUrl ? [{ url: company.logoUrl, alt: company.name }] : [],
            siteName: company.name,
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: company.logoUrl ? [company.logoUrl] : [],
        },
        alternates: {
            canonical: canonicalUrl,
        },
    }
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
