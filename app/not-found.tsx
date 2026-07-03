import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={PackageSearch}
        title="Page not found"
        description="The product or page you're looking for doesn't exist in this MVP workspace."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/dashboard">Go to Dashboard</Button>
            <Button href="/products" variant="secondary">
              Browse Products
            </Button>
          </div>
        }
      />
    </div>
  );
}
