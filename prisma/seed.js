const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  await prisma.rol.upsert({
    where: { idRol: 1 },
    update: {},
    create: {
      idRol: 1,
      nombreRol: "Aprendiz"
    }
  });

  await prisma.rol.upsert({
    where: { idRol: 2 },
    update: {},
    create: {
      idRol: 2,
      nombreRol: "Instructor"
    }
  });

  await prisma.tipoDocumento.upsert({
    where: { idTipoDocumento: 1 },
    update: {},
    create: {
      idTipoDocumento: 1,
      nombreDocumento: "Cedula",
      tipoDocumentoCol: "CC"
    }
  });

  const users = [
    {
      idUsuario: 1001,
      nombre: "Ana",
      apellido: "Gomez",
      correoElectronico: "ana.gomez@example.com",
      telefono: "3000001001",
      numeroDocumento: "1001001",
      idTipoDocumento: "CC",
      idGenero: "F",
      idEstadoEstudiante: "ACTIVO",
      idFicha: "287001",
      usemame: "agomez",
      contrasenia: "hashed_demo_1",
      qrCode: "QR-ANA-1001",
      rolIdRol: 1,
      tipoDocumentoIdTipoDocumento: 1
    },
    {
      idUsuario: 1002,
      nombre: "Luis",
      apellido: "Martinez",
      correoElectronico: "luis.martinez@example.com",
      telefono: "3000001002",
      numeroDocumento: "1001002",
      idTipoDocumento: "CC",
      idGenero: "M",
      idEstadoEstudiante: "ACTIVO",
      idFicha: "287002",
      usemame: "lmartinez",
      contrasenia: "hashed_demo_2",
      qrCode: "QR-LUIS-1002",
      rolIdRol: 1,
      tipoDocumentoIdTipoDocumento: 1
    },
    {
      idUsuario: 2001,
      nombre: "Carlos",
      apellido: "Perez",
      correoElectronico: "carlos.perez@example.com",
      telefono: "3000002001",
      numeroDocumento: "2002001",
      idTipoDocumento: "CC",
      idGenero: "M",
      idEstadoEstudiante: "ACTIVO",
      idFicha: "DOCENTE-01",
      usemame: "cperez",
      contrasenia: "hashed_demo_3",
      qrCode: "QR-CARLOS-2001",
      rolIdRol: 2,
      tipoDocumentoIdTipoDocumento: 1
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.contrasenia, BCRYPT_ROUNDS);

    await prisma.usuario.upsert({
      where: {
        idUsuario_rolIdRol: {
          idUsuario: user.idUsuario,
          rolIdRol: user.rolIdRol
        }
      },
      update: {
        nombre: user.nombre,
        apellido: user.apellido,
        correoElectronico: user.correoElectronico,
        telefono: user.telefono,
        numeroDocumento: user.numeroDocumento,
        usemame: user.usemame,
        contrasenia: hashedPassword,
        qrCode: user.qrCode
      },
      create: {
        ...user,
        contrasenia: hashedPassword
      }
    });
  }

  console.log("Seed ejecutado: usuarios ficticios insertados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
