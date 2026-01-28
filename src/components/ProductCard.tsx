import { useRef, useCallback, useState } from "react";
import { Product } from "@/services/api";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onLongPress?: (product: Product) => void;
}

export function ProductCard({ product, onAdd, onLongPress }: ProductCardProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const [imageError, setImageError] = useState(false);

  const startPress = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (onLongPress) {
        onLongPress(product);
      }
    }, 500);
  }, [product, onLongPress]);

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPress.current) {
      onAdd(product);
    }
    isLongPress.current = false;
  }, [product, onAdd]);

  return (
    <button
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className="fluent-card p-2 md:p-3 flex flex-col items-center gap-1 md:gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
    >
      <div className="group-hover:scale-110 transition-transform">
        <ProductImage
          emoji={product.emoji}
          image={product.image}
          alt={product.name}
          size="xl"
          productName={product.name}
          color="bg-primary/10"
          textColor="text-primary"
        />
      </div>
      <div className="text-center w-full">
        <p className="text-xs md:text-sm font-medium text-foreground truncate">
          {product.name}
        </p>
        <p className="text-xs md:text-sm font-bold text-primary mt-0.5 md:mt-1">
          {parseFloat(product.price).toFixed(2)} MT
        </p>
      </div>
      {product.track_stock && product.inventory && (
        <div className="text-[10px] md:text-xs text-muted-foreground">
          Estoque: {parseFloat(product.inventory.quantity).toFixed(0)}
        </div>
      )}
    </button>
  );
}
