import PersonaClient from "@/components/dashboard/persona/PersonaClient";
import PersonaSkeleton from "@/components/dashboard/persona/PersonaSkeleton";
import { Suspense } from "react";

export default function PersonaPage() {
    return (
        <div className="-m-8">
            <Suspense fallback={<PersonaSkeleton />}>
                <PersonaClient />
            </Suspense>
        </div>
    );
}
