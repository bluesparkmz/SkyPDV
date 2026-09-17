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
    }) => void | Promise<void>;
    category?: Category | null;
}

const COLORS = [
    { value: "#2563eb", label: "Azul" },
    { value: "#16a34a", label: "Verde" },
    { value: "#dc2626", label: "Vermelho" },
    { value: "#ca8a04", label: "Amarelo" },
    { value: "#9333ea", label: "Roxo" },
    { value: "#db2777", label: "Rosa" },
    { value: "#0891b2", label: "Ciano" },
    { value: "#ea580c", label: "Laranja" },
    { value: "#475569", label: "Cinza" },
];

const ICONS = [
    "🏷️", "🍔", "🥤", "🍕", "🛒", "📦",
    "👕", "💊", "🧹", "📝", "🎁", "🥩",
    "🍎", "🥦", "🍫", "🧴", "📱", "🏠",
    "☕", "🥗", "🍗", "🌮", "🧀", "🐟",
];

export function CategoryDialog({ isOpen, onClose, onSave, category }: CategoryDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "🏷️",
        color: "#2563eb",
        isGlobal: false,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || "",
                icon: category.icon || "🏷️",
                color: category.color || "#2563eb",
                isGlobal: false,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        await onSave({
            id: category?.id,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            icon: formData.icon,
            color: formData.color,
            isGlobal: formData.isGlobal,
        });
        onClose();
    };

    const isEditing = !!category;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[420px] bg-card border-border p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        {/* Live preview */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0 transition-all"
                            style={{ backgroundColor: `${formData.color}25` }}
                        >
                            <span style={{ color: formData.color }}>{formData.icon}</span>
                        </div>
                        <div>
                            <p className="text-base font-semibold leading-tight">
                                {isEditing ? "Editar Categoria" : "Nova Categoria"}
                            </p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">
                                {formData.name || (isEditing ? category?.name : "Sem nome")}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto windows-scrollbar">

                        {/* Name */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Nome da Categoria <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Bebidas"
                                required
                                autoFocus
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                        </div>

                        {/* Icon picker */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Ícone
                            </label>
                            <div className="grid grid-cols-8 gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        title={icon}
                                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${
                                            formData.icon === icon
                                                ? "shadow-sm scale-105"
                                                : "hover:bg-secondary"
                                        }`}
                                        style={
                                            formData.icon === icon
                                                ? { backgroundColor: `${formData.color}25`, outline: `2px solid ${formData.color}` }
                                                : undefined
                                        }
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color picker */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Cor da Etiqueta
                            </label>
                            <div className="flex gap-2.5 flex-wrap">
                                {COLORS.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        title={label}
                                        onClick={() => setFormData({ ...formData, color: value })}
                                        className={`w-8 h-8 rounded-full transition-all ${
                                            formData.color === value
                                                ? "scale-125 ring-2 ring-offset-2 ring-primary"
                                                : "hover:scale-110"
                                        }`}
                                        style={{ backgroundColor: value }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Refrigerantes e sucos"
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-border bg-background/50">
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
                            disabled={!formData.name.trim()}
                            className="fluent-button fluent-button-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save24Regular className="w-4 h-4" />
                            {isEditing ? "Guardar" : "Criar Categoria"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
