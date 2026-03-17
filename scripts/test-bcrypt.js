const bcrypt = require('bcryptjs');
(async () => {
    const hash = '$2b$10$yeTKEOjyN11E8PwzEJ4IiOz4ut3kvvCr7XeWcH825cmz/5q1Yu11i';
    const ok = await bcrypt.compare('123456', hash);
    console.log('compare result', ok);
})();