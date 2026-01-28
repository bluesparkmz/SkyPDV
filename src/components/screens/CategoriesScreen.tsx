import { useState } from "react";
import {
    Tag24Regular,
    Add24Regular,
    Edit24Regular,
    Delete24Regular,
    Globe24Regular,
    Copy24Regular,
    Search24Regular,
    DocumentText24Regular,
    DataTrending24Regular,
} from "@fluentui/react-icons";
import { Category } from "@/services/api";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/CategoryDialog";
import {
    useCategoriesList,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useAdoptCategory,
} from "@/hooks/useCategoriesList";
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

export function CategoriesScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const { data: categories = [], isLoading } = useCategoriesList();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const adoptCategory = useAdoptCategory();

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveCategory = async (data: any) => {
        if (data.id) {
            await updateCategory.mutateAsync({ id: data.id, data: { name: data.name, description: data.description, icon: data.icon, color: data.color } });
        } else {
            await createCategory.mutateAsync({ data: { name: data.name, description: data.description, icon: data.icon, color: data.color }, isGlobal: data.isGlobal });
        }
        setIsDialogOpen(false);
        setSelectedCategory(null);
    };

    const handleDelete = async () => {
        if (categoryToDelete) {
            await deleteCategory.mutateAsync(categoryToDelete.id);
            setCategoryToDelete(null);
        }
    };

    const handleAdopt = async (category: Category) => {
        if (confirm(`Deseja adicionar a categoria "${category.name}" ao seu terminal?`)) {
            await adoptCategory.mutateAsync(category.id);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Fixed Header */}
            <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                            <Tag24Regular className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-foreground">Categorias</h1>
                            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Gerencie os departamentos de produtos</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedCategory(null);
                            setIsDialogOpen(true);
                        }}
                        className="gap-2 px-3 h-9 md:h-10"
                    >
                        <Add24Regular className="w-5 h-5" />
                        <span className="hidden sm:inline">Nova Categoria</span>
                    </Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">


                <div className="mb-4 md:mb-6 relative max-w-md">
                    <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar categorias..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-card border border-border text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>


                {isLoading ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        Carregando categorias...
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                        <Tag24Regular className="w-12 h-12 mb-2 opacity-50" />
                        <p>Nenhuma categoria encontrada</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCategories.map((category) => (
                            <div
                                key={category.id}
                                className="fluent-card p-4 flex flex-col justify-between group hover:border-primary/50 transition-colors"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm"
                                            style={{ backgroundColor: `${category.color || "#2563eb"}20`, color: category.color || "#2563eb" }}
                                        >
                                            {category.icon || "🏷️"}
                                        </div>
                                        {category.is_global && (
                                            <div title="Categoria Global (Pública)" className="text-blue-500 bg-blue-50 p-1 rounded">
                                                <Globe24Regular className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {category.is_global && !category.terminal_id ? (
                                        <button
                                            onClick={() => handleAdopt(category)}
                                            className="fluent-button gap-2 text-primary hover:bg-primary/10 flex-1 justify-center"
                                            title="Adicionar ao meu terminal"
                                        >
                                            <Copy24Regular className="w-4 h-4" />
                                            Adotar
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(category);
                                                    setIsDialogOpen(true);
                                                }}
                                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                                title="Editar"
                                            >
                                                <Edit24Regular className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setCategoryToDelete(category)}
                                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                title="Excluir"
                                            >
                                                <Delete24Regular className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <CategoryDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSaveCategory}
                    category={selectedCategory}
                />

                <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
                                Produtos associados ficarão "Sem Categoria".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
