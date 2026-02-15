import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Job from "@/models/Job"

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params

    await connectDB();

    const job = await Job.findById(jobId).select("questions");

    if (!job) {
        return new NextResponse("Job not found", { status: 404 })
    }

    const questions = job.questions.map((q: any) => ({
        id: q._id.toString(),
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        timeLimit: q.timeLimit,
        order: q.order
    })).sort((a: any, b: any) => a.order - b.order)

    return NextResponse.json({ questions })
}

