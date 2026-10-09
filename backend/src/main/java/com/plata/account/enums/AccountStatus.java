package com.plata.account.enums;

public enum AccountStatus {
    ACTIVE,
    FROZEN,
    CLOSED;

    public boolean canReceive() {
        return this != CLOSED;
    }
    public boolean canSend(){
        return this!=CLOSED && this!=FROZEN;
    }
}
