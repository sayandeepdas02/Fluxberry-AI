import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Find and delete the user
        const deletedUser = await User.findOneAndDelete({ email: session.user.email });

        if (!deletedUser) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        // Optionally, one might want to delete associated data (jobs, applications, etc.)
        // For simplicity and safety right now, we just remove the user document.

        return NextResponse.json({ message: "Account deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
