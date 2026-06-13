import { ResetPasswordForm } from "@/src/features/forgot-password/components/ResetPasswordForm";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function RestablecerContrasenaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return <ResetPasswordForm token={token} />;
}
