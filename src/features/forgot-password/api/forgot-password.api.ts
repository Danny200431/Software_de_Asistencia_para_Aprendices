import axios from "axios";
import {
  forgotPasswordResponseSchema,
  resetPasswordResponseSchema
} from "../config/schemas/forgot-password.schema";
import type {
  ForgotPasswordInput,
  ForgotPasswordResponse,
  ResetPasswordInput,
  ResetPasswordResponse
} from "../config/types/forgot-password.types";

export class ForgotPasswordApi {
  async requestReset(payload: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    const response = await axios.post("/api/auth/forgot-password", payload, {
      headers: { "Content-Type": "application/json" }
    });

    return forgotPasswordResponseSchema.parse(response.data);
  }

  async resetPassword(payload: {
    token: string;
    contrasenia: string;
  }): Promise<ResetPasswordResponse> {
    const response = await axios.post("/api/auth/reset-password", payload, {
      headers: { "Content-Type": "application/json" }
    });

    return resetPasswordResponseSchema.parse(response.data);
  }
}

export type { ResetPasswordInput };
