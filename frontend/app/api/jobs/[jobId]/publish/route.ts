import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Job from "@/models/Job"
import { nanoid } from 'nanoid'

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 })

    const { jobId } = await params

    await connectDB();

    const job = await Job.findById(jobId);

    if (!job) return new NextResponse("Job not found", { status: 404 })

    // Generate link if not exists
    const shareableLink = job.shareableLink || nanoid(10)

    const updated = await Job.findByIdAndUpdate(
        jobId,
        {
            status: "published",
            shareableLink
        },
        { new: true }
    )

    return NextResponse.json(updated)
}

