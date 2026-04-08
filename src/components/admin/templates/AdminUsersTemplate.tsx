// filepath: src/components/admin/templates/AdminUsersTemplate.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Users,
  Search,
  Trash2,
  ShieldOff,
  ShieldCheck,
  X,
  FlaskConical,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Types ────────────────────────────────────────────────────

type UserRole =
  | "admin"
  | "finance"
  | "logistics"
  | "developer"
  | "marketing"
  | "vendor"
  | "customer"
  | "agent";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Super Admin",
  finance: "Financier",
  logistics: "Logistique",
  developer: "Développeur",
  marketing: "Marketing",
  vendor: "Vendeur",
  customer: "Client",
  agent: "Agent",
};

type UserItem = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: UserRole;
  is_banned: boolean;
  is_verified: boolean;
  is_demo: boolean;
  _creationTime: number;
  last_login_at: number | undefined;
};

interface Props {
  users: UserItem[];
}

// ─── Role Badge ───────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-700 border-red-300",
    finance: "bg-emerald-100 text-emerald-700 border-emerald-300",
    logistics: "bg-blue-100 text-blue-700 border-blue-300",
    developer: "bg-violet-100 text-violet-700 border-violet-300",
    marketing: "bg-orange-100 text-orange-700 border-orange-300",
    vendor: "bg-purple-100 text-purple-700 border-purple-300",
    customer: "bg-slate-100 text-slate-700 border-slate-300",
    agent: "bg-amber-100 text-amber-700 border-amber-300",
  };
  return <Badge className={map[role]}>{ROLE_LABELS[role]}</Badge>;
}

// ─── Change Role Dialog ───────────────────────────────────────

