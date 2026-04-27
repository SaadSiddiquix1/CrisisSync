import { Sidebar } from "@/components/sidebar";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireRole(["admin"], "/admin/dashboard");

    return (
        <div className="app-shell">
            <Sidebar role="admin" />
            <main className="min-h-screen lg:pl-[288px]">
                <div className="px-4 pb-6 pt-24 lg:px-8 lg:pb-8 lg:pt-8">{children}</div>
            </main>
        </div>
    );
}
