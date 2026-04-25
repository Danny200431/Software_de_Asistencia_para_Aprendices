import axios from "axios";
import {
  createTestInputSchema,
  createTestResponseSchema
} from "../config/schemas/test.schema";
import type {
  CreateTestInput,
  CreateTestResponse
} from "../config/types/test.types";

export async function createTestInputApi(
  payload: CreateTestInput
): Promise<CreateTestResponse> {
  const validPayload = createTestInputSchema.parse(payload);
  const response = await axios.post("/api/test", validPayload, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  return createTestResponseSchema.parse(response.data);
}
