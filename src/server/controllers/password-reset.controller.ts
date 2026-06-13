import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseForgotPasswordInput,
  parseResetPasswordInput
} from "@/src/server/config/dtos/password-reset.dto";
import { PasswordResetService } from "@/src/server/services/password-reset.service";

export class PasswordResetController {
  constructor(
    private readonly service: PasswordResetService = new PasswordResetService()
  ) {}

  async postForgotPassword(request: Request) {
    try {
      const body = await request.json();
      const dto = parseForgotPasswordInput(body);
      const result = await this.service.requestReset(dto.identificador);

      return NextResponse.json(
        { ok: true, message: result.message },
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

  async postResetPassword(request: Request) {
    try {
      const body = await request.json();
      const dto = parseResetPasswordInput(body);
      const result = await this.service.resetPassword(dto.token, dto.contrasenia);

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json(
        { ok: true, message: result.message },
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
}
