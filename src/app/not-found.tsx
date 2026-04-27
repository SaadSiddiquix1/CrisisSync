import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you requested does not exist.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/" className="flex-1"><Button className="h-11 w-full">Go home</Button></Link>
          <Link href="/admin/dashboard" className="flex-1"><Button variant="outline" className="h-11 w-full">Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
