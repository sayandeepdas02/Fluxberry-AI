import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Candidate from "@/models/Candidate"
import Job from "@/models/Job"

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const { jobId, customFields, ...data } = json

        await connectDB();

        // Validate job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return new NextResponse("Job not found", { status: 404 })
        }

        const candidate = await Candidate.create({
            ...data,
            jobId,
            customFields
        })

        return NextResponse.json(candidate)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

