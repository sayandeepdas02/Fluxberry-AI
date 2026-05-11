import type { Metadata } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

async function fetchJobMeta(companySlug: string, jobId: string) {
    try {
        const [jobRes, companyRes] = await Promise.all([
            fetch(`${API_BASE}/public/jobs/${jobId}`, { next: { revalidate: 300 } }),
            fetch(`${API_BASE}/public/companies/${companySlug}`, { next: { revalidate: 3600 } }),
        ])
        const job = jobRes.ok ? (await jobRes.json()).data : null
        const company = companyRes.ok ? (await companyRes.json()).data : null
        return { job, company }
    } catch {
        return { job: null, company: null }
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ companySlug: string; jobId: string }> }
): Promise<Metadata> {
    const { companySlug, jobId } = await params
    const { job, company } = await fetchJobMeta(companySlug, jobId)

    if (!job || !company) {
        return { title: 'Job Not Found' }
    }

    const title = `${job.title} at ${company.name}`
    const description = job.description
        ? job.description.replace(/<[^>]+>/g, '').slice(0, 160).trim()
        : `Apply for ${job.title} at ${company.name}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fluxberry.ai'
    const canonicalUrl = `${appUrl}/${companySlug}/careers/${jobId}`

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

export default function JobLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
