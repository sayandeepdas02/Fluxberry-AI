import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Job from "@/models/Job"
import Candidate from "@/models/Candidate"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 })

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return new NextResponse("User not found", { status: 404 })

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")

    // Find all jobs by this user
    const userJobs = await Job.find({ userId: user._id } as any).select('_id');
    const userJobIds = userJobs.map(j => j._id.toString());

    let filter: any = { jobId: { $in: userJobIds } };

    if (jobId) {
        if (!userJobIds.includes(jobId)) {
            return NextResponse.json([])
        }
        filter.jobId = jobId;
    }

    const candidates = await Candidate.find(filter)
        .populate('jobId', 'title testEnabled passingScore')
        .sort({ createdAt: -1 })
        .lean();

    // Transform to match expected format (jobId -> job)
    const formatted = candidates.map((c: any) => ({
        ...c,
        id: c._id.toString(),
        job: c.jobId,
        jobId: c.jobId?._id?.toString()
    }));

    return NextResponse.json(formatted)
}

