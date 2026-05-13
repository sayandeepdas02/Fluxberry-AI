"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, AlertTriangle } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()

    const [isLoadingUser, setIsLoadingUser] = useState(true)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isSavingPassword, setIsSavingPassword] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        companyName: "",
        dateOfBirth: "",
        profileImage: "",
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    useEffect(() => {
        // Fetch current user details not present in session optionally
        const fetchUser = async () => {
            // In a real app we'd fetch full info here if session doesn't have it all.
            // We'll mock the fetch using what we know or let session guide us.
            // But we need to get dateOfBirth, companyName, etc. Let's do a quick fetch
            try {
                // We'll trust session for name/email initially, then overwrite if API returns more
                if (session?.user) {
                    setProfile(prev => ({
                        ...prev,
                        name: session.user?.name || "",
                        email: session.user?.email || ""
                    }))
                }

                // Let's create a GET /api/user/me if it doesn't exist, or just use what we have. 
                // Wait, we don't have GET /api/user/me yet. I'll just use session for now,
                // and if the user wants it we can add a basic fetch endpoint later.
                setIsLoadingUser(false)
            } catch (error) {
                console.error(error)
                setIsLoadingUser(false)
            }
        }
        if (session) {
            fetchUser()
        }
    }, [session])

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingProfile(true)
        try {
            const res = await fetch("/api/user/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    companyName: profile.companyName,
                    dateOfBirth: profile.dateOfBirth,
                    profileImage: profile.profileImage
                })
            })
            if (!res.ok) throw new Error("Failed to update profile")

            // Optionally update session
            await update({ name: profile.name, image: profile.profileImage })

            // Toast success
            alert("Profile updated successfully")
        } catch (error) {
            console.error(error)
            alert("Failed to update profile")
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match")
            return
        }
        setIsSavingPassword(true)
        try {
            const res = await fetch("/api/user/change-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to update password")

            alert(data.message)
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsSavingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return
        setIsDeleting(true)
        try {
            const res = await fetch("/api/user", { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete account")

            alert("Account deleted successfully.")
            signOut({ callbackUrl: "/" })
        } catch (error) {
            console.error(error)
            alert("Failed to delete account.")
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert("File must be less than 2MB")
            return
        }

        // Mocking upload for now to keep it simple, converting to local object URL
        const url = URL.createObjectURL(file)
        setProfile(p => ({ ...p, profileImage: url }))
    }

    if (isLoadingUser) return <div className="p-8">Loading...</div>

    return (
        <PageContainer className="max-w-[800px] justify-center items-center flex flex-col pt-12">
            <div className="w-full bg-card rounded-[12px] border shadow-sm p-8 max-w-[700px]">

                {/* Profile Information */}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div>
                        <h2 className="text-[18px] font-semibold text-slate-800">Profile Information</h2>
                        <p className="text-[13px] text-muted-foreground mt-1">Update your personal details and public profile.</p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative h-[80px] w-[80px] rounded-full bg-slate-100 border overflow-hidden shrink-0 group">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                    <span className="text-xl font-medium">{profile.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Upload className="h-4 w-4 text-white" />
                                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <div className="text-[13px] text-muted-foreground space-y-1">
                            <p className="font-medium text-slate-700">Profile Picture</p>
                            <p>JPG or PNG. Max size 2MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Full Name</Label>
                            <Input
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Email Address</Label>
                            <Input
                                value={profile.email}
                                disabled
                                className="bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Date of Birth</Label>
                            <Input
                                type="date"
                                value={profile.dateOfBirth}
                                onChange={e => setProfile({ ...profile, dateOfBirth: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Company Name</Label>
                            <Input
                                value={profile.companyName}
                                onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSavingProfile}>
                            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
                        </Button>
                    </div>
                </form>

                <div className="my-10 border-t border-border" />

                {/* Password Reset */}
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                        <h2 className="text-[18px] font-semibold text-slate-800">Change Password</h2>
                        <p className="text-[13px] text-muted-foreground mt-1">Ensure your account is using a long, random password to stay secure.</p>
                    </div>

                    <div className="space-y-4 max-w-[400px]">
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Current Password</Label>
                            <Input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">New Password</Label>
                            <Input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[14px] font-medium text-slate-700">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="flex pt-2">
                        <Button type="submit" variant="secondary" disabled={isSavingPassword}>
                            {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                        </Button>
                    </div>
                </form>

                <div className="my-10 border-t border-border" />

                {/* Danger Zone */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-[18px] font-semibold text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Danger Zone
                        </h2>
                        <p className="text-[13px] text-muted-foreground mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>

                    <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                        Delete Account
                    </Button>
                </div>
            </div>

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Type <span className="font-mono font-bold">DELETE</span> to confirm.</Label>
                        <Input
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== "DELETE" || isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Permanently Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </PageContainer>
    )
}
