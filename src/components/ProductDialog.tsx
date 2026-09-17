import { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise24Regular,
  Box24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Image24Regular,
  Save24Regular,
} from "@fluentui/react-icons";

import { useCategories } from "@/hooks/useCategories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isEmoji } from "@/lib/imageUtils";
import { productsApi } from "@/services/api";
import { Product } from "@/types/product";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  product?: Product | null;
}

const DEFAULT_EMOJI = "📦";
const EMOJIS = ["📦", "🧃", "🍔", "🍕", "🌭", "🍟", "🍿", "🍫", "🍦", "🍰", "🍪", "🍩", "☕", "🧴", "💧", "🍹", "🍺", "🥗", "🥪", "🌮", "🧀"];
const PRODUCT_FORM_PREFS_KEY = "skypdv_product_form_prefs";

type UploadState = "idle" | "uploading" | "done" | "error";

type ProductFormPrefs = {
  category?: string;
  initialStockLocation?: "balcao" | "armazem" | "congelado";
  is_fastfood?: boolean;
  track_stock?: boolean;
};

function loadProductFormPrefs(): ProductFormPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRODUCT_FORM_PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProductFormPrefs;
  } catch {
    return {};
  }
}

function saveProductFormPrefs(prefs: ProductFormPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRODUCT_FORM_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore local storage errors
  }
}

