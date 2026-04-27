import { Sidebar } from "@/components/sidebar";
import { requireRole } from "@/lib/auth";

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireRole(["staff", "admin"], "/staff/dashboard");

    return (
        <div className="app-shell">
            <Sidebar role="staff" />
            <main className="min-h-screen lg:pl-[288px]">
                <div className="px-4 pb-6 pt-24 lg:px-8 lg:pb-8 lg:pt-8">{children}</div>
            </main>
        </div>
    );
}
