// filepath: src/app/(vendor)/vendor/ads/payment-callback/page.tsx

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("paymentStatus");
  const bookingId = searchParams.get("bookingId");

  const isSuccess = paymentStatus === "success";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          {isSuccess ? (
            <>
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold">Paiement confirmé</h1>
              <p className="text-muted-foreground">
                Votre espace publicitaire sera activé dès le début de la période
                réservée.
              </p>
            </>
          ) : (
            <>
              <XCircle className="size-16 text-red-500 mx-auto" />
              <h1 className="text-xl font-bold">Paiement échoué</h1>
              <p className="text-muted-foreground">
                Le paiement n'a pas pu être finalisé. Veuillez réessayer.
              </p>
            </>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/vendor/ads">
                Voir mes publicités
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/vendor/dashboard">Tableau de bord</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdPaymentCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
