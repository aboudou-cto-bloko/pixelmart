// filepath: src/app/(auth)/demo/page.tsx

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, FlaskConical, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function DemoPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const invite = useQuery(api.demo.queries.validateToken, { token });

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const activateDemo = useMutation(api.demo.mutations.activateDemoAccount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || invite.status !== "pending") return;
    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: invite.email,
        password,
        name,
      });
      if (error) {
        toast.error(error.message ?? "Erreur lors de la création du compte");
        return;
      }

      // Activate demo account (sets role=vendor, creates demo store)
      await activateDemo({ token, email: invite.email });
      toast.success("Compte démo activé !");
      router.push("/vendor/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading invite
  if (invite === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Invalid token
  if (!invite) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>
            Ce lien d&apos;invitation n&apos;existe pas ou a expiré.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Expired
  if (invite.status === "expired") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>Invitation expirée</CardTitle>
          <CardDescription>
            Ce lien a expiré. Contactez l&apos;administration Pixel-Mart pour
            obtenir un nouveau lien.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Already used
  if (invite.status === "used") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Compte déjà créé</CardTitle>
          <CardDescription>
            Ce lien a déjà été utilisé. Connectez-vous avec votre adresse{" "}
            <strong>{invite.email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Se connecter
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Valid — show registration form
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <FlaskConical className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Créer votre compte démo</CardTitle>
        <CardDescription>
          {invite.note ??
            "Explorez toutes les fonctionnalités de Pixel-Mart dans un environnement sandbox."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invite.email}
              readOnly
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Votre nom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte démo
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-xs text-muted-foreground">
        Les données créées dans ce compte sont isolées de la production.
      </CardFooter>
    </Card>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <DemoPageInner />
    </Suspense>
  );
}
