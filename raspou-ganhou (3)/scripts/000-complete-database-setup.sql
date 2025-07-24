-- =====================================================
-- RASPOU GANHOU - COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates the complete database schema for the Raspou Ganhou platform
-- Run this script to set up the entire database from scratch

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS content_pages CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS referral_bonuses CASCADE;
DROP TABLE IF EXISTS bonus_transactions CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS user_bets CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS game_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table - Core user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
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
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    last_activity_at TIMESTAMP
);

-- Game categories
CREATE TABLE game_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual games within categories
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES game_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    win_probability DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    max_prize_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens for authentication
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'bonus', 'win', 'bet'
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    payment_method VARCHAR(50), -- 'pix', 'credit_card', 'bank_transfer'
    external_id VARCHAR(255), -- Payment gateway transaction ID
    description TEXT,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User bets/games played
CREATE TABLE user_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    game_id INTEGER REFERENCES games(id),
    category_id INTEGER REFERENCES game_categories(id),
    amount DECIMAL(10,2) NOT NULL,
    result VARCHAR(10) NOT NULL, -- 'win', 'lose'
    prize_name VARCHAR(255),
    prize_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Game results/prizes
CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    prize_name VARCHAR(255) NOT NULL,
    prize_value DECIMAL(10,2) NOT NULL,
    probability DECIMAL(5,4) NOT NULL,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- Bonus transactions
CREATE TABLE bonus_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(30) NOT NULL, -- 'welcome', 'referral', 'daily', 'special'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Referral bonuses
CREATE TABLE referral_bonuses (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES users(id),
    referred_id UUID REFERENCES users(id),
    bonus_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ADMIN SYSTEM TABLES
-- =====================================================

-- Admin users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator'
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin sessions
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin audit logs
CREATE TABLE admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CONTENT & SYSTEM TABLES
-- =====================================================

-- User analytics
CREATE TABLE user_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL, -- 'login', 'game_play', 'deposit', 'withdrawal'
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Content pages (terms, privacy, etc.)
CREATE TABLE content_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User notifications
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- User bets indexes
CREATE INDEX idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX idx_user_bets_game_id ON user_bets(game_id);
CREATE INDEX idx_user_bets_created_at ON user_bets(created_at);

-- Refresh tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Admin indexes
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_user_analytics_created_at ON user_analytics(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(10) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user stats
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        total_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid),
        won_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid AND result = 'win'),
        lost_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid AND result = 'lose'),
        total_earnings = (SELECT COALESCE(SUM(prize_value), 0) FROM user_bets WHERE user_id = user_uuid AND result = 'win')
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin user
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@raspouganhou.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Administrador', 'super_admin');
-- Password: admin123

-- Insert game categories
INSERT INTO game_categories (name, slug, description, image_url, sort_order) VALUES
('Cosméticos', 'cosmeticos', 'Produtos de beleza e cuidados pessoais', '/images/cosmetics.png', 1),
('Eletrônicos', 'eletronicos', 'Smartphones, tablets, notebooks e mais', '/images/electronics.png', 2),
('Veículos', 'veiculos', 'Motos, carros e acessórios automotivos', '/images/vehicles.png', 3),
('Dinheiro', 'dinheiro', 'Prêmios em dinheiro direto no PIX', '/images/money.png', 4);

-- Insert sample games for each category
INSERT INTO games (category_id, name, description, price, win_probability, max_prize_value) VALUES
-- Cosméticos
(1, 'Kit Maquiagem Completo', 'Kit completo de maquiagem profissional', 2.00, 0.1500, 150.00),
(1, 'Perfume Importado', 'Perfume importado de marca famosa', 5.00, 0.0800, 300.00),
(1, 'Chapinha Profissional', 'Chapinha profissional para cabelos', 3.00, 0.1200, 200.00),

-- Eletrônicos
(2, 'iPhone 15 Pro', 'iPhone 15 Pro 128GB', 10.00, 0.0100, 8000.00),
(2, 'Samsung Galaxy S24', 'Samsung Galaxy S24 256GB', 8.00, 0.0150, 6000.00),
(2, 'MacBook Air', 'MacBook Air M2 256GB', 15.00, 0.0050, 12000.00),
(2, 'AirPods Pro', 'AirPods Pro 2ª Geração', 5.00, 0.0800, 1500.00),

-- Veículos
(3, 'Honda CG 160', 'Moto Honda CG 160 0KM', 20.00, 0.0020, 15000.00),
(3, 'Bicicleta Elétrica', 'Bicicleta elétrica premium', 8.00, 0.0300, 3000.00),
(3, 'Patinete Elétrico', 'Patinete elétrico dobrável', 4.00, 0.0600, 1200.00),

