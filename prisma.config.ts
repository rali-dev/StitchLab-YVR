import { defineConfig } from 'prisma/config';

// Prisma 7 laedt .env NICHT mehr automatisch -> hier per Node-Builtin laden.
// In CI ohne .env greift der Catch; DATABASE_URL kommt dann aus echten Env-Variablen.
try {
  process.loadEnvFile();
} catch {
  // keine .env vorhanden (z. B. CI) -> ok, Variablen kommen aus der Umgebung
}

export default defineConfig({
  schema: 'libs/backend/shared/database/prisma/schema.prisma',
  migrations: {
    path: 'libs/backend/shared/database/prisma/migrations',
  },
  datasource: {
    // Nur fuer migrate/studio/db push noetig; bei "generate" ungenutzt (darf undefined sein).
    url: process.env.DATABASE_URL,
  },
});
