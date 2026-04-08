import { useEffect, useRef, useState } from "react";
import { Box24Regular, Dismiss24Regular, Image24Regular, Save24Regular } from "@fluentui/react-icons";

import { useCategories } from "@/hooks/useCategories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isEmoji } from "@/lib/imageUtils";
import { Product } from "@/types/product";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  product?: Product | null;
}

const DEFAULT_EMOJI = "📦";
const EMOJIS = ["📦", "🥤", "🍔", "🍕", "🌭", "🍟", "🍿", "🍫", "🍦", "🍰", "🍪", "🍩", "☕", "🧃", "💧", "🍹", "🍺", "🥗", "🥪", "🌮", "🧀"];

export function ProductDialog({ isOpen, onClose, onSave, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    initialStock: "",
    image: DEFAULT_EMOJI,
    emoji: DEFAULT_EMOJI,
    is_fastfood: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categoriesList = [] } = useCategories();

  useEffect(() => {
    if (categoriesList.length > 0 && !formData.category && !product) {
      setFormData((prev) => ({ ...prev, category: categoriesList[0] }));
    }
  }, [categoriesList, formData.category, product]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        initialStock: "",
        image: product.image || DEFAULT_EMOJI,
        emoji: (product as any).emoji || (isEmoji(product.image) ? product.image : DEFAULT_EMOJI),
        is_fastfood: (product as any).is_fastfood || false,
      });
      return;
    }

    setFormData({
      name: "",
      price: "",
      category: categoriesList[0] || "bebidas",
      initialStock: "",
      image: DEFAULT_EMOJI,
      emoji: DEFAULT_EMOJI,
      is_fastfood: false,
    });
  }, [product, isOpen, categoriesList]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, image: result, emoji: DEFAULT_EMOJI }));
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData((prev) => ({ ...prev, image: emoji, emoji }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    let finalImage = formData.image;
    let finalEmoji = formData.emoji;

    if (!finalImage?.trim()) {
      finalImage = DEFAULT_EMOJI;
      finalEmoji = DEFAULT_EMOJI;
    } else if (isEmoji(finalImage)) {
      finalEmoji = finalImage;
    } else if (!finalEmoji?.trim()) {
      finalEmoji = DEFAULT_EMOJI;
    }

    onSave({
      id: product?.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      initialStock: parseInt(formData.initialStock, 10) || 0,
      image: finalImage,
      emoji: finalEmoji,
      is_fastfood: formData.is_fastfood,
    } as any);

    onClose();
  };

  const isEditing = Boolean(product);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Box24Regular className="h-4 w-4 text-primary-foreground" />
            </div>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Icone (Emoji ou Imagem)</label>
            <div className="mb-2 flex max-h-24 flex-wrap gap-2 overflow-auto rounded-lg bg-secondary/50 p-3 windows-scrollbar">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`h-10 w-10 rounded-lg text-xl transition-all ${
                    formData.image === emoji || formData.emoji === emoji
                      ? "scale-110 bg-primary shadow-lg"
                      : "bg-card hover:bg-secondary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

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
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <Image24Regular className="h-4 w-4" />
                {formData.image && !isEmoji(formData.image) ? "Trocar Imagem" : "Enviar Imagem"}
              </label>

              {formData.image && !isEmoji(formData.image) && (
                <div className="relative mt-2">
                  <img src={formData.image} alt="Preview" className="h-20 w-20 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, image: DEFAULT_EMOJI, emoji: DEFAULT_EMOJI }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  >
                    x
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Nome do Produto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ex: Coca-Cola 350ml"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className={`grid gap-4 ${isEditing ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Preco (MT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Estoque Inicial (Armazem)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={(event) => setFormData((prev) => ({ ...prev, initialStock: event.target.value }))}
                  placeholder="0"
                  required
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="mt-1 text-xs text-muted-foreground">Ao cadastrar, este valor entra primeiro no Armazem.</p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
              O estoque deste produto agora e gerido na tela de Estoque. Aqui podes editar apenas os dados do produto.
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Categoria</label>
            <select
              value={formData.category}
              onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Sem Categoria</option>
              {categoriesList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                🍔
              </div>
              <div>
                <label htmlFor="is_fastfood" className="cursor-pointer text-sm font-semibold text-foreground">
                  Disponivel no Fastfood
                </label>
                <p className="text-xs text-muted-foreground">Produto aparecera no app de delivery</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="is_fastfood"
                checked={formData.is_fastfood}
                onChange={(event) => setFormData((prev) => ({ ...prev, is_fastfood: event.target.checked }))}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:bg-gray-700 dark:border-gray-600 dark:peer-focus:ring-orange-800 rtl:peer-checked:after:-translate-x-full" />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="fluent-button gap-2">
              <Dismiss24Regular className="h-4 w-4" />
              Cancelar
            </button>
            <button type="submit" className="fluent-button fluent-button-primary gap-2">
              <Save24Regular className="h-4 w-4" />
              {isEditing ? "Salvar Alteracoes" : "Cadastrar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
