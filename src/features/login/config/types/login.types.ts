export type LoginInput = {
  usemame: string;
  Contrasenia: string;
};

export type LoginUser = {
  id: number;
  nombre: string;
  apellido: string;
  usemame: string;
  rol: string;
  correo_electronico: string;
};

export type LoginResponse = {
  ok: boolean;
  token?: string;
  user?: LoginUser;
  error?: string;
};