-- Dinheiro
(4, 'R$ 1.000', 'Mil reais direto no PIX', 5.00, 0.0500, 1000.00),
(4, 'R$ 500', 'Quinhentos reais direto no PIX', 3.00, 0.0800, 500.00),
(4, 'R$ 100', 'Cem reais direto no PIX', 2.00, 0.1500, 100.00),
(4, 'R$ 50', 'Cinquenta reais direto no PIX', 1.00, 0.2000, 50.00);

-- Insert system settings
INSERT INTO system_settings (key, value, description, type) VALUES
('site_name', 'Raspou Ganhou', 'Nome do site', 'string'),
('welcome_bonus', '10.00', 'Bônus de boas-vindas em reais', 'number'),
('referral_bonus', '5.00', 'Bônus por indicação em reais', 'number'),
('min_withdrawal', '20.00', 'Valor mínimo para saque', 'number'),
('max_withdrawal_daily', '1000.00', 'Valor máximo de saque diário', 'number'),
('pix_enabled', 'true', 'PIX habilitado', 'boolean'),
('credit_card_enabled', 'true', 'Cartão de crédito habilitado', 'boolean'),
('maintenance_mode', 'false', 'Modo de manutenção', 'boolean'),
('support_email', 'suporte@raspouganhou.com', 'Email de suporte', 'string'),
('support_phone', '(11) 99999-9999', 'Telefone de suporte', 'string');

-- Insert content pages
INSERT INTO content_pages (slug, title, content, meta_description) VALUES
('termos-de-uso', 'Termos de Uso', 
'<h1>Termos de Uso - Raspou Ganhou</h1>
<p>Bem-vindo ao Raspou Ganhou! Estes termos de uso regem o uso de nossa plataforma.</p>
<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar e usar este site, você aceita e concorda em ficar vinculado aos termos e condições deste acordo.</p>
<h2>2. Uso da Plataforma</h2>
<p>Você deve ter pelo menos 18 anos para usar nossa plataforma. É proibido criar múltiplas contas.</p>
<h2>3. Jogos e Apostas</h2>
<p>Todos os jogos são baseados em sorte. Os resultados são determinados por algoritmos certificados.</p>
<h2>4. Pagamentos</h2>
<p>Todos os pagamentos são processados de forma segura. Saques podem levar até 24 horas para serem processados.</p>',
'Termos de uso da plataforma Raspou Ganhou'),

('politica-privacidade', 'Política de Privacidade',
'<h1>Política de Privacidade - Raspou Ganhou</h1>
<p>Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.</p>
<h2>1. Informações Coletadas</h2>
<p>Coletamos informações que você nos fornece diretamente, como nome, email, telefone e CPF.</p>
<h2>2. Uso das Informações</h2>
<p>Usamos suas informações para fornecer nossos serviços, processar pagamentos e melhorar sua experiência.</p>
<h2>3. Proteção de Dados</h2>
<p>Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado.</p>
<h2>4. Compartilhamento</h2>
<p>Não vendemos ou alugamos suas informações pessoais para terceiros.</p>',
'Política de privacidade da plataforma Raspou Ganhou'),

('faq', 'Perguntas Frequentes',
'<h1>Perguntas Frequentes</h1>
<h2>Como funciona o Raspou Ganhou?</h2>
<p>É simples! Você compra uma raspadinha virtual, joga e pode ganhar prêmios incríveis!</p>
<h2>Como recebo meus prêmios?</h2>
<p>Prêmios em dinheiro são enviados via PIX. Produtos físicos são entregues no seu endereço.</p>
<h2>Qual o valor mínimo para saque?</h2>
<p>O valor mínimo para saque é de R$ 20,00.</p>
<h2>Como funciona o programa de indicação?</h2>
<p>Indique amigos e ganhe R$ 5,00 para cada pessoa que se cadastrar usando seu código!</p>',
'Perguntas frequentes sobre a plataforma Raspou Ganhou');

-- =====================================================
-- FINAL SETUP
-- =====================================================

-- Create a function to clean expired tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_bets', COALESCE(COUNT(*), 0),
        'total_wins', COALESCE(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END), 0),
        'total_losses', COALESCE(SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END), 0),
        'total_winnings', COALESCE(SUM(CASE WHEN result = 'win' THEN prize_value ELSE 0 END), 0),
        'win_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0 
        END
    ) INTO result
    FROM user_bets 
    WHERE user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    );
    RAISE NOTICE '🔑 Admin user created: admin@raspouganhou.com / admin123';
    RAISE NOTICE '🎮 Game categories: % created', (SELECT COUNT(*) FROM game_categories);
    RAISE NOTICE '🎯 Games: % created', (SELECT COUNT(*) FROM games);
    RAISE NOTICE '⚙️  System settings: % configured', (SELECT COUNT(*) FROM system_settings);
    RAISE NOTICE '📄 Content pages: % created', (SELECT COUNT(*) FROM content_pages);
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your Raspou Ganhou platform is ready to use!';
END $$;
