const { PrismaClient } = require('@prisma/client');
async function check(url){
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  console.log('connecting to', url);
  const dbs = await prisma.$queryRaw`PRAGMA database_list;`;
  console.log('database_list for',url, dbs);
  const cols = await prisma.$queryRaw`PRAGMA table_info('Goal');`;
  console.log('columns:',cols);
  await prisma.$disconnect();
}
(async()=>{
  await check('file:D:/HR system/prisma/dev.db');
  await check('file:D:/HR system/prisma/prisma/dev.db');
})();
