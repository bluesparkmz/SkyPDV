import { useState } from "react";
import { getImageUrl, isEmoji } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  emoji?: string | null;
  image?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  productName?: string; // Para mostrar primeira letra como fallback
  color?: string; // Cor de fundo para placeholder
  textColor?: string; // Cor do texto para placeholder
}

const sizeClasses = {
  sm: { container: "w-6 h-6", emoji: "text-lg", image: "w-6 h-6", rounded: "rounded-lg" },
  md: { container: "w-8 h-8", emoji: "text-xl", image: "w-8 h-8", rounded: "rounded-lg" },
  lg: { container: "w-12 h-12", emoji: "text-2xl", image: "w-12 h-12", rounded: "rounded-xl" },
  xl: { container: "w-16 h-16 md:w-20 md:h-20", emoji: "text-4xl md:text-5xl", image: "w-16 h-16 md:w-20 md:h-20", rounded: "rounded-2xl" },
};

export function ProductImage({
  emoji,
  image,
  alt = "",
  className = "",
  size = "md",
  productName = "",
  color = "bg-primary/10",
  textColor = "text-primary"
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];

  // Prioriza emoji se existir e for válido
  if (emoji && isEmoji(emoji)) {
    return (
      <span className={cn(sizeClass.container, sizeClass.emoji, "flex items-center justify-center", className)}>
        {emoji}
      </span>
    );
  }

  // Se image existe e é emoji válido, usa como emoji
  if (image && isEmoji(image)) {
    return (
      <span className={cn(sizeClass.container, sizeClass.emoji, "flex items-center justify-center", className)}>
        {image}
      </span>
    );
  }

  // Se image existe e não é emoji, tenta renderizar como imagem
  if (image && !isEmoji(image)) {
    const imageUrl = getImageUrl(image);

    if (imageUrl && !imageError) {
      return (
        <div className={cn(sizeClass.image, sizeClass.rounded, "overflow-hidden bg-gray-100 flex-shrink-0", className)}>
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
  }

  // Fallback final: emoji padrão
  return (
    <span className={cn(sizeClass.container, sizeClass.emoji, "flex items-center justify-center", className)}>
      📦
    </span>
  );
}

