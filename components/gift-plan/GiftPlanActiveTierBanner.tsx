"use client";

import { formatGiftMoney } from "@/lib/gift-plan-format";

interface GiftPlanActiveTierBannerProps {
  tierName: string;
  customerCount: number;
  actualPerCustomer: number;
  estimatedPerCustomer: number;
  totalActual: number;
}

export function GiftPlanActiveTierBanner({
  tierName,
  customerCount,
  actualPerCustomer,
  estimatedPerCustomer,
  totalActual,
}: GiftPlanActiveTierBannerProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-light-purple/40 px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900">
        กำลังเลือกของให้: Tier {tierName}
      </p>
      <dl className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-gray-400">ลูกค้า</dt>
          <dd className="font-medium text-gray-800">
            {customerCount.toLocaleString()} ราย
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">ต้นทุนต่อคน</dt>
          <dd className="font-medium text-gray-800">
            {formatGiftMoney(actualPerCustomer)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">มูลค่าต่อคน</dt>
          <dd className="font-medium text-gray-800">
            {formatGiftMoney(estimatedPerCustomer)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">ต้นทุนรวม Tier</dt>
          <dd className="font-medium text-gray-800">
            {formatGiftMoney(totalActual)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
