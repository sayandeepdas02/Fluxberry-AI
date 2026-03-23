import connectDB from "@/lib/db"
import Job from "@/models/Job"
import { notFound } from "next/navigation"
import { ApplicationForm } from "@/components/candidate/application-form"
import { TestInterface } from "@/components/candidate/test-interface"
import { Separator } from "@/components/ui/separator"
import ClientWrapper from "./client-wrapper"

interface PageProps {
    params: Promise<{
        shareableLink: string
    }>
}

export default async function JobApplicationPage({ params }: PageProps) {
    const { shareableLink } = await params

    await connectDB();

    const jobDoc = JSON.parse(JSON.stringify(await Job.findOne({ shareableLink }).lean()));

    if (!jobDoc) {
        notFound()
    }

    const job = {
        ...jobDoc,
        id: jobDoc._id,
        questions: jobDoc.questions?.map((q: any) => ({ ...q, id: q._id })) || [],
        customFields: jobDoc.customFields?.map((f: any) => ({ ...f, id: f._id })) || []
    }


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{job.title}</h1>
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                        <span>{job.roleType}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.experienceLevel}</span>
                    </div>
                </div>

                <div className="prose max-w-none text-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900">About the Role</h3>
                    <p className="whitespace-pre-wrap">{job.description}</p>
                </div>

                <Separator />

                {/* Client Side Logic for switching between Form and Test */}
                <ClientWrapper
                    job={job}
                />
            </div>
        </div>
    )
}
