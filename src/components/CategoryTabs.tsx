import { useCategories } from "@/hooks/useCategories";
import { Tag24Regular } from "@fluentui/react-icons";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const { data: categories = [] } = useCategories();

  // Add "all" category at the beginning
  const allCategories = [
    { id: "all", name: "Todos" },
    ...categories.map(cat => ({ id: cat, name: cat }))
  ];

  return (
    <div className="flex gap-1.5 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-2 -mx-1 px-1">
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
            <Tag24Regular className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
