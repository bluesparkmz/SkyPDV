import {
  Delete24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { Product } from "@/types/product";
import { ProductImage } from "./ProductImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
}

export function DeleteProductDialog({ isOpen, onClose, onConfirm, product }: DeleteProductDialogProps) {
  if (!product) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Warning24Regular className="w-5 h-5 text-destructive" />
            </div>
            Excluir Produto
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-semibold text-foreground">"{product.name}"</span>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-4 bg-secondary/50 rounded-lg flex items-center gap-3 my-2">
          <ProductImage
            emoji={(product as any).emoji}
            image={product.image}
            alt={product.name}
            size="lg"
            productName={product.name}
            color="bg-primary/10"
            textColor="text-primary"
          />
          <div>
            <p className="font-medium text-foreground">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              Preço: {product.price.toFixed(2)} MT • Estoque: {product.stock} un
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="fluent-button gap-2">
            <Dismiss24Regular className="w-4 h-4" />
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="fluent-button bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Delete24Regular className="w-4 h-4" />
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
