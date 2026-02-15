import connectDB from "@/lib/db"
import User from "@/models/User"
import { userRegisterSchema } from "@/lib/validations/auth"
import { hash } from "bcrypt"
import { NextResponse } from "next/server"
import * as z from "zod"

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const body = userRegisterSchema.parse(json)

        await connectDB();

        const exists = await User.findOne({ email: body.email });

        if (exists) {
            return new NextResponse("User already exists", { status: 409 })
        }

        const hashedPassword = await hash(body.password, 10)

        const user = await User.create({
            name: body.name,
            email: body.email,
            company: body.company,
            password: hashedPassword,
        })

        // Remove password from response
        const { password, ...result } = user.toObject();

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error(error)
        return new NextResponse(null, { status: 500 })
    }
}

