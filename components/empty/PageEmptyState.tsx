import Link from "next/link";
import { Building2, Lightbulb, Package, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface PageEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageEmptyState({
  icon,
  title,
  description,
  className,
  children,
}: PageEmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-[#EEF0F6]", className)}>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={children}
      />
    </Card>
  );
}

export function DashboardEmptyState() {
  return (
    <PageEmptyState
      icon={Package}
      title="ยังไม่มีข้อมูล"
      description="เริ่มต้นด้วยการเพิ่ม Supplier สินค้า หรือ Product Idea เพื่อสร้างข้อมูลในระบบ"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link href="/suppliers/new">
          <Button variant="secondary" className="w-full gap-2 sm:w-auto">
            <Building2 className="h-4 w-4" />
            เพิ่ม Supplier
          </Button>
        </Link>
        <Link href="/products/new">
          <Button className="w-full gap-2 sm:w-auto">
            <Package className="h-4 w-4" />
            เพิ่มสินค้า
          </Button>
        </Link>
        <Link href="/ideas">
          <Button variant="ghost" className="w-full gap-2 sm:w-auto">
            <Lightbulb className="h-4 w-4" />
            เพิ่ม Product Idea
          </Button>
        </Link>
      </div>
    </PageEmptyState>
  );
}
