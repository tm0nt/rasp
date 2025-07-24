-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table: Stores user information, credentials, and balance.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    -- Using DECIMAL for precise currency storage
    balance DECIMAL(12, 2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scratch Card Types Table: Defines the different types of scratch cards available.
CREATE TABLE scratch_card_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prizes Table: Defines the possible prizes for each scratch card type.
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scratch_card_type_id UUID NOT NULL REFERENCES scratch_card_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    image_url VARCHAR(255),
    -- A weight system is flexible for calculating win probabilities on the server.
    probability_weight FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions Table: A ledger of all financial activities.
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    -- (deposit, withdrawal, purchase, winning)
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    -- (pending, completed, failed)
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    -- Store related info, e.g., { "game_play_id": "...", "pix_key": "..." }
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game Plays Table: Logs every scratch card game played by a user.
CREATE TABLE game_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scratch_card_type_id UUID NOT NULL REFERENCES scratch_card_types(id) ON DELETE RESTRICT,
    -- The transaction for purchasing this specific card.
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    -- The prize won, if any. NULL if it was a loss.
    prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
    is_win BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance Optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_game_plays_user_id ON game_plays(user_id);
CREATE INDEX idx_prizes_scratch_card_type_id ON prizes(scratch_card_type_id);
