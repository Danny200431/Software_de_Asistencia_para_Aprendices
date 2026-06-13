export type ForgotPasswordInput = {
  identificador: string;
};

export type ResetPasswordInput = {
  token: string;
  contrasenia: string;
  confirmarContrasenia: string;
};

export type ForgotPasswordResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

export type ResetPasswordResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};
