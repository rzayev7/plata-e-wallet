const SYMBOLS = {AZN: '₼', USD: '$', EUR: '€'};

const el = (id) => document.getElementById(id);

function show(node, message, visible = true) {
    node.textContent = message;
    node.hidden = !visible;
}

function formatAmount(balance, currency) {
    const value = Number(balance ?? 0);
    const amount = Number.isFinite(value)
        ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
        : balance;
    return `${SYMBOLS[currency] ?? ''}${amount}`;
}

/* Tolerates a bare array or a { accounts: [...] } wrapper. */
function normalise(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.accounts)) return payload.accounts;
    return [];
}

/*
 * The API stores minor units but reports the balance in major units, so the
 * form converts on the way in. Doing money arithmetic in the browser is the
 * wrong place for it; it is here only because the backend has no major-unit
 * deposit endpoint yet.
 */
function toMinorUnits(majorInput) {
    const value = Number(majorInput);
    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }
    return Math.round(value * 100);
}

function renderDepositForm(account, card) {
    const form = document.createElement('form');
    form.className = 'deposit';

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.min = '0.01';
    input.placeholder = '0.00';
    input.setAttribute('aria-label', `Deposit amount in ${account.currency}`);

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Deposit';

    const note = document.createElement('p');
    note.className = 'note error';
    note.hidden = true;

    form.append(input, button);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        note.hidden = true;

        const minor = toMinorUnits(input.value);
        if (minor === null) {
            show(note, 'Enter an amount greater than zero.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Sending...';
        try {
            await Api.deposit(account.id, minor);
            input.value = '';
            await loadAccounts();
        } catch (error) {
            if (error.status === 401) {
                Store.clear();
                window.location.replace('login.html');
                return;
            }
            show(note, error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Deposit';
        }
    });

    card.append(form, note);
}

function renderAccount(account) {
    const card = document.createElement('article');
    card.className = 'account';

    const status = (account.status ?? 'ACTIVE').toString();

    const top = document.createElement('div');
    top.className = 'top';

    const sigil = document.createElement('span');
    sigil.className = 'sigil';
    sigil.textContent = SYMBOLS[account.currency] ?? '•';

    const code = document.createElement('span');
    code.className = 'code';
    code.textContent = account.currency ?? '—';

    const pill = document.createElement('span');
    pill.className = `pill ${status.toLowerCase()}`;
    pill.textContent = status;

    const spacer = document.createElement('div');
    spacer.style.flex = '1';

    top.append(sigil, code, spacer, pill);

    const amount = document.createElement('p');
    amount.className = 'amount';
    amount.textContent = formatAmount(account.balance, account.currency);

    card.append(top, amount);

    if (account.id) {
        const id = document.createElement('p');
        id.className = 'id';
        id.textContent = String(account.id).slice(0, 8);
        card.append(id);
        renderDepositForm(account, card);
    }

    return card;
}

function renderAccounts(accounts) {
    const container = el('accounts');
    container.replaceChildren(...accounts.map(renderAccount));

    el('accountsEmpty').hidden = accounts.length > 0;
    el('accountsCount').textContent =
        accounts.length === 1 ? '1 account' : `${accounts.length} accounts`;

    el('heroCount').textContent = String(accounts.length);
    el('heroHeadline').textContent = accounts.length
        ? accounts.map((a) => formatAmount(a.balance, a.currency)).join('   ·   ')
        : 'No balance yet';

    const status = el('heroStatus');
    status.textContent = 'ACTIVE';
    status.className = 'pill';

    /* One account per currency is enforced by uq_account_owner_currency (V6). */
    const taken = new Set(accounts.map((a) => a.currency));
    let firstFree = null;
    for (const option of el('currency').options) {
        option.disabled = taken.has(option.value);
        if (!option.disabled && firstFree === null) {
            firstFree = option.value;
        }
    }
    if (firstFree !== null) {
        el('currency').value = firstFree;
    }
    el('createButton').disabled = firstFree === null;
    if (firstFree === null) {
        show(el('createError'), 'You already have an account in every supported currency.');
    }
}

async function loadAccounts() {
    try {
        renderAccounts(normalise(await Api.listAccounts()));
        el('pageError').hidden = true;
    } catch (error) {
        if (error.status === 401) {
            Store.clear();
            window.location.replace('login.html');
            return;
        }
        el('accounts').replaceChildren();
        el('accountsEmpty').hidden = true;
        el('heroHeadline').textContent = 'Unavailable';
        el('heroCount').textContent = '—';
        show(el('pageError'), `Could not load accounts: ${error.message}`);
    }
}

el('createForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    el('createError').hidden = true;
    el('createSuccess').hidden = true;

    const button = el('createButton');
    button.disabled = true;
    button.textContent = 'Opening…';

    try {
        const account = await Api.createAccount(el('currency').value);
        show(el('createSuccess'), `${account?.currency ?? el('currency').value} account opened.`);
        await loadAccounts();
    } catch (error) {
        if (error.status === 401) {
            Store.clear();
            window.location.replace('login.html');
            return;
        }
        show(el('createError'), error.message);
    } finally {
        button.textContent = 'Open account';
        button.disabled = false;
    }
});

el('logout').addEventListener('click', async () => {
    try {
        await Api.logout();
    } catch (ignored) {
        /* log out locally regardless */
    }
    Store.clear();
    window.location.replace('login.html');
});

if (requireAuth()) {
    el('who').textContent = Store.email ?? '';
    loadAccounts();
}
