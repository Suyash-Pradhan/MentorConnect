
import { Icons } from "@/components/icons";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading application...</p>
    </div>
  );
}
