#!/usr/bin/env node

(async () => {
  try {
    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@olive.school', password: 'AdminPass123!' }),
    });

    const text = await res.text();
    console.log('status', res.status);
    console.log(text);

    if (!res.ok) {
      process.exit(1);
    }
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
