import { useState, useEffect, useRef } from "react";
import {
  Dismiss24Regular,
  Save24Regular,
  Box24Regular,
  Image24Regular,
} from "@fluentui/react-icons";
import { Product } from "@/types/product";
import { useCategories } from "@/hooks/useCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isEmoji } from "@/lib/imageUtils";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  product?: Product | null;
}

export function ProductDialog({ isOpen, onClose, onSave, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    image: "📦",
    emoji: "📦",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categoriesList = [] } = useCategories();

  const emojis = ["📦", "🥤", "🍔", "🍕", "🌭", "🍟", "🍿", "🍫", "🍦", "🍰", "🍪", "🍩", "☕", "🧃", "💧", "🍹", "🍺", "🥗", "🥪", "🌮", "🧀"];

  // Definir categoria padrão quando categorias carregarem
  useEffect(() => {
    if (categoriesList.length > 0 && !formData.category && !product) {
      setFormData(prev => ({ ...prev, category: categoriesList[0] }));
    }
  }, [categoriesList, product]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        image: product.image || "📦",
        emoji: (product as any).emoji || (isEmoji(product.image) ? product.image : "📦"),
      });
    } else {
      setFormData({
        name: "",
        price: "",
        category: "bebidas",
        stock: "",
        image: "📦",
        emoji: "📦",
      });
    }
  }, [product, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData({ ...formData, image: result, emoji: "📦" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData({ ...formData, image: emoji, emoji: emoji });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Garantir que sempre tenha um emoji padrão se não houver imagem nem emoji
    let finalImage = formData.image;
    let finalEmoji = formData.emoji;

    if (!finalImage || finalImage.trim() === "") {
      finalImage = "📦";
      finalEmoji = "📦";
    } else if (isEmoji(finalImage)) {
      // Se a imagem é um emoji, usar como emoji também
      finalEmoji = finalImage;
    } else {
      // Se é uma imagem (não emoji), garantir que tem emoji padrão
      if (!finalEmoji || finalEmoji.trim() === "") {
        finalEmoji = "📦";
      }
    }

    onSave({
      id: product?.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image: finalImage,
      emoji: finalEmoji,
    } as any);
    onClose();
  };

  const isEditing = !!product;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Box24Regular className="w-4 h-4 text-primary-foreground" />
            </div>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Emoji Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Ícone (Emoji ou Imagem)
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-secondary/50 rounded-lg max-h-24 overflow-auto windows-scrollbar mb-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg transition-all ${(formData.image === emoji || formData.emoji === emoji)
                    ? "bg-primary scale-110 shadow-lg"
                    : "bg-card hover:bg-secondary"
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Upload de Imagem */}
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary transition-colors text-sm text-foreground"
              >
                <Image24Regular className="w-4 h-4" />
                {formData.image && !isEmoji(formData.image) ? "Trocar Imagem" : "Enviar Imagem"}
              </label>
              {formData.image && !isEmoji(formData.image) && (
                <div className="mt-2 relative">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, image: "📦", emoji: "📦" });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Nome do Produto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Coca-Cola 350ml"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Preço (MT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Estoque
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">Sem Categoria</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="fluent-button gap-2"
            >
              <Dismiss24Regular className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              className="fluent-button fluent-button-primary gap-2"
            >
              <Save24Regular className="w-4 h-4" />
              {isEditing ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
