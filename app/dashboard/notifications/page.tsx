import { Suspense } from "react";
import NotificationsClient from "@/components/dashboard/layout/NotificationsClient";
import NotificationsSkeleton from "@/components/dashboard/layout/NotificationsSkeleton";

export const metadata = {
    title: "Notifications | Monodesk",
    description: "View your system updates and activity history.",
};

export default function NotificationsPage() {
    return (
        <Suspense fallback={<NotificationsSkeleton />}>
            <NotificationsClient />
        </Suspense>
    );
}
