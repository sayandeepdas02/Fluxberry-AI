import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { TestService } from "@/services/testService"

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    try {
        const json = await req.json()
        const { candidateId, tabSwitchCount } = json
        const { jobId } = await params

        await connectDB();

        const result = await TestService.submitTest(candidateId, jobId, tabSwitchCount);

        return NextResponse.json(result)
    } catch (error: any) {
        if (error.message === "Candidate or Job not found") {
            return new NextResponse("Not found", { status: 404 })
        }
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

