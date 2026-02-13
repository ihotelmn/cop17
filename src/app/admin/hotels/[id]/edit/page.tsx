import { getHotel } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import EditHotelForm from "./edit-form";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hotel = await getHotel(id);

    if (!hotel) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <h2 className="text-3xl font-bold tracking-tight text-white">Edit Hotel: {hotel.name}</h2>
            </div>
            <EditHotelForm hotel={hotel} />
        </div>
    );
}
