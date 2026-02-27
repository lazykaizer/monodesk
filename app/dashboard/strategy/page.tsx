import StrategyClient from "@/components/dashboard/strategy/StrategyClient";
import StrategySkeleton from "@/components/dashboard/strategy/StrategySkeleton";
import { Suspense } from "react";

export default function StrategyPage() {
    return (
        <Suspense fallback={<StrategySkeleton />}>
            <StrategyClient />
        </Suspense>
    );
}
