import TrendsClient from "@/components/dashboard/trends/TrendsClient";
import TrendsSkeleton from "@/components/dashboard/trends/TrendsSkeleton";
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
