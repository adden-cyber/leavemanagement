const fetch = require('node-fetch');

(async () => {
  try {
    const c = await fetch('http://localhost:3002/api/auth/csrf');
    const d = await c.json();
    const t = d.csrfToken;
    const params = new URLSearchParams();
    params.append('csrfToken', t);
    params.append('email', 'admin@hr.com');
    params.append('password', 'adminpassword');

    const r = await fetch('http://localhost:3002/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'manual',
    });

    console.log('status', r.status);
    for (const [k, v] of r.headers.entries()) {
      console.log('h', k, v);
    }
    const txt = await r.text();
    console.log('body', txt);
  } catch (err) {
    console.error(err);
  }
})();
