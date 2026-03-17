// simple Node script to POST to NextAuth credentials callback

const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    // get csrf token
    const csrfRes = await fetch('http://localhost:3002/api/auth/csrf');
    const data = await csrfRes.json();
    const csrfToken = data.csrfToken;
    console.log('csrfToken', csrfToken);

    const params = new URLSearchParams();
    params.append('csrfToken', csrfToken);
    params.append('email', 'employee@example.com');
    params.append('password', '123456');

    const loginRes = await fetch('http://localhost:3002/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'manual'
    });
    console.log('status', loginRes.status);
    // log all headers for debugging
    loginRes.headers.forEach((val, key) => {
      console.log('header', key, val);
    });
    const body = await loginRes.text();
    console.log('body', body);
  } catch (e) {
    console.error(e);
  }
})();