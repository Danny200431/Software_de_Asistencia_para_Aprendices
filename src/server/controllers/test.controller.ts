import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { parseCreateTestInput } from "@/src/server/config/dtos/test.dto";
import { createTestService } from "@/src/server/services/test.service";

export async function postTestController(request: Request) {
  try {
    const body = await request.json();
    const dto = parseCreateTestInput(body);
    const result = await createTestService(dto.dato);

    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Entrada invalida";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
