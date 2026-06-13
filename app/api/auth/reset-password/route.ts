import { PasswordResetController } from "@/src/server/controllers/password-reset.controller";

export async function POST(request: Request) {
  const controller = new PasswordResetController();
  return controller.postResetPassword(request);
}
