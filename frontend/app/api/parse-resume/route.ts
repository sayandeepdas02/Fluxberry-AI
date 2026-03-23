import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        // Must consume the stream otherwise it hangs!
        const formData = await req.formData();
        const file = formData.get("file");

        // Mock response for now
        return NextResponse.json({
            details: {
                email: "candidate@example.com",
                phone: "+1234567890",
                skills: ["React", "Node.js", "TypeScript"],
                experience: "5 years"
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
