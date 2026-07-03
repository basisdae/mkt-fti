"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SupplierListCard } from "@/components/supplier/SupplierListCard";
import { getProducts, getSuppliers } from "@/lib/mock-data";
import { countLinkedProducts, matchesSupplierSearch } from "@/lib/supplier";

export function SuppliersListView() {
  const [query, setQuery] = useState("");

  const suppliers = useMemo(() => getSuppliers(), []);
  const products = useMemo(() => getProducts(), []);

  const filtered = useMemo(() => {
    const list = suppliers.filter((s) => matchesSupplierSearch(s, query));
    return [...list].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [suppliers, query]);

  return (
    <div className="page-shell">
      <div className="page-header-block flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Suppliers / Factories</h1>
          <p className="page-description">
            Factory master records — link products to shared supplier data
          </p>
        </div>
        <Link href="/suppliers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Register supplier
          </Button>
        </Link>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search factory, region, category..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center">
          <p className="text-sm text-gray-500">No suppliers match your search</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((supplier) => (
            <SupplierListCard
              key={supplier.id}
              supplier={supplier}
              linkedProductCount={countLinkedProducts(supplier.id, products)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
