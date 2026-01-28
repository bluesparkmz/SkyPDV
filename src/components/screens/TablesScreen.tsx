import { useState, useEffect, useRef } from "react";
import {
  Table24Regular,
  ZoomOut24Regular,
  ZoomIn24Regular,
  Ruler24Regular,
  Add24Regular,
  Person24Regular,
  Settings24Regular,
  Delete24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fastfoodApi, RestaurantTable, TableCreate, TableUpdate, TableShape, TableStatus } from "@/services/fastfoodApi";
import { toast } from "sonner";

const GRID_SIZE = 20;
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const INITIAL_ZOOM = 1.0;

export function TablesScreen() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [newTable, setNewTable] = useState<Partial<TableCreate>>({
    table_number: "",
    seats: 4,
    shape: "square",
    width: 80,
    height: 80,
  });

  // Load restaurant ID and tables
  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurants = await fastfoodApi.getMyRestaurants();
        if (restaurants.length > 0) {
          const id = restaurants[0].id;
          setRestaurantId(id);
          const data = await fastfoodApi.getTables(id);
          setTables(data);
        }
      } catch (error) {
        toast.error("Erro ao carregar mesas");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMouseDown = (e: React.MouseEvent, table: RestaurantTable) => {
    if (isEditModalOpen) return;

    setIsDragging(true);
    setIsResizing(false);
    setSelectedTable(table);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });

    e.stopPropagation();
  };

  const handleResizeStart = (e: React.MouseEvent, table: RestaurantTable, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setIsDragging(false);
    setSelectedTable(table);
    setResizeCorner(corner);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedTable || !canvasRef.current || (!isDragging && !isResizing)) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (isDragging) {
      let nextX = (e.clientX - canvasRect.left) / zoom - dragOffset.x;
      let nextY = (e.clientY - canvasRect.top) / zoom - dragOffset.y;

      if (showGrid) {
        nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
        nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;
      }

      nextX = Math.max(0, Math.min(nextX, CANVAS_WIDTH - (selectedTable.width || 80)));
      nextY = Math.max(0, Math.min(nextY, CANVAS_HEIGHT - (selectedTable.height || 80)));

      setTables((prev) =>
        prev.map((t) => (t.id === selectedTable.id ? { ...t, position_x: nextX, position_y: nextY } : t))
      );
    } else if (isResizing && resizeCorner) {
      const mouseX = (e.clientX - canvasRect.left) / zoom;
      const mouseY = (e.clientY - canvasRect.top) / zoom;

      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTable.id) return t;

          let newX = t.position_x;
          let newY = t.position_y;
          let newW = t.width || 80;
          let newH = t.height || 80;

          if (resizeCorner.includes("right")) {
            newW = Math.max(40, mouseX - t.position_x);
          }
          if (resizeCorner.includes("bottom")) {
            newH = Math.max(40, mouseY - t.position_y);
          }
          if (resizeCorner.includes("left")) {
            const rightEdge = t.position_x + (t.width || 80);
            newX = Math.min(mouseX, rightEdge - 40);
            newW = rightEdge - newX;
          }
          if (resizeCorner.includes("top")) {
            const bottomEdge = t.position_y + (t.height || 80);
            newY = Math.min(mouseY, bottomEdge - 40);
            newH = bottomEdge - newY;
          }

          if (showGrid) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
            newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;
          }

          return { ...t, position_x: newX, position_y: newY, width: newW, height: newH };
        })
      );
    }
  };

  const handleMouseUp = async () => {
    if ((isDragging || isResizing) && selectedTable && restaurantId) {
      const wasResizing = isResizing;
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner(null);

      const updatedTable = tables.find((t) => t.id === selectedTable.id);
      if (updatedTable) {
        try {
          if (wasResizing) {
            await fastfoodApi.updateTable(restaurantId, selectedTable.id, {
              width: updatedTable.width,
              height: updatedTable.height,
              position_x: updatedTable.position_x,
              position_y: updatedTable.position_y,
            });
          } else {
            await fastfoodApi.updateTablePosition(restaurantId, selectedTable.id, {
              position_x: updatedTable.position_x,
              position_y: updatedTable.position_y,
            });
          }
          toast.success("Posição atualizada");
        } catch (error) {
          toast.error("Erro ao salvar alterações");
        }
      }
    }
  };

  const handleCreateTable = async () => {
    if (!restaurantId || !newTable.table_number) return;

    try {
      setSaving(true);
      const data = await fastfoodApi.createTable(restaurantId, {
        ...(newTable as TableCreate),
        position_x: 100,
        position_y: 100,
      });
      setTables([...tables, data]);
      setIsAddModalOpen(false);
      setNewTable({ table_number: "", seats: 4, shape: "square", width: 80, height: 80 });
      toast.success("Mesa criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar mesa");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!restaurantId || !confirm("Tem certeza que deseja excluir esta mesa?")) return;

    try {
      await fastfoodApi.deleteTable(restaurantId, tableId);
      setTables(tables.filter((t) => t.id !== tableId));
      setIsEditModalOpen(false);
      setSelectedTable(null);
      toast.success("Mesa excluída");
    } catch (error) {
      toast.error("Erro ao excluir mesa");
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable || !restaurantId) return;

    try {
      setSaving(true);
      const data = await fastfoodApi.updateTable(restaurantId, selectedTable.id, {
        table_number: selectedTable.table_number,
        seats: selectedTable.seats,
        shape: selectedTable.shape,
        width: selectedTable.width,
        height: selectedTable.height,
        status: selectedTable.status,
      });
      setTables(tables.map((t) => (t.id === data.id ? data : t)));
      setIsEditModalOpen(false);
      toast.success("Dados atualizados!");
    } catch (error) {
      toast.error("Erro ao atualizar mesa");
    } finally {
      setSaving(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.2));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando mesas...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Nenhum restaurante encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Fixed Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <Table24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Mesas</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Gerencie o layout do restaurante</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-secondary p-1 rounded-lg border border-border">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground"
                title="Diminuir zoom"
              >
                <ZoomOut24Regular className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-xs font-medium text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground"
                title="Aumentar zoom"
              >
                <ZoomIn24Regular className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant={showGrid ? "default" : "outline"}
              size="icon"
              onClick={() => setShowGrid(!showGrid)}
              title="Mostrar/Ocultar grade"
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <Ruler24Regular className="w-5 h-5" />
            </Button>

            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 px-3 h-9 md:h-10">
              <Add24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Main Map Area */}
      <main
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={canvasContainerRef} className="absolute inset-0 overflow-auto windows-scrollbar">
          <div
            ref={canvasRef}
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
              backgroundImage: showGrid
                ? `radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)`
                : "none",
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
            className="relative bg-card transition-transform duration-200"
          >
            {tables.map((table) => (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedTable(table);
                  setIsEditModalOpen(true);
                }}
                style={{
                  position: "absolute",
                  left: `${table.position_x}px`,
                  top: `${table.position_y}px`,
                  width: `${table.width || 80}px`,
                  height: `${table.height || 80}px`,
                  borderRadius: table.shape === "circle" ? "50%" : "12px",
                }}
                className={`
                  flex flex-col items-center justify-center p-2 cursor-pointer transition-all border-2
                  ${selectedTable?.id === table.id && isEditModalOpen
                    ? "border-primary shadow-lg shadow-primary/30 z-10"
                    : "border-border hover:border-primary/50 z-0"
                  }
                  ${table.status === "occupied"
                    ? "bg-destructive/20 border-destructive/40"
                    : table.status === "reserved"
                      ? "bg-warning/20 border-warning/40"
                      : "bg-card"
                  }
                `}
              >
                <Table24Regular className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-xs font-bold">{table.table_number}</span>
                <div className="flex items-center gap-1 mt-1 opacity-60">
                  <Person24Regular className="w-3 h-3" />
                  <span className="text-[10px]">{table.seats}</span>
                </div>

                {/* Resizing Handles */}
                {selectedTable?.id === table.id && (
                  <>
                    <div
                      onMouseDown={(e) => handleResizeStart(e, table, "top-left")}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nwse-resize z-20 shadow-lg border border-background hover:scale-150 transition-transform"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, table, "top-right")}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-nesw-resize z-20 shadow-lg border border-background hover:scale-150 transition-transform"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, table, "bottom-left")}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nesw-resize z-20 shadow-lg border border-background hover:scale-150 transition-transform"
                    />
                    <div
                      onMouseDown={(e) => handleResizeStart(e, table, "bottom-right")}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-nwse-resize z-20 shadow-lg border border-background hover:scale-150 transition-transform"
                    />
                  </>
                )}

                {/* Status Indicator */}
                <div
                  className={`
                    absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-background
                    ${table.status === "available"
                      ? "bg-primary"
                      : table.status === "occupied"
                        ? "bg-destructive"
                        : "bg-warning"
                    }
                  `}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Controls Sidebar */}
        {selectedTable && !isEditModalOpen && (
          <div className="absolute top-6 left-6 p-4 acrylic-surface border border-border rounded-xl shadow-strong">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Table24Regular className="w-4 h-4" />
              Mesa {selectedTable.table_number}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>Cadeiras:</span>
                <span className="text-foreground font-medium">{selectedTable.seats}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>Posição:</span>
                <span className="text-foreground font-medium">
                  {Math.round(selectedTable.position_x)}, {Math.round(selectedTable.position_y)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              <Settings24Regular className="w-4 h-4 mr-2" />
              Editar Detalhes
            </Button>
          </div>
        )}

        {/* Empty State */}
        {tables.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto border border-border text-primary/50">
                <Table24Regular className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-muted-foreground">Restaurante sem mesas</h2>
              <p className="text-sm text-muted-foreground">
                Clique no botão "Adicionar Mesa" para começar a montar o mapa do seu restaurante.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add Table Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
            <DialogDescription>Adicione uma nova mesa ao layout do restaurante</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table_number">Identificação</Label>
              <Input
                id="table_number"
                value={newTable.table_number}
                onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                placeholder="Ex: Mesa 01, Balcão, VIP 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seats">Cadeiras</Label>
                <Input
                  id="seats"
                  type="number"
                  value={newTable.seats}
                  onChange={(e) => setNewTable({ ...newTable, seats: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="shape">Forma</Label>
                <Select
                  value={newTable.shape}
                  onValueChange={(value) => setNewTable({ ...newTable, shape: value as TableShape })}
                >
                  <SelectTrigger id="shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Quadrada</SelectItem>
                    <SelectItem value="rectangle">Retangular</SelectItem>
                    <SelectItem value="circle">Redonda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTable} disabled={saving || !newTable.table_number}>
              {saving ? "Criando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Mesa {selectedTable?.table_number}</DialogTitle>
            <DialogDescription>Edite os detalhes da mesa</DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_table_number">Identificação</Label>
                <Input
                  id="edit_table_number"
                  value={selectedTable.table_number}
                  onChange={(e) => setSelectedTable({ ...selectedTable, table_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_seats">Cadeiras</Label>
                  <Input
                    id="edit_seats"
                    type="number"
                    value={selectedTable.seats}
                    onChange={(e) => setSelectedTable({ ...selectedTable, seats: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={selectedTable.status}
                    onValueChange={(value) => setSelectedTable({ ...selectedTable, status: value as TableStatus })}
                  >
                    <SelectTrigger id="edit_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="occupied">Ocupada</SelectItem>
                      <SelectItem value="reserved">Reservada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Formato</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(["square", "rectangle", "circle"] as TableShape[]).map((s) => (
                    <Button
                      key={s}
                      variant={selectedTable.shape === s ? "default" : "outline"}
                      onClick={() =>
                        setSelectedTable({
                          ...selectedTable,
                          shape: s,
                          width: s === "rectangle" ? 120 : 80,
                          height: 80,
                        })
                      }
                      className="text-xs"
                    >
                      {s === "square" ? "Quadrado" : s === "rectangle" ? "Retang." : "Círculo"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteTable(selectedTable.id)}
                  className="w-full"
                >
                  <Delete24Regular className="w-4 h-4 mr-2" />
                  Remover Esta Mesa
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={saving}>
              Descartar
            </Button>
            <Button onClick={handleUpdateTable} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

