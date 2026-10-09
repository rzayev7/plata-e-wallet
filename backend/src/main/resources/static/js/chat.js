const el = (id) => document.getElementById(id);

const ownId = Store.customerId;
let activeContact = null;
let socket = null;

function initials(customer) {
    return `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase();
}

function renderContacts(customers) {
    const list = customers.filter((c) => c.id !== ownId);
    const container = el('contacts');

    if (list.length === 0) {
        container.replaceChildren(Object.assign(document.createElement('p'), {
            className: 'empty-contacts',
            textContent: 'No other customers yet.'
        }));
        return;
    }

    container.replaceChildren(...list.map((customer) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'contact';
        button.dataset.id = customer.id;

        const avatar = document.createElement('span');
        avatar.className = 'avatar';
        avatar.textContent = initials(customer);

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = `${customer.firstName} ${customer.lastName}`;

        button.append(avatar, name);
        button.addEventListener('click', () => selectContact(customer));
        return button;
    }));
}

function renderMessage(message) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + (message.senderId === ownId ? 'mine' : 'theirs');
    bubble.textContent = message.content;
    return bubble;
}

async function selectContact(customer) {
    activeContact = customer;

    for (const button of el('contacts').querySelectorAll('.contact')) {
        button.classList.toggle('active', button.dataset.id === customer.id);
    }

    el('threadHeader').textContent = `${customer.firstName} ${customer.lastName}`;
    el('messageInput').disabled = false;
    el('sendButton').disabled = false;

    const thread = el('threadMessages');
    thread.replaceChildren();
    try {
        const history = await Api.getConversation(customer.id);
        thread.replaceChildren(...history.map(renderMessage));
        thread.scrollTop = thread.scrollHeight;
    } catch (error) {
        show(el('pageError'), `Could not load messages: ${error.message}`);
    }
}

function show(node, message) {
    node.textContent = message;
    node.hidden = false;
}

function connectSocket() {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${scheme}://${location.host}/ws/chat?token=${encodeURIComponent(Store.accessToken)}`);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const belongsToOpenThread = activeContact &&
            (message.senderId === activeContact.id || message.recipientId === activeContact.id);

        if (belongsToOpenThread) {
            const thread = el('threadMessages');
            thread.append(renderMessage(message));
            thread.scrollTop = thread.scrollHeight;
        }
    };

    socket.onclose = () => {
        show(el('pageError'), 'Chat connection lost. Reload the page to reconnect.');
    };
}

el('sendForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = el('messageInput');
    const content = input.value.trim();
    if (!content || !activeContact || !socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(JSON.stringify({recipientId: activeContact.id, content}));
    input.value = '';
});

async function loadContacts() {
    try {
        const payload = await Api.listCustomers();
        renderContacts(payload.customers ?? []);
    } catch (error) {
        if (error.status === 401) {
            Store.clear();
            window.location.replace('login.html');
            return;
        }
        show(el('pageError'), `Could not load customers: ${error.message}`);
    }
}

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
    loadContacts();
    connectSocket();
}
