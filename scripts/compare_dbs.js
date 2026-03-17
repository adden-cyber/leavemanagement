const sqlite3 = require('sqlite3').verbose();
const paths=[
  'D:/HR system/prisma/dev.db',
  'D:/HR system/prisma/prisma/dev.db'
];
(async()=>{
  for(const p of paths){
    console.log('opening',p);
    await new Promise(res=>{
      const db=new sqlite3.Database(p,(e)=>{
        if(e) return console.error('open error',e);
      });
      db.all("PRAGMA table_info('Goal');",(err,rows)=>{
        console.log('rows from',p,rows);
        db.close();
        res();
      });
    });
  }
})();
