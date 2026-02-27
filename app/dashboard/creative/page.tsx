import CreativeClient from "@/components/dashboard/creative/CreativeClient";
import CreativeSkeleton from "@/components/dashboard/creative/CreativeSkeleton";
import { Suspense } from "react";

export default function CreativePage() {
    return (
        <div className="h-full flex flex-col">
            <Suspense fallback={<CreativeSkeleton />}>
                <CreativeClient />
            </Suspense>
        </div>
    );
}
