import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    company?: string;
    companyName?: string;
    dateOfBirth?: Date;
    profileImage?: string;
    password?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
        },
        company: {
            type: String,
        },
        companyName: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
        },
        profileImage: {
            type: String,
        },
        password: {
            type: String,
        },
    },
    { timestamps: true }
);

// Prevent mongoose form overwriting the model if it already exists
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
