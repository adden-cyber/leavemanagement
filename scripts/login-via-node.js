// use built-in fetch (Node >=18) to perform login with cookie handling

(async () => {
  try {
    // fetch CSRF token and cookie
    const csrfRes = await fetch('http://localhost:3002/api/auth/csrf');
    // Node's built-in fetch returns headers with get()
    const setCookie = csrfRes.headers.get('set-cookie');
    let cookieHeader = '';
    if (setCookie) {
      // if multiple cookies, they are separated by comma
      cookieHeader = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
    }
    const data = await csrfRes.json();
    const token = data.csrfToken;
    console.log('csrfToken', token);
    console.log('cookieHeader', cookieHeader);

    const params = new URLSearchParams({
      csrfToken: token,
      email: 'employee@example.com',
      password: '123456'
    });

    const loginRes = await fetch('http://localhost:3002/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader
      },
      body: params.toString(),
      redirect: 'manual'
    });

    console.log('login status', loginRes.status);
    console.log('login location', loginRes.headers.get('location'));
    console.log('login body', await loginRes.text());
  } catch (e) {
    console.error('error', e);
  }
})();