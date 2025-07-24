-- Tabela para refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(is_active);

-- Adicionar campo last_activity_at na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_refresh_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_refresh_tokens_updated_at();

-- Função para limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE refresh_tokens IS 'Armazena tokens de refresh para persistência de login';
COMMENT ON COLUMN refresh_tokens.token IS 'Token único para renovação de acesso';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Data de expiração do token (30 dias)';
COMMENT ON COLUMN refresh_tokens.is_active IS 'Indica se o token ainda é válido';
