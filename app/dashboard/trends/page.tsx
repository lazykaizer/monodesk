import TrendsClient from "@/components/dashboard/TrendsClient";
import TrendsSkeleton from "@/components/dashboard/TrendsSkeleton";
import { Suspense } from "react";

export default function TrendsPage() {
    return (
        <div className="h-full flex flex-col">
            <Suspense fallback={<TrendsSkeleton />}>
                <TrendsClient />
            </Suspense>
        </div>
    );
}
