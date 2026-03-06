import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>
                            Your basic account information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={user?.email || ""} disabled className="bg-zinc-50 dark:bg-zinc-800" />
                            <p className="text-[10px] text-zinc-500 italic">Email cannot be changed on this platform.</p>
                        </div>
                    </CardContent>
                </Card>

                <ChangePasswordForm />

                <Card>
                    <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>
                            Configure application-wide settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Global settings and configuration will be available here soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

