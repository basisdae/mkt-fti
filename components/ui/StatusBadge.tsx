import { Badge } from "@/components/ui/Badge";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getStatusColor } from "@/lib/utils";
import type { ProductStatus } from "@/types/product";

interface StatusBadgeProps {
  status: ProductStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = getStatusColor(status);

  return (
    <Badge variant={colors.badge} className={colors.bg}>
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}
