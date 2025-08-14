const MOCK_USER = {
      email: "demo@site.test",
      password: "demopass"
    };
    function randomCode(length = 32) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
    }
    function b64url(str) {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const el = sel => document.querySelector(sel);

    const form = el('#loginForm');
    const email = el('#email');
    const password = el('#password');
    const msg = el('#message');
    const btn = el('#loginBtn');
    const panel = el('#codePanel');
    const successBanner = el('#successBanner');
    const codeBox = el('#authCode');
    const tokenBox = el('#tokenBox');
    const exchangeBtn = el('#exchangeBtn');
    el('#toggleEye').addEventListener('click', () => {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
    });
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      email.value = remembered;
      el('#remember').checked = true;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.textContent = '';
      tokenBox.textContent = '';

      if (!email.value || !password.value) {
        msg.innerHTML = '<div class="error">Please fill in both fields.</div>';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        msg.innerHTML = '<div class="error">Enter a valid email address.</div>';
        email.focus();
        return;
      }
      if (password.value.length < 6) {
        msg.innerHTML = '<div class="error">Password must be at least 6 characters.</div>';
        password.focus();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Signing in…';

      setTimeout(() => {
        const ok = email.value === MOCK_USER.email && password.value === MOCK_USER.password;
        if (!ok) {
          msg.innerHTML = '<div class="error">Invalid credentials (hint: demo@site.test / demopass).</div>';
          btn.disabled = false;
          btn.textContent = 'Sign in';
          return;
        }

        if (el('#remember').checked) {
          localStorage.setItem('rememberedEmail', email.value);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        const authCode = randomCode(24);
        const pkceVerifier = randomCode(64);
        const pkceChallenge = b64url(
          pkceVerifier
        );
        sessionStorage.setItem('demo_auth_code', authCode);
        sessionStorage.setItem('demo_pkce_verifier', pkceVerifier);
        sessionStorage.setItem('demo_pkce_challenge', pkceChallenge);

        successBanner.hidden = false;
        codeBox.textContent = authCode;
        panel.style.display = 'grid';

        msg.innerHTML = '<div class="success">Signed in! (Client-side demo)</div>';
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }, 700);
    });
    exchangeBtn.addEventListener('click', async () => {
      const code = sessionStorage.getItem('demo_auth_code');
      if (!code) {
        tokenBox.textContent = 'No code found. Sign in first.';
        return;
      }
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now()/1000);
      const payload = {
        sub: 'user_demo_123',
        email: email.value,
        iss: 'https://auth.example.com',
        aud: 'your-spa-client-id',
        iat: now,
        exp: now + 3600,
        scope: 'read:profile'
      };
      const enc = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
      const signature = b64url('signature');
      const token = enc + '.' + signature;

      tokenBox.textContent = token;
    });
  