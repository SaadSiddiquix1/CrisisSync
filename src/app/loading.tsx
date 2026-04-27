import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="app-shell min-h-screen px-4 pb-12 pt-24 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}
