const { execSync } = require("node:child_process");

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function main() {
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
