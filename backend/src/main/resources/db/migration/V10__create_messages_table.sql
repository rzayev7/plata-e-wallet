CREATE TABLE messages
(
    id           UUID PRIMARY KEY,
    sender_id    UUID                     NOT NULL,
    recipient_id UUID                     NOT NULL,
    content      TEXT                     NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
            REFERENCES customers (id),

    CONSTRAINT fk_message_recipient
        FOREIGN KEY (recipient_id)
            REFERENCES customers (id)
);

CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_messages_recipient ON messages (recipient_id);