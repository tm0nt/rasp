-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    bonus_balance DECIMAL(10,2) DEFAULT 0.00,
    referral_code VARCHAR(10) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id),
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    referral_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_bets INTEGER DEFAULT 0,
    won_bets INTEGER DEFAULT 0,
    lost_bets INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de categorias de jogos
CREATE TABLE game_categories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    max_prize_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de compras de jogos
CREATE TABLE game_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    category_id INTEGER NOT NULL REFERENCES game_categories(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de resultados de jogos
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES game_purchases(id),
    user_id UUID NOT NULL REFERENCES users(id),
    category_id INTEGER NOT NULL REFERENCES game_categories(id),
    result VARCHAR(10) NOT NULL, -- win, lose
    prize_name VARCHAR(255),
    prize_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- deposit, withdrawal, bet, win, bonus
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
    payment_method VARCHAR(20), -- pix, credit_card, bonus
    external_transaction_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Tabela de saques
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL, -- email, phone, cpf, random
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, rejected
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Tabela de logs de erro
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context VARCHAR(100),
    url VARCHAR(500),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de eventos de analytics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_game_purchases_user_id ON game_purchases(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);

-- Inserir categorias padrão
INSERT INTO game_categories (title, subtitle, description, price, image_url, max_prize_value) VALUES
('PIX na conta', 'PRÊMIOS ATÉ R$ 2000,00', 'Raspe e receba prêmios em DINHEIRO $$$ até R$2.000 diretamente no seu PIX', 0.50, '/images/money.png', 2000.00),
('Sonho de Consumo 😍', 'PRÊMIOS ATÉ R$ 8000,00', 'Celular, eletrônicos e componentes, receba prêmios exclusivos de alto valor agregado', 2.00, '/images/tech-products.png', 8000.00),
('Me mimei', 'PRÊMIOS ATÉ R$ 800,00', 'Shopee, shein, presentinhos... Quer se mimar mas tá muito caro? Não se preocupe, é só dar sorte!', 2.50, '/images/luxury-items.png', 800.00),
('Super Prêmios', 'PRÊMIOS ATÉ R$ 12000,00', 'Cansado de ficar a pé? Essa sua chance de sair motorizado, prêmios de até R$12.000', 5.00, '/images/vehicles.png', 12000.00);
