import { postTestController } from "@/src/server/controllers/test.controller";

export async function POST(request: Request) {
  return postTestController(request);
}
