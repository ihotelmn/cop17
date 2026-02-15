"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitGroupRequestAction, GroupRequestState } from "@/app/actions/group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Building2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
        >
            {pending ? "Submitting Request..." : "Submit Group Request"}
        </Button>
    );
}

export function GroupRequestForm() {
    const [state, setState] = useState<GroupRequestState>({});
    const [checkIn, setCheckIn] = useState<Date>();
    const [checkOut, setCheckOut] = useState<Date>();

    async function handleSubmit(formData: FormData) {
        // Ensure dates are included if selected (though hidden inputs handle this naturally)
        if (checkIn) formData.set("checkIn", format(checkIn, "yyyy-MM-dd"));
        if (checkOut) formData.set("checkOut", format(checkOut, "yyyy-MM-dd"));

        const result = await submitGroupRequestAction(state, formData);
        setState(result);
        if (result.success) {
            toast.success("Group request submitted successfully!");
            // Optional: Redirect or clear form
        } else if (result.error) {
            toast.error(result.error);
        }
    }

    if (state.success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-800/30 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Request Received!</h3>
                <p className="text-zinc-500 mb-6 max-w-md">
                    Thank you for your interest in COP17 Mongolia. Our group reservation specialists have received your details and will contact you within 24 hours with a tailored proposal.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl font-bold">
                    Submit Another Request
                </Button>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Organization Details
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name *</Label>
                        <Input id="organizationName" name="organizationName" placeholder="e.g. Acme Corp Delegation" required className="rounded-xl h-11" />
                        {state.fieldErrors?.organizationName && <p className="text-red-500 text-xs">{state.fieldErrors.organizationName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Person *</Label>
                            <Input id="contactName" name="contactName" placeholder="Full Name" required className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Phone / WhatsApp *</Label>
                            <Input id="contactPhone" name="contactPhone" placeholder="+1 234..." required className="rounded-xl h-11" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Email Address *</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" placeholder="official@organization.com" required className="rounded-xl h-11" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-blue-600" />
                        Stay Requirements
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="guestCount">Estimated Guests *</Label>
                        <Input id="guestCount" name="guestCount" type="number" min="5" placeholder="Total delegates" required className="rounded-xl h-11" />
                        <p className="text-[10px] text-zinc-400 pl-1">Min. 5 guests for group rates</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label>Check-in Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-normal rounded-xl",
                                            !checkIn && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {checkIn ? format(checkIn, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={checkIn}
                                        onSelect={setCheckIn}
                                        initialFocus
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                            <input type="hidden" name="checkIn" value={checkIn ? format(checkIn, "yyyy-MM-dd") : ""} />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Check-out Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-normal rounded-xl",
                                            !checkOut && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {checkOut ? format(checkOut, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={checkOut}
                                        onSelect={setCheckOut}
                                        initialFocus
                                        disabled={(date) => date < (checkIn || new Date())}
                                    />
                                </PopoverContent>
                            </Popover>
                            <input type="hidden" name="checkOut" value={checkOut ? format(checkOut, "yyyy-MM-dd") : ""} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budgetRange">Budget Preference</Label>
                        <Input id="budgetRange" name="budgetRange" placeholder="e.g. $150-$250 per night" className="rounded-xl h-11" />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Additional Information
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="specialRequirements">Special Requests / Preferred Hotel</Label>
                    <Textarea
                        id="specialRequirements"
                        name="specialRequirements"
                        placeholder="Please specify if you need meeting rooms, VIP transport, or have a specific hotel in mind..."
                        className="rounded-xl min-h-[100px] p-4"
                    />
                </div>
            </div>

            {state.error && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {state.error}
                </div>
            )}

            <SubmitButton />
            <p className="text-center text-xs text-zinc-400 mt-4">
                By submitting this form, you agree to our group booking terms and policies.
            </p>
        </form>
    );
}
