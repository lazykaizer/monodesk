"use client";

import ValidatorClient from "@/components/dashboard/ValidatorClient";
import ValidatorSkeleton from "@/components/dashboard/ValidatorSkeleton";
import { Suspense, useEffect, useRef } from "react";



export default function ValidatorPage() {
    return (
        <div className="relative h-full flex flex-col text-white">
            <div className="relative z-10">
                <Suspense fallback={<ValidatorSkeleton />}>
                    <ValidatorClient />
                </Suspense>
            </div>
        </div>
    );
}
