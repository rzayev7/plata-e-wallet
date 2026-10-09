const form = document.getElementById('form');
const error = document.getElementById('error');
const submit = document.getElementById('submit');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Creating…';

    const email = form.email.value.trim();
    const password = form.rawPassword.value;

    try {
        await Api.register({
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            email,
            phoneNumber: form.phoneNumber.value.trim(),
            rawPassword: password
        });

        /* Signing up also creates the wallet, so go straight in. */
        const tokens = await Api.login(email, password);
        Store.save(tokens, email);
        window.location.replace('dashboard.html');
    } catch (e) {
        error.textContent = e.status === 409
            ? 'That email is already registered.'
            : e.message;
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Sign up';
    }
});
