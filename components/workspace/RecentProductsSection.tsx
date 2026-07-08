"use client";

import { Package } from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import type { WorkspaceListItem } from "@/lib/workspace-home";

interface RecentProductsSectionProps {
  items: WorkspaceListItem[];
}

export function RecentProductsSection({ items }: RecentProductsSectionProps) {
  return (
    <WorkspaceSection
      title="Recent Products"
      description="Recently viewed or latest updates"
      href="/products"
    >
      {items.length === 0 ? (
        <WorkspaceEmpty message="No products yet." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <WorkspaceListRow
                href={item.href}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                leading={
                  item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package className="h-4 w-4" />
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </WorkspaceSection>
  );
}
