import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Job from "@/models/Job"
import Candidate from "@/models/Candidate"

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const json = await req.json()
    const { candidateId } = json
    const { jobId } = await params

    await connectDB();

    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
        return new NextResponse("Not found", { status: 404 })
    }

    let correctCount = 0
    candidate.answers.forEach((ans: any) => {
        if (ans.isCorrect) correctCount++
    })

    // Ensure we don't divide by zero if no questions (though logically valid job should have questions)
    const totalQuestions = job.questions.length || 1;
    const score = (correctCount / totalQuestions) * 100
    const passingScore = job.passingScore || 70;

    // Update candidate
    candidate.testScore = score;
    candidate.testPassed = score >= passingScore;
    await candidate.save();

    return NextResponse.json({ score, passed: candidate.testPassed })
}

