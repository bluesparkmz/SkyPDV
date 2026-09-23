import { useCategories } from "@/hooks/useCategories";
import { Tag24Regular, Wrench24Regular } from "@fluentui/react-icons";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onServicesClick: () => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange, onServicesClick }: CategoryTabsProps) {
  const { data: categoryNames = [], categories = [] } = useCategories();

  // Se a empresa ainda não cadastrou categorias na API, a barra fica vazia (não renderiza)
  // Add "all" category at the beginning
  const allCategories = [
    { id: "all", name: "Todos", icon: null },
    ...categoryNames.map((name) => {
      const catObj = categories.find((c) => c.name === name);
      return {
        id: name,
        name: name,
        icon: catObj?.icon || null,
      };
    }),
  ];

  return (
    <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
      <div className="flex flex-1 gap-1.5 md:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {allCategories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${isActive
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card text-foreground hover:bg-secondary border border-border"
              }`}
          >
            {category.icon ? (
              <span className="text-sm leading-none">{category.icon}</span>
            ) : (
              <Tag24Regular className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
            {category.name}
          </button>
        );
        })}
      </div>
      <button
        type="button"
        onClick={onServicesClick}
        className="mb-2 flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary md:px-4 md:py-2 md:text-sm"
      >
        <Wrench24Regular className="h-3.5 w-3.5 md:h-4 md:w-4" />
        Serviços
      </button>
    </div>
  );
}