export function ProductDialog({ isOpen, onClose, onSave, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    initialStock: "",
    initialStockLocation: "balcao" as "balcao" | "armazem" | "congelado",
    image: DEFAULT_EMOJI,
    emoji: DEFAULT_EMOJI,
    is_fastfood: false,
    track_stock: true,
    allow_decimal_quantity: false,
  });

  // Local preview (data URL) shown while uploading, replaced by R2 URL afterwards
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categoriesList = [] } = useCategories();

  useEffect(() => {
    if (categoriesList.length > 0 && !formData.category && !product) {
      setFormData((prev) => ({ ...prev, category: categoriesList[0] }));
    }
  }, [categoriesList, formData.category, product]);

  useEffect(() => {
    setImagePreview(null);
    setUploadState("idle");
    setUploadError(null);

    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        initialStock: "",
        initialStockLocation: "balcao",
        image: product.image || DEFAULT_EMOJI,
        emoji: (product as any).emoji || (isEmoji(product.image) ? product.image : DEFAULT_EMOJI),
        is_fastfood: false,
        track_stock: product.track_stock !== false,
        allow_decimal_quantity: product.allow_decimal_quantity ?? false,
      });
      return;
    }

    const savedPrefs = loadProductFormPrefs();
    setFormData({
      name: "",
      price: "",
      category: savedPrefs.category || categoriesList[0] || "",
      initialStock: "",
      initialStockLocation: savedPrefs.initialStockLocation || "balcao",
      image: DEFAULT_EMOJI,
      emoji: DEFAULT_EMOJI,
      is_fastfood: false,
      track_stock: savedPrefs.track_stock ?? true,
      allow_decimal_quantity: false,
    });
  }, [product, isOpen, categoriesList]);

  useEffect(() => {
    if (!isOpen || product) return;
    saveProductFormPrefs({
      category: formData.category,
      initialStockLocation: formData.initialStockLocation,
      is_fastfood: false,
      track_stock: formData.track_stock,
    });
  }, [formData.category, formData.initialStockLocation, formData.track_stock, isOpen, product]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately for instant feedback
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudflare R2 (server converts to WebP)
    setUploadState("uploading");
    setUploadError(null);
    try {
      const { url } = await productsApi.uploadImage(file);
      // Replace data URL with the actual R2 public URL
      setFormData((prev) => ({ ...prev, image: url, emoji: DEFAULT_EMOJI }));
      setImagePreview(null); // clear local preview, image URL is in formData now
      setUploadState("done");
    } catch (err: any) {
      setUploadState("error");
      setUploadError(err?.message || "Falha no upload. Tente novamente.");
      // Keep local preview so the user can see what they picked
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData((prev) => ({ ...prev, image: emoji, emoji }));
    setImagePreview(null);
    setUploadState("idle");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Block submit if an upload is still in progress
    if (uploadState === "uploading") return;

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
      initialStock: formData.track_stock ? parseFloat(formData.initialStock) || 0 : 0,
      initialStockLocation: formData.initialStockLocation,
      image: finalImage,
      emoji: finalEmoji,
      is_fastfood: false,
      track_stock: formData.track_stock,
      allow_decimal_quantity: formData.allow_decimal_quantity,
    } as any);

    onClose();
  };

  const isEditing = Boolean(product);

  // What to show inside the preview box
  const previewSrc = imagePreview || (!isEmoji(formData.image) ? formData.image : null);
  const previewEmoji = isEmoji(formData.image) ? formData.image : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[88vh] overflow-hidden border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Box24Regular className="h-4 w-4 text-primary-foreground" />
            </div>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex max-h-[calc(88vh-110px)] flex-col">
          <div className="windows-scrollbar space-y-4 overflow-y-auto pr-1">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  {/* Image preview + upload button */}
                  <div className="flex flex-col items-center gap-2 md:w-[110px]">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-background overflow-hidden">
                      {previewSrc ? (
                        <img src={previewSrc} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                      ) : (
                        <span className="text-4xl">{previewEmoji || DEFAULT_EMOJI}</span>
                      )}

                      {/* Upload overlay indicators */}
                      {uploadState === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                          <ArrowClockwise24Regular className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {uploadState === "done" && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-500/20">
                          <CheckmarkCircle24Regular className="h-6 w-6 text-green-500" />
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadState === "uploading"}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-foreground transition-colors ${
                        uploadState === "uploading"
                          ? "pointer-events-none bg-secondary/50 text-muted-foreground"
                          : "bg-background hover:bg-secondary"
                      }`}
                    >
                      <Image24Regular className="h-4 w-4" />
                      {uploadState === "uploading"
                        ? "Enviando…"
                        : previewSrc
                          ? "Trocar"
                          : "Imagem"}
                    </label>

                    {uploadState === "error" && uploadError && (
                      <p className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-center text-[10px] leading-snug text-destructive">
                        {uploadError}
                      </p>
                    )}
                    {uploadState === "done" && (
                      <p className="text-[10px] text-green-500">Imagem enviada ✓</p>
                    )}
                  </div>

                  {/* Emoji picker */}
                  <div className="min-w-0 flex-1">
                    <label className="mb-2 block text-sm font-medium text-foreground">Icone Rapido</label>
                    <div className="windows-scrollbar flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg bg-background p-3">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                            formData.image === emoji || formData.emoji === emoji
                              ? "scale-105 bg-primary shadow-lg"
                              : "bg-card hover:bg-secondary"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
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

              <div className={`grid gap-4 ${isEditing || !formData.track_stock ? "md:grid-cols-2" : "md:grid-cols-[1fr_1fr_1fr]"}`}>
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

                {!isEditing && formData.track_stock && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Estoque Inicial</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.initialStock}
                        onChange={(event) => setFormData((prev) => ({ ...prev, initialStock: event.target.value }))}
                        placeholder="0.000"
                        required
                        className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Local Inicial</label>
                      <select
                        value={formData.initialStockLocation}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            initialStockLocation: event.target.value as "balcao" | "armazem" | "congelado",
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="balcao">Balcao</option>
                        <option value="armazem">Armazem</option>
                        <option value="congelado">Congelador</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {!isEditing && formData.track_stock && (
                <p className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                  O cadastro entra por padrao no Balcao, mas pode ser ajustado aqui.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                {categoriesList.length === 0 && (
                  <span className="text-xs text-muted-foreground">Cadastre em Categorias</span>
                )}
              </div>
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

            <div className="space-y-3 rounded-xl border border-border bg-secondary/20 p-3">
              <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-3">
                <div className="pr-4">
                  <label htmlFor="track_stock" className="cursor-pointer text-sm font-semibold text-foreground">
                    Controlar estoque
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desative para produtos que podem ser vendidos sem quantidade armazenada.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    id="track_stock"
                    checked={formData.track_stock}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        track_stock: event.target.checked,
                        initialStock: event.target.checked ? prev.initialStock : "",
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 rtl:peer-checked:after:-translate-x-full" />
                </label>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-3">
                <div className="pr-4">
                  <label htmlFor="allow_decimal_quantity" className="cursor-pointer text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <span>Vendido por peso / fração (Kg, Litro)</span>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Permite vender frações e quantidades decimais no caixa (ex: 8.98 Kg, 0.5 Kg, 1.25 L).
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    id="allow_decimal_quantity"
                    checked={formData.allow_decimal_quantity}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        allow_decimal_quantity: event.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 dark:border-gray-600 rtl:peer-checked:after:-translate-x-full" />
                </label>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-3">
                <div className="flex items-start gap-3 pr-4">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white">
                    🍔
                  </div>
                  <div>
                    <label htmlFor="is_fastfood" className="cursor-pointer text-sm font-semibold text-foreground">
                      Disponivel no Fastfood
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">Opcao desativada por enquanto.</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    id="is_fastfood"
                    checked={false}
                    disabled
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] dark:bg-gray-700 dark:border-gray-600" />
                </label>
              </div>

              {!formData.track_stock && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                  Este produto ficara sempre disponivel para venda e nao entrara na gestao de estoque.
                </p>
              )}

              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  {formData.track_stock
                    ? "A quantidade deste produto e gerida na tela de Estoque."
                    : "Este produto esta configurado para vender sem controle de estoque."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="fluent-button gap-2">
              <Dismiss24Regular className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadState === "uploading"}
              className="fluent-button fluent-button-primary gap-2 disabled:opacity-60"
            >
              {uploadState === "uploading" ? (
                <>
                  <ArrowClockwise24Regular className="h-4 w-4 animate-spin" />
                  Enviando imagem…
                </>
              ) : (
                <>
                  <Save24Regular className="h-4 w-4" />
                  {isEditing ? "Salvar Alteracoes" : "Cadastrar"}
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
