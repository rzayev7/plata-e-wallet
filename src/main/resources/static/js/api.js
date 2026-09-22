/* Thin API layer: token storage, auth headers, transparent refresh. */

const Store = {
    ACCESS: 'plata.accessToken',
    REFRESH: 'plata.refreshToken',
    EMAIL: 'plata.email',

    get accessToken() {
        return localStorage.getItem(Store.ACCESS);
    },
    get refreshToken() {
        return localStorage.getItem(Store.REFRESH);
    },
    get email() {
        return localStorage.getItem(Store.EMAIL);
    },

    save(tokens, email) {
        localStorage.setItem(Store.ACCESS, tokens.accessToken);
        localStorage.setItem(Store.REFRESH, tokens.refreshToken);
        if (email) {
            localStorage.setItem(Store.EMAIL, email);
        }
    },

    clear() {
        localStorage.removeItem(Store.ACCESS);
        localStorage.removeItem(Store.REFRESH);
        localStorage.removeItem(Store.EMAIL);
    }
};

/* The backend answers errors with ErrorResponse { timestamp, status, error, message }. */
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function readError(response, fallback) {
    try {
        const body = await response.json();
        if (body && body.message) {
            return new ApiError(response.status, body.message);
        }
    } catch (ignored) {
        /* empty or non-JSON body */
    }
    return new ApiError(response.status, fallback);
}

async function request(path, {method = 'GET', body, auth = false} = {}) {
    const send = () => {
        const headers = {};
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        if (auth && Store.accessToken) {
            headers['Authorization'] = `Bearer ${Store.accessToken}`;
        }
        return fetch(path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    };

    let response = await send();

    /* Access token expired: spend the refresh token once, then retry. */
    if (response.status === 401 && auth && Store.refreshToken) {
        if (await tryRefresh()) {
            response = await send();
        }
    }

    if (response.status === 401 && auth) {
        Store.clear();
        throw new ApiError(401, 'Your session expired. Please log in again.');
    }

    if (!response.ok) {
        throw await readError(response, `Request failed (${response.status})`);
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function tryRefresh() {
    try {
        const response = await fetch('/customers/refresh', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({refreshToken: Store.refreshToken})
        });
        if (!response.ok) {
            return false;
        }
        Store.save(await response.json());
        return true;
    } catch (ignored) {
        return false;
    }
}

const Api = {
    register: (customer) =>
        request('/customers/create', {method: 'POST', body: customer}),

    login: (email, password) =>
        request('/customers/login', {method: 'POST', body: {email, password}}),

    logout: () =>
        request('/customers/logout', {method: 'POST', body: {refreshToken: Store.refreshToken}}),

    listAccounts: () =>
        request('/accounts', {auth: true}),

    createAccount: (currency) =>
        request('/accounts/create', {method: 'POST', body: {currency}, auth: true}),

    /* The backend takes minor units, so 5.00 goes over the wire as 500. */
    deposit: (accountId, minorAmount) =>
        request(`/accounts/${accountId}/deposit`, {
            method: 'POST',
            body: {amount: minorAmount},
            auth: true
        })
};

/* Send anyone without a token back to the login page. */
function requireAuth() {
    if (!Store.accessToken) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}