function ChangeRoleDialog({
  user,
  onClose,
}: {
  user: UserItem | null;
  onClose: () => void;
}) {
  const changeRole = useMutation(api.admin.mutations.changeUserRole);
  const [role, setRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      await changeRole({ userId: user._id, role: role as UserRole });
      onClose();
      setRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!user}
      onOpenChange={() => {
        onClose();
        setRole("");
        setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription>
            Modifier le rôle de{" "}
            <span className="font-semibold">{user.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-24">Rôle actuel</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-24">
              Nouveau rôle
            </span>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">👑 Super Admin</SelectItem>
                <SelectItem value="finance">💰 Financier</SelectItem>
                <SelectItem value="logistics">🚚 Logistique</SelectItem>
                <SelectItem value="developer">💻 Développeur</SelectItem>
                <SelectItem value="marketing">📢 Marketing</SelectItem>
                <SelectItem value="vendor">🛍 Vendeur</SelectItem>
                <SelectItem value="customer">👤 Client</SelectItem>
                <SelectItem value="agent">📦 Agent Entrepôt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !role}>
            {loading ? "Enregistrement…" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ban Dialog ───────────────────────────────────────────────

function BanDialog({
  user,
  onClose,
}: {
  user: UserItem | null;
  onClose: () => void;
}) {
  const ban = useMutation(api.admin.mutations.banUser);
  const unban = useMutation(api.admin.mutations.unbanUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const isBanned = user.is_banned;

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isBanned) await unban({ userId: user._id });
      else await ban({ userId: user._id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isBanned ? "Débannir l'utilisateur" : "Bannir l'utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {isBanned
              ? `${user.name} pourra à nouveau accéder à la plateforme.`
              : `${user.name} ne pourra plus accéder à la plateforme.`}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant={isBanned ? "default" : "destructive"}
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? "…" : isBanned ? "Débannir" : "Bannir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete User Dialog ───────────────────────────────────────

function DeleteUserDialog({
  user,
  onClose,
}: {
  user: UserItem | null;
  onClose: () => void;
}) {
  const deleteUser = useMutation(api.admin.mutations.deleteUser);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteUser({ userId: user._id });
      onClose();
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!user}
      onOpenChange={() => {
        onClose();
        setConfirm("");
        setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Supprimer le compte
          </DialogTitle>
          <DialogDescription>
            Cette action est <strong>irréversible</strong>. Le compte de{" "}
            <span className="font-semibold">{user.name}</span> ({user.email})
            sera supprimé de la plateforme et de l'authentification. Les
            commandes existantes sont conservées.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Saisissez{" "}
            <span className="font-mono font-semibold">{user.email}</span> pour
            confirmer
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={user.email}
            className="font-mono text-sm"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirm !== user.email}
          >
            {loading ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Delete Dialog ───────────────────────────────────────

function BulkDeleteDialog({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Supprimer {count} compte{count > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. {count} compte{count > 1 ? "s" : ""}{" "}
            seront définitivement supprimés. Les comptes administrateurs seront
            ignorés.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminUsersTemplate({ users }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [demoOnly, setDemoOnly] = useState(false);
  const router = useRouter();
  const [roleTarget, setRoleTarget] = useState<UserItem | null>(null);
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const bulkBan = useMutation(api.admin.mutations.bulkBanUsers);
  const bulkUnban = useMutation(api.admin.mutations.bulkUnbanUsers);
  const bulkDelete = useMutation(api.admin.mutations.bulkDeleteUsers);

  const filtered = users.filter((u) => {
    const matchSearch =
      search.trim() === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchDemo = !demoOnly || u.is_demo;
    return matchSearch && matchRole && matchDemo;
  });

  const {
    selectedIds,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    count: selectedCount,
  } = useBulkSelection();

  const filteredIds = filtered.map((u) => u._id);
  const allSelected = isAllSelected(filteredIds);

  const handleBulkBan = async () => {
    await bulkBan({ userIds: Array.from(selectedIds) as Id<"users">[] });
    clear();
  };

  const handleBulkUnban = async () => {
    await bulkUnban({ userIds: Array.from(selectedIds) as Id<"users">[] });
    clear();
  };

  const handleBulkDelete = async () => {
    await bulkDelete({ userIds: Array.from(selectedIds) as Id<"users">[] });
    clear();
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          {users.length} utilisateur{users.length !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Super Admin</SelectItem>
            <SelectItem value="finance">Financier</SelectItem>
            <SelectItem value="logistics">Logistique</SelectItem>
            <SelectItem value="developer">Développeur</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="vendor">Vendeur</SelectItem>
            <SelectItem value="customer">Client</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={demoOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setDemoOnly((v) => !v)}
          className="gap-1.5 shrink-0"
        >
          <FlaskConical className="size-3.5" />
          Démo
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkBan}
              className="gap-1.5"
            >
              <ShieldOff className="size-3.5" />
              Bannir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkUnban}
              className="gap-1.5"
            >
              <ShieldCheck className="size-3.5" />
              Débannir
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowBulkDelete(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clear}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Users className="size-12 opacity-25" />
          <p className="text-sm">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAll(filteredIds)}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow
                  key={user._id}
                  className={`${user.is_banned ? "opacity-60" : ""} cursor-pointer hover:bg-muted/50`}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        '[role="checkbox"], [role="menuitem"], button',
                      )
                    )
                      return;
                    router.push(`/admin/users/${user._id}`);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(user._id)}
                      onCheckedChange={() => toggle(user._id)}
                      aria-label={`Sélectionner ${user.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {user.is_banned ? (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          banni
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          actif
                        </Badge>
                      )}
                      {user.is_demo && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 gap-1">
                          <FlaskConical className="size-2.5" />
                          démo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user._creationTime)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {user.last_login_at ? formatDate(user.last_login_at) : "—"}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRoleTarget(user)}>
                          Changer le rôle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={
                            user.is_banned
                              ? "text-green-600"
                              : "text-destructive"
                          }
                          onClick={() => setBanTarget(user)}
                          disabled={user.role === "admin"}
                        >
                          {user.is_banned ? "Débannir" : "Bannir"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(user)}
                          disabled={user.role === "admin"}
                        >
                          Supprimer le compte
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChangeRoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} />
      <BanDialog user={banTarget} onClose={() => setBanTarget(null)} />
      <DeleteUserDialog
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      {showBulkDelete && (
        <BulkDeleteDialog
          count={selectedCount}
          onConfirm={handleBulkDelete}
          onClose={() => setShowBulkDelete(false)}
        />
      )}
    </div>
  );
}
