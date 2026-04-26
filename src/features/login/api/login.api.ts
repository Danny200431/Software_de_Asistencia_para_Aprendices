import axios from "axios";
import {
  loginInputSchema,
  loginResponseSchema
} from "../config/schemas/login.schema";
import type { LoginInput, LoginResponse } from "../config/types/login.types";

export class LoginApi {
  async login(payload: LoginInput): Promise<LoginResponse> {
    const validPayload = loginInputSchema.parse(payload);
    const response = await axios.post("/api/auth/login", validPayload, {
      headers: { "Content-Type": "application/json" }
    });

    return loginResponseSchema.parse(response.data);
  }
}
