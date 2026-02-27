import FinanceClient from "@/components/dashboard/finance/FinanceClient";
import FinanceSkeleton from "@/components/dashboard/finance/FinanceSkeleton";
import { CurrencyProvider } from "@/components/dashboard/finance/CurrencyContext";
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
