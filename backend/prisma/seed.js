const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Broadcast-Daten...');

  // Beispiel-Broadcasts für bekannte Bundesliga-Sender
  // Werden später über API-Football befüllt
  console.log('Seed abgeschlossen.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
