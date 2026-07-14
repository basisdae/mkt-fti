"use client";

import Link from "next/link";
import { Building2, Package, Star } from "lucide-react";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
import { Card } from "@/components/ui/Card";
import { FavoriteStar } from "@/components/ui/FavoriteStar";
import { useFavorites } from "@/hooks/useFavorites";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";

export function FavoritesView() {
  const products = useLiveProducts();
  const { suppliers } = useSupplierStore();
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteProducts = products.filter((product) =>
    favorites.products.includes(product.id),
  );
  const favoriteSuppliers = suppliers.filter((supplier) =>
    favorites.suppliers.includes(supplier.id),
  );

  const empty =
    favoriteProducts.length === 0 && favoriteSuppliers.length === 0;

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Favorites</h1>
        <p className="page-description">
          Starred products and suppliers for quick access. Stored in this
          browser only.
        </p>
      </div>

      {empty ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Star className="h-8 w-8 text-amber-300" />
            <p className="text-sm font-medium text-gray-800">No favorites yet</p>
            <p className="max-w-sm text-xs text-gray-500">
              Tap the star on a product or supplier card to pin it here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package className="h-4 w-4 text-primary" />
              Products
              <span className="text-xs font-medium text-gray-400">
                {favoriteProducts.length}
              </span>
            </h2>
            {favoriteProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No favorite products.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {favoriteProducts.map((product) => (
                  <li key={product.id}>
                    <Card padding="sm" className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${product.id}`}
                          className="block hover:text-primary"
                        >
                          <ProductCardTitle as="span">
                            {product.name}
                          </ProductCardTitle>
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {product.code}
                          {product.supplier ? ` · ${product.supplier}` : ""}
                        </p>
                      </div>
                      <FavoriteStar
                        active
                        label={product.name}
                        onToggle={() =>
                          toggleFavorite("product", product.id)
                        }
                        className="shadow-none"
                      />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Building2 className="h-4 w-4 text-primary" />
              Suppliers
              <span className="text-xs font-medium text-gray-400">
                {favoriteSuppliers.length}
              </span>
            </h2>
            {favoriteSuppliers.length === 0 ? (
              <p className="text-sm text-gray-500">No favorite suppliers.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {favoriteSuppliers.map((supplier) => (
                  <li key={supplier.id}>
                    <Card padding="sm" className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-primary"
                        >
                          {supplier.factoryName}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {[
                            supplier.cityDistrict,
                            supplier.provinceRegion,
                            supplier.country,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <FavoriteStar
                        active
                        label={supplier.factoryName}
                        onToggle={() =>
                          toggleFavorite("supplier", supplier.id)
                        }
                        className="shadow-none"
                      />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
