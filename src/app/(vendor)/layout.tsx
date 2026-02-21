// filepath: src/app/(dashboard)/vendor/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";
export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard roles={["vendor", "admin"]}>{children}</AuthGuard>;
}
