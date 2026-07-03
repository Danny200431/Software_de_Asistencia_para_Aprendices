const { execSync } = require("node:child_process");

try {
  require("dotenv").config();
} catch {
  /* dotenv opcional: si no carga, se usa process.env tal cual */
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

/**
 * Determina si la URL de la base de datos apunta a un servidor remoto/produccion.
 * Se considera "seguro" (local) solo localhost o 127.0.0.1.
 */
function esBaseRemota(databaseUrl) {
  if (!databaseUrl) return true; // sin URL, mejor asumir peligro
  let host = "";
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    // Si no se puede parsear, lo tratamos como remoto por seguridad
    return true;
  }
  const hostLower = host.toLowerCase();
  const esLocal = hostLower === "localhost" || hostLower === "127.0.0.1" || hostLower === "::1";
  return !esLocal;
}

function abortar(mensaje) {
  console.error("\n\u26D4  RESET CANCELADO");
  console.error(mensaje);
  console.error("");
  process.exit(1);
}

function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const remota = esBaseRemota(databaseUrl);
  let hostMostrado = "(desconocido)";
  try {
    hostMostrado = new URL(databaseUrl).hostname;
  } catch {
    /* ignore */
  }

  if (remota) {
    // La base NO es local. Este comando borra TODO (DROP SCHEMA). Exigimos confirmaciones explicitas.
    console.log(`\u26A0\uFE0F  La DATABASE_URL apunta a un servidor REMOTO: ${hostMostrado}`);
    console.log("Este comando ejecuta DROP SCHEMA public CASCADE y BORRA TODOS LOS DATOS.");

    if (process.env.ALLOW_REMOTE_RESET !== "si") {
      abortar(
        "La base es remota/produccion. Para permitirlo debes ejecutar:\n" +
          "  ALLOW_REMOTE_RESET=si CONFIRM_RESET=BORRAR_TODO npm run reset\n" +
          "Si NO querias borrar produccion, no hagas nada: tus datos estan a salvo."
      );
    }

    if (process.env.CONFIRM_RESET !== "BORRAR_TODO") {
      abortar(
        "Falta la confirmacion explicita. Vuelve a ejecutar con:\n" +
          "  ALLOW_REMOTE_RESET=si CONFIRM_RESET=BORRAR_TODO npm run reset"
      );
    }

    console.log("\u2705  Confirmaciones recibidas. Continuando con el reset REMOTO...\n");
  }

  console.log("Reseteando esquema public...");

  run(
    `npx prisma db execute --schema prisma/schema.prisma --stdin <<'EOF'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
EOF`
  );

  console.log("Aplicando schema...");
  run("npx prisma db push");

  console.log("Ejecutando seed...");
  run("npx prisma db seed");

  console.log("Reset finalizado.");
}

main();
