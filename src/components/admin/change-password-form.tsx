"use client";

import React, { useActionState } from "react";
import { updatePasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthState } from "@/types/auth";

const initialState: AuthState = { error: undefined, success: undefined };

export function ChangePasswordForm() {
    const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                    Change your password to keep your account secure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4 max-w-md">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>

                    {state?.error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
                            <AlertCircle className="h-4 w-4" />
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900/50">
                            <CheckCircle2 className="h-4 w-4" />
                            {state.message}
                        </div>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
