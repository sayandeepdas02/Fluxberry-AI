import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Job from "@/models/Job"
import User from "@/models/User"
import Candidate from "@/models/Candidate"
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    try {
        const json = await req.json()
        const { questions, customFields, testEnabled, testDuration, passingScore, status, ...jobData } = json

        const shareableLink = status === "published" ? nanoid(10) : undefined

        const job = await Job.create({
            ...jobData,
            testEnabled,
            testDuration,
            passingScore,
            status,
            shareableLink,
            userId: user._id,
            questions: questions?.map((q: any, index: number) => ({
                questionText: q.text,
                optionA: q.options[0],
                optionB: q.options[1],
                optionC: q.options[2],
                optionD: q.options[3],
                correctAnswer: q.correctAnswer,
                order: index
            })),
            customFields: customFields?.map((f: any) => ({
                fieldName: f.name,
                fieldType: f.type,
                required: f.required
            }))
        })

        return NextResponse.json(job)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const jobs = await Job.find({ userId: user._id } as any).sort({ createdAt: -1 });

        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const candidateCount = await Candidate.countDocuments({ jobId: job._id } as any);
            return {
                ...job.toObject(),
                id: job._id.toString(),
                _count: { candidates: candidateCount }
            };
        }));

        return NextResponse.json(jobsWithCounts)
    } catch (error) {
        console.error("GET Jobs Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

