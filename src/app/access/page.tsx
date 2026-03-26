// Server component — lit searchParams sans useSearchParams() côté client
import { AccessForm } from "./AccessForm";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <AccessForm from={from ?? "/"} />;
}
