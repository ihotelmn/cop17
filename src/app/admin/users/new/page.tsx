"use client";

import { createUser } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState = { error: "", fieldErrors: {} };

export default function NewUserPage() {
    const [state, formAction] = useActionState(createUser, initialState);

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight text-white">Create New User</h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
                <form action={formAction} className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="user@cop17.mn" required className="bg-zinc-800 border-zinc-700 text-white" />
                        {state?.fieldErrors?.email && <p className="text-red-500 text-sm">{state.fieldErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input id="password" name="password" type="password" placeholder="Min. 6 characters" required className="bg-zinc-800 border-zinc-700 text-white" />
                        {state?.fieldErrors?.password && <p className="text-red-500 text-sm">{state.fieldErrors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-zinc-300">Full Name</Label>
                        <Input id="fullName" name="fullName" placeholder="e.g. Bat-Erdene" required className="bg-zinc-800 border-zinc-700 text-white" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-zinc-300">Role</Label>
                        <Select name="role" defaultValue="admin">
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="admin">Tour Company (Hotel Admin)</SelectItem>
                                <SelectItem value="super_admin">Super Admin (Platform Owner)</SelectItem>
                                <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="organization" className="text-zinc-300">Organization (Optional)</Label>
                        <Input id="organization" name="organization" placeholder="e.g. Ministry of Environment" className="bg-zinc-800 border-zinc-700 text-white" />
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-4">
                        <Button variant="outline" asChild className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
        </Button>
    );
}
