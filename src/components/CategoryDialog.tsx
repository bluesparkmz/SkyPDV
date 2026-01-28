import { useState, useEffect } from "react";
import {
    Dismiss24Regular,
    Save24Regular,
    Tag24Regular,
} from "@fluentui/react-icons";
import { Category } from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: {
        id?: number;
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        isGlobal?: boolean;
    }) => void;
    category?: Category | null;
}

export function CategoryDialog({ isOpen, onClose, onSave, category }: CategoryDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "🏷️",
        color: "#2563eb", // blue-600 default
        isGlobal: false,
    });

    const colors = [
        "#2563eb", // blue
        "#16a34a", // green
        "#dc2626", // red
        "#ca8a04", // yellow
        "#9333ea", // purple
        "#db2777", // pink
        "#0891b2", // cyan
        "#ea580c", // orange
        "#475569", // slate
    ];

    const icons = ["🏷️", "🍔", "🥤", "📱", "👕", "🏠", "💊", "🧹", "📝", "📦", "🎁", "🥩", "🥦", "🍎"];

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || "",
                icon: category.icon || "🏷️",
                color: category.color || "#2563eb",
                isGlobal: false, // Usually we don't edit isGlobal for existing ones unless we are admin
            });
        } else {
            setFormData({
                name: "",
                description: "",
                icon: "🏷️",
                color: "#2563eb",
                isGlobal: false,
            });
        }
    }, [category, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: category?.id,
            name: formData.name,
            description: formData.description || undefined,
            icon: formData.icon,
            color: formData.color,
            isGlobal: formData.isGlobal,
        });
        onClose();
    };

    const isEditing = !!category;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Tag24Regular className="w-4 h-4 text-primary-foreground" />
                        </div>
                        {isEditing ? "Editar Categoria" : "Nova Categoria"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Icon Selector */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Ícone
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 windows-scrollbar">
                            {icons.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all shrink-0 ${formData.icon === icon
                                            ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                                            : "bg-secondary text-foreground hover:bg-secondary/80"
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Nome da Categoria
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Bebidas"
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Cor da Etiqueta
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Descrição (Opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Refrigerantes e sucos"
                            className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-20"
                        />
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
                            Salvar
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
