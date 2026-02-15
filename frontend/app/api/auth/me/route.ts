import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/route"
import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select("-password");

    if (!user) {
        return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
}

