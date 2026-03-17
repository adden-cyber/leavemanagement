const { PrismaClient } = require('@prisma/client');
async function run(url){
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  console.log('using', url);
  try{
    await prisma.$executeRaw`ALTER TABLE Goal ADD COLUMN rating TEXT;`;
    console.log('alter succeeded');
  }catch(e){
    console.error('alter error', e.message);
  }
  const cols=await prisma.$queryRaw`PRAGMA table_info('Goal');`;
  console.log('cols',cols);
  await prisma.$disconnect();
}
(async()=>{
  await run('file:D:/HR system/prisma/dev.db');
})();