import RoadmapClient from "@/components/dashboard/RoadmapClient";
import RoadmapSkeleton from "@/components/dashboard/RoadmapSkeleton";
import { Suspense } from "react";

export default function RoadmapPage() {
    return (
        <div className="-m-8">
            <Suspense fallback={<RoadmapSkeleton />}>
                <RoadmapClient />
            </Suspense>
        </div>
    );
}
