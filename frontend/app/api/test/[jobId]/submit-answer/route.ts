import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Job from "@/models/Job"
import Candidate from "@/models/Candidate"

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const json = await req.json()
    const { candidateId, questionId, answer } = json

    await connectDB();

    // Check correctness
    // Find job containing the question
    const job = await Job.findOne({ "questions._id": questionId }, { "questions.$": 1 });

    if (!job || !job.questions || job.questions.length === 0) {
        return new NextResponse("Question not found", { status: 404 })
    }

    const question = job.questions[0];
    const isCorrect = question.correctAnswer === answer

    // Safely remove any previous answer for this question
    await Candidate.findByIdAndUpdate(candidateId, {
        $pull: {
            answers: { questionId }
        }
    });

    await Candidate.findByIdAndUpdate(candidateId, {
        $push: {
            answers: {
                questionId,
                selectedAnswer: answer,
                isCorrect,
                timeTaken: 0
            }
        }
    })

    return NextResponse.json({ success: true })
}

