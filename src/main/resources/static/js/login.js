const form = document.getElementById('form');
const error = document.getElementById('error');
const submit = document.getElementById('submit');

/* Already signed in? Skip the form. */
if (Store.accessToken) {
    window.location.replace('dashboard.html');
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Logging in…';

    const email = form.email.value.trim();

    try {
        const tokens = await Api.login(email, form.password.value);
        Store.save(tokens, email);
        window.location.replace('dashboard.html');
    } catch (e) {
        error.textContent = e.status === 401
            ? 'Wrong email or password.'
            : e.message;
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Log in';
    }
});
