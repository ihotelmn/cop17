import { getUsers, deleteUser } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, Shield, ShieldAlert, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">User Management</h2>
                    <p className="text-zinc-400">Manage system administrators and staff accounts.</p>
                </div>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    <Link href="/admin/users/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New User
                    </Link>
                </Button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">All Users</CardTitle>
                    <CardDescription>List of all registered users and their roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Full Name</TableHead>
                                <TableHead className="text-zinc-400">Email</TableHead>
                                <TableHead className="text-zinc-400">Role</TableHead>
                                <TableHead className="text-zinc-400">Organization</TableHead>
                                <TableHead className="text-zinc-400">Created At</TableHead>
                                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                {user.full_name || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-300">{user.email}</TableCell>
                                        <TableCell>
                                            <RoleBadge role={user.role} />
                                        </TableCell>
                                        <TableCell className="text-zinc-300">{user.organization || "-"}</TableCell>
                                        <TableCell className="text-zinc-400 text-xs">
                                            {format(new Date(user.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form action={async () => {
                                                "use server";
                                                await deleteUser(user.id);
                                            }}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                    type="submit"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const styles = {
        admin: "bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/40",
        vip: "bg-amber-900/30 text-amber-400 border-amber-900/50 hover:bg-amber-900/40",
        guest: "bg-blue-900/30 text-blue-400 border-blue-900/50 hover:bg-blue-900/40",
    };
    const icon = {
        admin: <ShieldAlert className="mr-1 h-3 w-3" />,
        vip: <Shield className="mr-1 h-3 w-3" />,
        guest: <User className="mr-1 h-3 w-3" />,
    }

    const className = styles[role as keyof typeof styles] || "bg-zinc-800 text-zinc-400";

    return (
        <Badge variant="outline" className={`${className} px-2 py-0.5`}>
            {icon[role as keyof typeof icon]}
            {role.toUpperCase()}
        </Badge>
    );
}
