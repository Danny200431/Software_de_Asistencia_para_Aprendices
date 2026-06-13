export type ForgotPasswordInput = {
  identificador: string;
};

export type ResetPasswordInput = {
  token: string;
  contrasenia: string;
};
