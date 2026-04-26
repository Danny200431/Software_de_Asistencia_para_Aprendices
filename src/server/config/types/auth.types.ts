export type LoginInput = {
  usemame: string;
  Contrasenia: string;
};

export type AuthUserPayload = {
  id: number;
  usemame: string;
  nombre: string;
  apellido: string;
  rol: string;
  correo_electronico: string;
};
