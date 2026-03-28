// filepath: src/components/admin/templates/AdminUsersTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Users, Search } from "lucide-react";
import { formatDate } from "@/lib/format";
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

// ─── Types ────────────────────────────────────────────────────

type UserRole = "admin" | "vendor" | "customer" | "agent";

type UserItem = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: UserRole;
  is_banned: boolean;
  is_verified: boolean;
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
    vendor: "bg-purple-100 text-purple-700 border-purple-300",
    customer: "bg-blue-100 text-blue-700 border-blue-300",
    agent: "bg-orange-100 text-orange-700 border-orange-300",
  };
  return <Badge className={map[role]}>{role}</Badge>;
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
            <Select
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="vendor">vendor</SelectItem>
                <SelectItem value="customer">customer</SelectItem>
                <SelectItem value="agent">agent</SelectItem>
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

// ─── Ban Confirm Dialog ───────────────────────────────────────

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
      if (isBanned) {
        await unban({ userId: user._id });
      } else {
        await ban({ userId: user._id });
      }
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
            {loading
              ? "…"
              : isBanned
                ? "Débannir"
                : "Bannir"}
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
  const [roleTarget, setRoleTarget] = useState<UserItem | null>(null);
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      search.trim() === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="vendor">vendor</SelectItem>
            <SelectItem value="customer">customer</SelectItem>
            <SelectItem value="agent">agent</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  className={user.is_banned ? "opacity-60" : ""}
                >
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
                    {user.is_banned ? (
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        banni
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        actif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user._creationTime)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {user.last_login_at
                      ? formatDate(user.last_login_at)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setRoleTarget(user)}
                        >
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChangeRoleDialog
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
      />
      <BanDialog user={banTarget} onClose={() => setBanTarget(null)} />
    </div>
  );
}
