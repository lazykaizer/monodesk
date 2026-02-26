import StrategyClient from "@/components/dashboard/StrategyClient";
import StrategySkeleton from "@/components/dashboard/StrategySkeleton";
import { Suspense } from "react";

export default function StrategyPage() {
    return (
        <Suspense fallback={<StrategySkeleton />}>
            <StrategyClient />
        </Suspense>
    );
}
