import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseLoginInput } from "@/src/server/config/dtos/auth.dto";
import { verifyAuthToken } from "@/src/server/config/auth/jwt";
import { loginService } from "@/src/server/services/auth.service";

export async function postLoginController(request: Request) {
  try {
    const body = await request.json();
    const dto = parseLoginInput(body);
    const result = await loginService(dto.usemame, dto.Contrasenia);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { ok: true, token: result.data.token, user: result.data.user },
      { status: result.status }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Entrada invalida";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function getLoginController(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Token requerido" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const user = verifyAuthToken(token);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Token invalido" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user }, { status: 200 });
}
