import { AuthController } from "@/src/server/controllers/auth.controller";

export async function POST(request: Request) {
  const authController = new AuthController();
  return authController.postLogin(request);
}

export async function GET(request: Request) {
  const authController = new AuthController();
  return authController.getLogin(request);
}
