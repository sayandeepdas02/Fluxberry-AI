import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, companyName, dateOfBirth, profileImage } = await req.json();

        // Basic validation
        if (name && name.length < 2) {
            return NextResponse.json({ message: "Name must be at least 2 characters long." }, { status: 400 });
        }
        if (companyName && companyName.length > 100) {
            return NextResponse.json({ message: "Company name is too long." }, { status: 400 });
        }

        await dbConnect();

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (companyName !== undefined) updateData.companyName = companyName;
        // Also update standard company field for backwards compatibility if needed
        if (companyName !== undefined) updateData.company = companyName;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateData },
            { new: true }
        ).select("-password").lean();

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser, message: "Profile updated successfully." });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
