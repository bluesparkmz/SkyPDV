import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PersonAdd24Regular,
  PersonDelete24Regular,
  Edit24Regular,
  CheckmarkCircle24Regular,
  Info24Regular,
  ArrowSync24Regular,
  PeopleTeam24Regular,
} from "@fluentui/react-icons";
import {
  useTerminalUsers,
  useAddTerminalUser,
  useUpdateTerminalUser,
  useRemoveTerminalUser,
} from "@/hooks/useTerminalUsers";
import { PDVTerminalUser, CreatePDVTerminalUser, UpdatePDVTerminalUser } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  cashier: "Caixa",
  manager: "Gerente",
  viewer: "Visualizador",
};

export function TerminalUsersSettings() {
  const { data: users, isLoading, refetch } = useTerminalUsers();
  const { user: profileData } = useAuth();
  const currentUserId = profileData?.user?.id;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PDVTerminalUser | null>(null);

  const addUser = useAddTerminalUser();
  const updateUser = useUpdateTerminalUser();
  const removeUser = useRemoveTerminalUser();

  const handleAddUser = async (data: CreatePDVTerminalUser) => {
    await addUser.mutateAsync(data);
    setIsAddDialogOpen(false);
  };

  const handleEditUser = async (id: number, data: UpdatePDVTerminalUser) => {
    await updateUser.mutateAsync({ id, data });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRemoveUser = async (id: number) => {
    await removeUser.mutateAsync(id);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const openEditDialog = (user: PDVTerminalUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: PDVTerminalUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const isCurrentUser = (user: PDVTerminalUser) => {
    return user.user_id === currentUserId;
  };

  const isAdmin = (user: PDVTerminalUser) => {
    return user.role === "admin" || isCurrentUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <ArrowSync24Regular className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            Usuários do Terminal
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie usuários e permissões do terminal PDV
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="fluent-button fluent-button-primary"
        >
          <PersonAdd24Regular className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {users && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <PeopleTeam24Regular className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Nenhum usuário adicionado</p>
          <p className="text-xs">Adicione usuários para trabalhar no terminal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users?.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-lg bg-card border border-border hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {user.user_name || "Usuário"}
                    </h3>
                    {isCurrentUser(user) && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Você
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                    {!user.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{user.user_email}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.can_sell && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        Vender
                      </span>
                    )}
                    {user.can_open_cash_register && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        Caixa
                      </span>
                    )}
                    {user.can_manage_products && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">
                        Produtos
                      </span>
                    )}
                    {user.can_manage_stock && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">
                        Estoque
                      </span>
                    )}
                    {user.can_view_reports && (
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                        Relatórios
                      </span>
                    )}
                    {user.can_manage_users && (
                      <span className="text-xs px-2 py-0.5 rounded bg-pink-500/10 text-pink-500">
                        Usuários
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!isCurrentUser(user) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="h-8"
                      >
                        <Edit24Regular className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <PersonDelete24Regular className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddUser}
        isLoading={addUser.isPending}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            user={selectedUser}
            onUpdate={handleEditUser}
            isLoading={updateUser.isPending}
          />

          <DeleteUserDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            user={selectedUser}
            onDelete={handleRemoveUser}
            isLoading={removeUser.isPending}
          />
        </>
      )}
    </div>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: CreatePDVTerminalUser) => Promise<void>;
  isLoading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "cashier" | "manager" | "viewer">("cashier");
  const [permissions, setPermissions] = useState({
    can_sell: true,
    can_open_cash_register: true,
    can_manage_products: false,
    can_manage_stock: false,
    can_view_reports: true,
    can_manage_users: false,
  });

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    await onAdd({
      email: email.trim(),
      role,
      ...permissions,
    });

    // Reset form
    setEmail("");
    setRole("cashier");
    setPermissions({
      can_sell: true,
      can_open_cash_register: true,
      can_manage_products: false,
      can_manage_stock: false,
      can_view_reports: true,
      can_manage_users: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Usuário ao Terminal</DialogTitle>
          <DialogDescription>
            Adicione um usuário pelo email do SkyVendaMZ. O usuário receberá acesso ao terminal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="cashier">Caixa</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Permissões</Label>
            {Object.entries(permissions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setPermissions((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  {key === "can_sell" && "Pode fazer vendas"}
                  {key === "can_open_cash_register" && "Pode abrir/fechar caixa"}
                  {key === "can_manage_products" && "Pode gerenciar produtos"}
                  {key === "can_manage_stock" && "Pode gerenciar estoque"}
                  {key === "can_view_reports" && "Pode ver relatórios"}
                  {key === "can_manage_users" && "Pode gerenciar usuários"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="fluent-button fluent-button-primary">
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  open,
  onOpenChange,
  user,
  onUpdate,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PDVTerminalUser;
  onUpdate: (id: number, data: UpdatePDVTerminalUser) => Promise<void>;
  isLoading: boolean;
}) {
  const [role, setRole] = useState<"admin" | "cashier" | "manager" | "viewer">(user.role);
  const [permissions, setPermissions] = useState({
    can_sell: user.can_sell,
    can_open_cash_register: user.can_open_cash_register,
    can_manage_products: user.can_manage_products,
    can_manage_stock: user.can_manage_stock,
    can_view_reports: user.can_view_reports,
    can_manage_users: user.can_manage_users,
  });
  const [isActive, setIsActive] = useState(user.is_active);

  const handleSubmit = async () => {
    await onUpdate(user.id, {
      role,
      ...permissions,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Permissões</DialogTitle>
          <DialogDescription>
            Atualize as permissões de {user.user_name || user.user_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-role">Função</Label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="cashier">Caixa</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Permissões</Label>
            {Object.entries(permissions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setPermissions((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  {key === "can_sell" && "Pode fazer vendas"}
                  {key === "can_open_cash_register" && "Pode abrir/fechar caixa"}
                  {key === "can_manage_products" && "Pode gerenciar produtos"}
                  {key === "can_manage_stock" && "Pode gerenciar estoque"}
                  {key === "can_view_reports" && "Pode ver relatórios"}
                  {key === "can_manage_users" && "Pode gerenciar usuários"}
                </span>
              </label>
            ))}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-foreground">Usuário ativo</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="fluent-button fluent-button-primary">
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onDelete,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PDVTerminalUser;
  onDelete: (id: number) => Promise<void>;
  isLoading: boolean;
}) {
  const handleDelete = async () => {
    await onDelete(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Remover Usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {user.user_name || user.user_email} do terminal?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
            className="fluent-button"
          >
            {isLoading ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

