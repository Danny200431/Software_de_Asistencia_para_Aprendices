import {
  getLoginController,
  postLoginController
} from "@/src/server/controllers/auth.controller";

export async function POST(request: Request) {
  return postLoginController(request);
}

export async function GET(request: Request) {
  return getLoginController(request);
}
