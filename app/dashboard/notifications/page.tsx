import { Suspense } from "react";
import NotificationsClient from "@/components/dashboard/NotificationsClient";
import NotificationsSkeleton from "@/components/dashboard/NotificationsSkeleton";

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
