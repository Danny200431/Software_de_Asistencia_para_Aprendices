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

  await prisma.rol.upsert({
    where: { idRol: 3 },
    update: {},
    create: {
      idRol: 3,
      nombreRol: "Administrador"
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
      usemame: "cperez",
      contrasenia: "hashed_demo_3",
      qrCode: "QR-CARLOS-2001",
      rolIdRol: 2,
      tipoDocumentoIdTipoDocumento: 1
    },
    {
      idUsuario: 3001,
      nombre: "Sara",
      apellido: "Admin",
      correoElectronico: "sara.admin@example.com",
      telefono: "3000003001",
      numeroDocumento: "3003001",
      idTipoDocumento: "CC",
      idGenero: "F",
      usemame: "sadmin",
      contrasenia: "hashed_demo_4",
      qrCode: "QR-SARA-3001",
      rolIdRol: 3,
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

  const fichas = [
    {
      idFicha: 287001,
      numeroFicha: "287001",
      idProgramaFormacion: "PF-001",
      usuarioIdUsuario: 1001,
      usuarioRolIdRol: 1
    },
    {
      idFicha: 287002,
      numeroFicha: "287002",
      idProgramaFormacion: "PF-002",
      usuarioIdUsuario: 1002,
      usuarioRolIdRol: 1
    }
  ];

  for (const ficha of fichas) {
    await prisma.ficha.upsert({
      where: { idFicha: ficha.idFicha },
      update: ficha,
      create: ficha
    });
  }

  const aprendices = [
    { fichaIdFicha: 287001, usuarioIdUsuario: 1001 },
    { fichaIdFicha: 287002, usuarioIdUsuario: 1002 }
  ];

  for (const aprendiz of aprendices) {
    await prisma.aprendiz.upsert({
      where: {
        fichaIdFicha_usuarioIdUsuario: {
          fichaIdFicha: aprendiz.fichaIdFicha,
          usuarioIdUsuario: aprendiz.usuarioIdUsuario
        }
      },
      update: aprendiz,
      create: aprendiz
    });
  }

  await prisma.instructor.upsert({
    where: { usuarioIdUsuario: 2001 },
    update: { usuarioIdUsuario: 2001 },
    create: { usuarioIdUsuario: 2001 }
  });

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
