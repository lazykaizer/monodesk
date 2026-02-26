import FinanceClient from "@/components/dashboard/FinanceClient";
import FinanceSkeleton from "@/components/dashboard/FinanceSkeleton";
import { CurrencyProvider } from "@/components/dashboard/CurrencyContext";
import { Suspense } from "react";

export default function FinancePage() {
    return (
        <div className="-m-8">
            <CurrencyProvider>
                <Suspense fallback={<FinanceSkeleton />}>
                    <FinanceClient />
                </Suspense>
            </CurrencyProvider>
        </div>
    );
}
