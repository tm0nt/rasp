--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: clean_expired_tokens(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.clean_expired_tokens() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.clean_expired_tokens() OWNER TO brx;

--
-- Name: cleanup_expired_admin_sessions(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.cleanup_expired_admin_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE admin_sessions 
    SET is_active = false, ended_at = NOW() 
    WHERE expires_at <= NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_admin_sessions() OWNER TO brx;

--
-- Name: cleanup_expired_refresh_tokens(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.cleanup_expired_refresh_tokens() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR is_active = FALSE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_refresh_tokens() OWNER TO brx;

--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.generate_referral_code() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generate_referral_code() OWNER TO brx;

--
-- Name: get_platform_stats(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.get_platform_stats() RETURNS TABLE(total_users integer, active_users integer, total_games integer, total_revenue numeric, total_prizes numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT u.id)::INTEGER as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login >= NOW() - INTERVAL '30 days' THEN u.id END)::INTEGER as active_users,
        COUNT(gp.id)::INTEGER as total_games,
        COALESCE(SUM(gp.amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN gr.is_winner THEN gr.prize_value ELSE 0 END), 0) as total_prizes
    FROM users u
    LEFT JOIN game_purchases gp ON u.id = gp.user_id
    LEFT JOIN game_results gr ON gp.id = gr.purchase_id;
END;
$$;


ALTER FUNCTION public.get_platform_stats() OWNER TO brx;

--
-- Name: get_user_dashboard_stats(uuid); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.get_user_dashboard_stats(user_uuid uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_user_dashboard_stats(user_uuid uuid) OWNER TO brx;

--
-- Name: get_user_stats(uuid); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.get_user_stats(user_uuid uuid) RETURNS TABLE(total_games integer, total_spent numeric, total_won numeric, win_rate numeric, current_balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(gp.id)::INTEGER, 0) as total_games,
        COALESCE(SUM(gp.amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN gr.is_winner THEN gr.prize_value ELSE 0 END), 0) as total_won,
        CASE 
            WHEN COUNT(gp.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN gr.is_winner THEN 1 END) * 100.0 / COUNT(gp.id)), 2)
            ELSE 0 
        END as win_rate,
        u.balance as current_balance
    FROM users u
    LEFT JOIN game_purchases gp ON u.id = gp.user_id
    LEFT JOIN game_results gr ON gp.id = gr.purchase_id
    WHERE u.id = user_uuid
    GROUP BY u.id, u.balance;
END;
$$;


ALTER FUNCTION public.get_user_stats(user_uuid uuid) OWNER TO brx;

--
-- Name: process_referral_bonus(uuid); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.process_referral_bonus(referred_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    referrer_user_id UUID;
    bonus_amount DECIMAL(12,2);
BEGIN
    -- Get referrer and bonus amount
    SELECT u.referred_by INTO referrer_user_id
    FROM users u WHERE u.id = referred_user_id;
    
    SELECT value::text::DECIMAL INTO bonus_amount
    FROM system_settings 
    WHERE category = 'bonuses' AND key = 'referral_bonus_amount';
    
    -- Process bonus if referrer exists and bonus is enabled
    IF referrer_user_id IS NOT NULL AND bonus_amount > 0 THEN
        -- Update referrer balance
        UPDATE users 
        SET balance = balance + bonus_amount,
            referral_earnings = referral_earnings + bonus_amount
        WHERE id = referrer_user_id;
        
        -- Create bonus record
        INSERT INTO bonuses (user_id, type, amount, status, description)
        VALUES (referrer_user_id, 'referral', bonus_amount, 'active', 'Bônus por indicação de novo usuário');
        
        -- Create transaction record
        INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, description)
        SELECT referrer_user_id, 'referral_bonus', bonus_amount, 
               balance - bonus_amount, balance, 'completed', 'Bônus por indicação'
        FROM users WHERE id = referrer_user_id;
        
        -- Update referral status
        UPDATE referrals 
        SET status = 'completed', bonus_amount = bonus_amount, bonus_paid_at = NOW()
        WHERE referrer_id = referrer_user_id AND referred_id = referred_user_id;
    END IF;
END;
$$;


ALTER FUNCTION public.process_referral_bonus(referred_user_id uuid) OWNER TO brx;

--
-- Name: update_refresh_tokens_updated_at(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.update_refresh_tokens_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_refresh_tokens_updated_at() OWNER TO brx;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO brx;

--
-- Name: update_user_stats(uuid); Type: FUNCTION; Schema: public; Owner: brx
--

CREATE FUNCTION public.update_user_stats(user_uuid uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE users SET
        total_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid),
        won_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid AND result = 'win'),
        lost_bets = (SELECT COUNT(*) FROM user_bets WHERE user_id = user_uuid AND result = 'lose'),
        total_earnings = (SELECT COALESCE(SUM(prize_value), 0) FROM user_bets WHERE user_id = user_uuid AND result = 'win')
    WHERE id = user_uuid;
END;
$$;


ALTER FUNCTION public.update_user_stats(user_uuid uuid) OWNER TO brx;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.admin_audit_logs (
    id integer NOT NULL,
    admin_id uuid,
    action character varying(100) NOT NULL,
    resource_type character varying(50),
    resource_id character varying(255),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_audit_logs OWNER TO brx;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_logs_id_seq OWNER TO brx;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_sessions OWNER TO brx;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying,
    permissions jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_users OWNER TO brx;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_name character varying(100) NOT NULL,
    properties jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics_events OWNER TO brx;

--
-- Name: bonus_transactions; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.bonus_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(30) NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    expires_at timestamp without time zone,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    bonus_id integer
);


ALTER TABLE public.bonus_transactions OWNER TO brx;

--
-- Name: bonuses; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.bonuses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    value numeric(10,2) NOT NULL,
    min_deposit numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bonuses OWNER TO brx;

--
-- Name: bonuses_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.bonuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bonuses_id_seq OWNER TO brx;

--
-- Name: bonuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.bonuses_id_seq OWNED BY public.bonuses.id;


--
-- Name: content_pages; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.content_pages (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    meta_description text,
    is_published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.content_pages OWNER TO brx;

--
-- Name: content_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.content_pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_pages_id_seq OWNER TO brx;

--
-- Name: content_pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.content_pages_id_seq OWNED BY public.content_pages.id;


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    error_message text NOT NULL,
    stack_trace text,
    context character varying(100),
    url character varying(500),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.error_logs OWNER TO brx;

--
-- Name: game_categories; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.game_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description text,
    image_url character varying(255),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.game_categories OWNER TO brx;

--
-- Name: game_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.game_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_categories_id_seq OWNER TO brx;

--
-- Name: game_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.game_categories_id_seq OWNED BY public.game_categories.id;


--
-- Name: game_plays; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.game_plays (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    scratch_card_type_id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    prize_id uuid,
    is_win boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.game_plays OWNER TO brx;

--
-- Name: game_purchases; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.game_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.game_purchases OWNER TO brx;

--
-- Name: game_results; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.game_results (
    id integer NOT NULL,
    game_id integer,
    prize_name character varying(255) NOT NULL,
    prize_value numeric(10,2) NOT NULL,
    probability numeric(5,4) NOT NULL,
    image_url character varying(255),
    is_active boolean DEFAULT true
);


ALTER TABLE public.game_results OWNER TO brx;

--
-- Name: game_results_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.game_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_results_id_seq OWNER TO brx;

--
-- Name: game_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.game_results_id_seq OWNED BY public.game_results.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.games (
    id integer NOT NULL,
    category_id integer,
    name character varying(100) NOT NULL,
    description text,
    image_url character varying(255),
    price numeric(10,2) NOT NULL,
    win_probability numeric(5,4) NOT NULL,
    max_prize_value numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.games OWNER TO brx;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO brx;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    external_id character varying(255),
    description text,
    metadata jsonb,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payment_transactions OWNER TO brx;

--
-- Name: prizes; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.prizes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    scratch_card_type_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    value numeric(12,2) NOT NULL,
    image_url character varying(255),
    probability_weight double precision DEFAULT 1.0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prizes OWNER TO brx;

--
-- Name: referral_bonuses; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.referral_bonuses (
    id integer NOT NULL,
    referrer_id uuid,
    referred_id uuid,
    bonus_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.referral_bonuses OWNER TO brx;

--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.referral_bonuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_bonuses_id_seq OWNER TO brx;

--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.referral_bonuses_id_seq OWNED BY public.referral_bonuses.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO brx;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO brx;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: scratch_card_types; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.scratch_card_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.scratch_card_types OWNER TO brx;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    type character varying(20) DEFAULT 'string'::character varying,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO brx;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO brx;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2),
    balance_after numeric(12,2),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(20),
    external_transaction_id character varying(255),
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO brx;

--
-- Name: user_analytics; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.user_analytics (
    id integer NOT NULL,
    user_id uuid,
    event_type character varying(50) NOT NULL,
    event_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_analytics OWNER TO brx;

--
-- Name: user_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: brx
--

CREATE SEQUENCE public.user_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_analytics_id_seq OWNER TO brx;

--
-- Name: user_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: brx
--

ALTER SEQUENCE public.user_analytics_id_seq OWNED BY public.user_analytics.id;


--
-- Name: user_bets; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.user_bets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    game_id integer,
    category_id integer,
    amount numeric(10,2) NOT NULL,
    result character varying(10) NOT NULL,
    prize_name character varying(255),
    prize_value numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_bets OWNER TO brx;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(20) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_notifications OWNER TO brx;

--
-- Name: users; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    cpf character varying(14),
    password_hash character varying(255) NOT NULL,
    balance numeric(10,2) DEFAULT 0.00,
    bonus_balance numeric(10,2) DEFAULT 0.00,
    referral_code character varying(10) NOT NULL,
    referred_by uuid,
    total_earnings numeric(10,2) DEFAULT 0.00,
    referral_earnings numeric(10,2) DEFAULT 0.00,
    total_bets integer DEFAULT 0,
    won_bets integer DEFAULT 0,
    lost_bets integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    email_verified_at timestamp without time zone,
    phone_verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_login_at timestamp without time zone,
    last_activity_at timestamp without time zone,
    influencer boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO brx;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: brx
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    pix_key character varying(255) NOT NULL,
    pix_key_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone
);


ALTER TABLE public.withdrawals OWNER TO brx;

--
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- Name: bonuses id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.bonuses ALTER COLUMN id SET DEFAULT nextval('public.bonuses_id_seq'::regclass);


--
-- Name: content_pages id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.content_pages ALTER COLUMN id SET DEFAULT nextval('public.content_pages_id_seq'::regclass);


--
-- Name: game_categories id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_categories ALTER COLUMN id SET DEFAULT nextval('public.game_categories_id_seq'::regclass);


--
-- Name: game_results id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_results ALTER COLUMN id SET DEFAULT nextval('public.game_results_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: referral_bonuses id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.referral_bonuses ALTER COLUMN id SET DEFAULT nextval('public.referral_bonuses_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_analytics id; Type: DEFAULT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_analytics ALTER COLUMN id SET DEFAULT nextval('public.user_analytics_id_seq'::regclass);


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.admin_audit_logs (id, admin_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
1	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	update	system_settings	\N	\N	{"settings": [{"key": "site_name", "value": "Raspou Ganhou"}, {"key": "site_url", "value": ""}, {"key": "site_description", "value": ""}, {"key": "site_logo", "value": ""}, {"key": "site_favicon", "value": ""}, {"key": "support_email", "value": "suporte@raspouganhou.com"}, {"key": "support_phone", "value": "(11) 99999-9999"}, {"key": "seo_meta_title", "value": "Raspadinhas Online - Jogue e Ganhe Prêmios Reais Agora!"}, {"key": "seo_meta_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "seo_meta_keywords", "value": "raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online"}, {"key": "seo_google_analytics", "value": ""}, {"key": "seo_facebook_pixel", "value": ""}, {"key": "maintenance_mode", "value": "false"}], "updated_at": "2025-07-24T08:21:01.383Z", "updated_by": "admin"}	\N	\N	2025-07-24 08:21:01.384361
2	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	update	system_settings	\N	\N	{"settings": [{"key": "site_name", "value": "Raspou Ganhou"}, {"key": "site_url", "value": "raspadinhagg.fun"}, {"key": "site_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "site_logo", "value": ""}, {"key": "site_favicon", "value": ""}, {"key": "support_email", "value": "suporte@raspouganhou.com"}, {"key": "support_phone", "value": "(11) 99999-9999"}, {"key": "seo_meta_title", "value": "Raspadinhas Online - Jogue e Ganhe Prêmios Reais Agora!"}, {"key": "seo_meta_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "seo_meta_keywords", "value": "raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online"}, {"key": "seo_google_analytics", "value": ""}, {"key": "seo_facebook_pixel", "value": ""}, {"key": "maintenance_mode", "value": "false"}], "updated_at": "2025-07-24T08:21:42.913Z", "updated_by": "admin"}	\N	\N	2025-07-24 08:21:42.913343
3	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	update	system_settings	\N	\N	{"settings": [{"key": "site_name", "value": "Raspou Ganhou"}, {"key": "site_url", "value": "raspadinhagg.fun"}, {"key": "site_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "site_logo", "value": ""}, {"key": "site_favicon", "value": ""}, {"key": "support_email", "value": "suporte@raspouganhou.com"}, {"key": "support_phone", "value": "(11) 99999-9999"}, {"key": "seo_meta_title", "value": "Raspadinhas Online - Jogue e Ganhe Prêmios Reais Agora!"}, {"key": "seo_meta_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "seo_meta_keywords", "value": "raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online"}, {"key": "seo_google_analytics", "value": ""}, {"key": "seo_facebook_pixel", "value": ""}, {"key": "maintenance_mode", "value": "false"}], "updated_at": "2025-07-24T08:22:07.110Z", "updated_by": "admin"}	\N	\N	2025-07-24 08:22:07.111008
4	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	update	system_settings	\N	\N	{"settings": [{"key": "site_name", "value": "Raspou Ganhou"}, {"key": "site_url", "value": "raspadinhagg.fun"}, {"key": "site_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "site_logo", "value": ""}, {"key": "site_favicon", "value": ""}, {"key": "support_email", "value": "suporte@raspouganhou.com"}, {"key": "support_phone", "value": "(11) 99999-9999"}, {"key": "seo_meta_title", "value": "Raspadinhas Online - Jogue e Ganhe Prêmios Reais Agora!"}, {"key": "seo_meta_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "seo_meta_keywords", "value": "raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online"}, {"key": "seo_google_analytics", "value": ""}, {"key": "seo_facebook_pixel", "value": ""}, {"key": "maintenance_mode", "value": "false"}], "updated_at": "2025-07-24T08:25:17.578Z", "updated_by": "admin"}	\N	\N	2025-07-24 08:25:17.578174
5	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	upload	logo	\N	\N	{"size": 810724, "fileUrl": "/uploads/logo-e5e9195c-d4b5-4242-aef9-5f41a3b98659.png", "filename": "logo-e5e9195c-d4b5-4242-aef9-5f41a3b98659.png", "mimeType": "image/png"}	\N	\N	2025-07-24 08:26:15.726627
6	de91b299-18c9-4cc3-ad8e-ffc7d3f637be	update	system_settings	\N	\N	{"settings": [{"key": "site_name", "value": "Raspou Ganhou"}, {"key": "site_url", "value": "raspadinhagg.fun"}, {"key": "site_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "site_logo", "value": "/uploads/logo-e5e9195c-d4b5-4242-aef9-5f41a3b98659.png"}, {"key": "site_favicon", "value": ""}, {"key": "support_email", "value": "suporte@raspouganhou.com"}, {"key": "support_phone", "value": "(11) 99999-9999"}, {"key": "seo_meta_title", "value": "Raspadinhas Online - Jogue e Ganhe Prêmios Reais Agora!"}, {"key": "seo_meta_description", "value": "Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!"}, {"key": "seo_meta_keywords", "value": "raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online"}, {"key": "seo_google_analytics", "value": ""}, {"key": "seo_facebook_pixel", "value": ""}, {"key": "maintenance_mode", "value": "false"}], "updated_at": "2025-07-24T16:16:46.475Z", "updated_by": "admin"}	\N	\N	2025-07-24 16:16:46.475926
\.


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.admin_sessions (id, admin_id, token, expires_at, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.admin_users (id, username, email, password_hash, full_name, role, permissions, is_active, last_login_at, created_at, updated_at) FROM stdin;
de91b299-18c9-4cc3-ad8e-ffc7d3f637be	admin	montenegro@admin.com	$2a$12$HVTS8MHZTL4PD2GG7y7wle8KX1JUM85yw.DMxEoXxwOhwWOqAUDhy	Administrador	super_admin	[]	t	\N	2025-07-22 02:20:04.412826	2025-08-09 14:44:37.568845
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.analytics_events (id, user_id, event_name, properties, created_at) FROM stdin;
bb003fdd-eb73-4079-986a-9a1fec7f4684	00fd7be8-ffad-44be-bdaf-79e16770c56e	user_registered	{"timestamp": "2025-07-22T02:14:19.343Z", "hasReferralCode": false, "registrationMethod": "email"}	2025-07-22 02:14:19.344068
bc0ab98e-bf62-4ebf-b071-f0c50e808e3f	bc57b484-d4b5-4f2a-bbce-4bd11d6d01d6	user_registered	{"timestamp": "2025-07-22T02:30:37.011Z", "hasReferralCode": false, "registrationMethod": "email"}	2025-07-22 02:30:37.01219
\.


--
-- Data for Name: bonus_transactions; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.bonus_transactions (id, user_id, type, amount, description, expires_at, is_used, created_at, bonus_id) FROM stdin;
\.


--
-- Data for Name: bonuses; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.bonuses (id, name, value, min_deposit, is_active, created_at, updated_at) FROM stdin;
1	Bonus 	100.00	10.00	t	2025-07-24 02:53:23.736831	2025-07-24 02:53:23.736831
\.


--
-- Data for Name: content_pages; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.content_pages (id, slug, title, content, meta_description, is_published, created_at, updated_at) FROM stdin;
1	termos-de-uso	Termos de Uso	<h1>Termos de Uso - Raspou Ganhou</h1>\n<p>Bem-vindo ao Raspou Ganhou! Estes termos de uso regem o uso de nossa plataforma.</p>\n<h2>1. Aceitação dos Termos</h2>\n<p>Ao acessar e usar este site, você aceita e concorda em ficar vinculado aos termos e condições deste acordo.</p>\n<h2>2. Uso da Plataforma</h2>\n<p>Você deve ter pelo menos 18 anos para usar nossa plataforma. É proibido criar múltiplas contas.</p>\n<h2>3. Jogos e Apostas</h2>\n<p>Todos os jogos são baseados em sorte. Os resultados são determinados por algoritmos certificados.</p>\n<h2>4. Pagamentos</h2>\n<p>Todos os pagamentos são processados de forma segura. Saques podem levar até 24 horas para serem processados.</p>	Termos de uso da plataforma Raspou Ganhou	t	2025-07-22 02:20:04.412826	2025-07-22 02:20:04.412826
2	politica-privacidade	Política de Privacidade	<h1>Política de Privacidade - Raspou Ganhou</h1>\n<p>Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.</p>\n<h2>1. Informações Coletadas</h2>\n<p>Coletamos informações que você nos fornece diretamente, como nome, email, telefone e CPF.</p>\n<h2>2. Uso das Informações</h2>\n<p>Usamos suas informações para fornecer nossos serviços, processar pagamentos e melhorar sua experiência.</p>\n<h2>3. Proteção de Dados</h2>\n<p>Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado.</p>\n<h2>4. Compartilhamento</h2>\n<p>Não vendemos ou alugamos suas informações pessoais para terceiros.</p>	Política de privacidade da plataforma Raspou Ganhou	t	2025-07-22 02:20:04.412826	2025-07-22 02:20:04.412826
3	faq	Perguntas Frequentes	<h1>Perguntas Frequentes</h1>\n<h2>Como funciona o Raspou Ganhou?</h2>\n<p>É simples! Você compra uma raspadinha virtual, joga e pode ganhar prêmios incríveis!</p>\n<h2>Como recebo meus prêmios?</h2>\n<p>Prêmios em dinheiro são enviados via PIX. Produtos físicos são entregues no seu endereço.</p>\n<h2>Qual o valor mínimo para saque?</h2>\n<p>O valor mínimo para saque é de R$ 20,00.</p>\n<h2>Como funciona o programa de indicação?</h2>\n<p>Indique amigos e ganhe R$ 5,00 para cada pessoa que se cadastrar usando seu código!</p>	Perguntas frequentes sobre a plataforma Raspou Ganhou	t	2025-07-22 02:20:04.412826	2025-07-22 02:20:04.412826
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.error_logs (id, user_id, error_message, stack_trace, context, url, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: game_categories; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.game_categories (id, name, slug, description, image_url, is_active, sort_order, created_at) FROM stdin;
1	Cosméticos	cosmeticos	Produtos de beleza e cuidados pessoais	/images/cosmetics.png	t	1	2025-07-22 02:20:04.412826
2	Eletrônicos	eletronicos	Smartphones, tablets, notebooks e mais	/images/electronics.png	t	2	2025-07-22 02:20:04.412826
3	Veículos	veiculos	Motos, carros e acessórios automotivos	/images/vehicles.png	t	3	2025-07-22 02:20:04.412826
4	Dinheiro	dinheiro	Prêmios em dinheiro direto no PIX	/images/money.png	t	4	2025-07-22 02:20:04.412826
\.


--
-- Data for Name: game_plays; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.game_plays (id, user_id, scratch_card_type_id, transaction_id, prize_id, is_win, created_at) FROM stdin;
\.


--
-- Data for Name: game_purchases; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.game_purchases (id, user_id, category_id, amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: game_results; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.game_results (id, game_id, prize_name, prize_value, probability, image_url, is_active) FROM stdin;
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.games (id, category_id, name, description, image_url, price, win_probability, max_prize_value, is_active, created_at) FROM stdin;
1	1	Kit Maquiagem Completo	Kit completo de maquiagem profissional	\N	2.00	0.1500	150.00	t	2025-07-22 02:20:04.412826
2	1	Perfume Importado	Perfume importado de marca famosa	\N	5.00	0.0800	300.00	t	2025-07-22 02:20:04.412826
3	1	Chapinha Profissional	Chapinha profissional para cabelos	\N	3.00	0.1200	200.00	t	2025-07-22 02:20:04.412826
4	2	iPhone 15 Pro	iPhone 15 Pro 128GB	\N	10.00	0.0100	8000.00	t	2025-07-22 02:20:04.412826
5	2	Samsung Galaxy S24	Samsung Galaxy S24 256GB	\N	8.00	0.0150	6000.00	t	2025-07-22 02:20:04.412826
6	2	MacBook Air	MacBook Air M2 256GB	\N	15.00	0.0050	12000.00	t	2025-07-22 02:20:04.412826
7	2	AirPods Pro	AirPods Pro 2ª Geração	\N	5.00	0.0800	1500.00	t	2025-07-22 02:20:04.412826
8	3	Honda CG 160	Moto Honda CG 160 0KM	\N	20.00	0.0020	15000.00	t	2025-07-22 02:20:04.412826
9	3	Bicicleta Elétrica	Bicicleta elétrica premium	\N	8.00	0.0300	3000.00	t	2025-07-22 02:20:04.412826
10	3	Patinete Elétrico	Patinete elétrico dobrável	\N	4.00	0.0600	1200.00	t	2025-07-22 02:20:04.412826
11	4	R$ 1.000	Mil reais direto no PIX	\N	5.00	0.0500	1000.00	t	2025-07-22 02:20:04.412826
12	4	R$ 500	Quinhentos reais direto no PIX	\N	3.00	0.0800	500.00	t	2025-07-22 02:20:04.412826
13	4	R$ 100	Cem reais direto no PIX	\N	2.00	0.1500	100.00	t	2025-07-22 02:20:04.412826
14	4	R$ 50	Cinquenta reais direto no PIX	\N	1.00	0.2000	50.00	t	2025-07-22 02:20:04.412826
\.


--
-- Data for Name: prizes; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.prizes (id, scratch_card_type_id, name, value, image_url, probability_weight, created_at) FROM stdin;
\.


--
-- Data for Name: referral_bonuses; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.referral_bonuses (id, referrer_id, referred_id, bonus_amount, status, paid_at, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.refresh_tokens (id, user_id, token, expires_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: scratch_card_types; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.scratch_card_types (id, name, description, price, image_url, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.system_settings (id, key, value, description, type, updated_at) FROM stdin;
2	welcome_bonus	10.00	Bônus de boas-vindas em reais	number	2025-07-22 02:20:04.412826
3	referral_bonus	5.00	Bônus por indicação em reais	number	2025-07-22 02:20:04.412826
4	min_withdrawal	20.00	Valor mínimo para saque	number	2025-07-22 02:20:04.412826
5	max_withdrawal_daily	1000.00	Valor máximo de saque diário	number	2025-07-22 02:20:04.412826
6	pix_enabled	true	PIX habilitado	boolean	2025-07-22 02:20:04.412826
7	credit_card_enabled	true	Cartão de crédito habilitado	boolean	2025-07-22 02:20:04.412826
430	site_modal_promo_banner	/images/modal-promo-banner.png	\N	string	2025-08-10 09:35:46.432705
23	site_favicon	/images/favicon.png	\N	string	2025-08-10 09:42:14.364551
1	site_name	Raspou Ganhou	Nome do site	string	2025-08-09 14:40:54.022759
20	site_url	raspadinhagg.fun	\N	string	2025-08-09 14:40:54.022759
21	site_description	Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!	\N	string	2025-08-09 14:40:54.022759
22	site_logo	/images/logo.png	\N	string	2025-08-09 14:40:54.022759
9	support_email	suporte@raspouganhou.com	Email de suporte	string	2025-08-09 14:40:54.022759
10	support_phone	(11) 99999-9999	Telefone de suporte	string	2025-08-09 14:40:54.022759
26	seo_meta_title	Raspou Ganhou	\N	string	2025-08-09 14:40:54.022759
27	seo_meta_description	Descubra a diversão das raspadinhas online! Jogue a qualquer hora e em qualquer lugar para ganhar prêmios incríveis. Plataforma segura, fácil de usar e com diversos jogos de raspadinha para todos os gostos. Comece sua sorte agora!	\N	string	2025-08-09 14:40:54.022759
28	seo_meta_keywords	raspadinhas online, jogo de raspadinha, ganhar prêmios online, jogos de sorte, raspadinha virtual, raspadinha grátis, prêmios reais, plataforma de raspadinha, jogos de azar, sorte online, ganhar dinheiro jogando, cassino online	\N	string	2025-08-09 14:40:54.022759
29	seo_google_analytics		\N	string	2025-08-09 14:40:54.022759
30	seo_facebook_pixel		\N	string	2025-08-09 14:40:54.022759
8	maintenance_mode	false	Modo de manutenção	boolean	2025-08-09 14:40:54.022759
124	rtp_value	1	\N	string	2025-08-09 14:40:54.022759
349	min_spins_withdrawal	100000	\N	string	2025-08-09 14:40:54.022759
350	min_withdrawal_amount	100	\N	string	2025-08-09 14:40:54.022759
334	site_banner	/images/banner.png	\N	string	2025-08-10 09:33:45.923619
429	site_mobile_login_banner	/images/mobile-login-banner.png	\N	string	2025-08-10 09:34:25.636938
431	site_mobile_register_banner	/images/mobile-register-banner.png	\N	string	2025-08-10 09:35:06.282501
318	withdrawal_fee	10	\N	string	2025-08-01 18:38:55.759832
11	affiliate_min_deposit	20.00	\N	string	2025-08-09 04:58:38.991773
12	affiliate_cpa_value	10	\N	string	2025-08-09 04:58:38.991773
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.transactions (id, user_id, type, amount, balance_before, balance_after, status, payment_method, external_transaction_id, description, metadata, created_at, completed_at) FROM stdin;
996e68f2-3adc-4dd0-9cfb-e73d1583ac28	00fd7be8-ffad-44be-bdaf-79e16770c56e	bonus	10.00	\N	\N	completed	\N	\N	Bônus de boas-vindas	\N	2025-07-22 02:14:19.339172+00	\N
9f7a7b28-27ae-47a2-bf42-d55aa166ba10	bc57b484-d4b5-4f2a-bbce-4bd11d6d01d6	bonus	10.00	\N	\N	completed	\N	\N	Bônus de boas-vindas	\N	2025-07-22 02:30:37.00685+00	\N
\.


--
-- Data for Name: user_analytics; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.user_analytics (id, user_id, event_type, event_data, ip_address, user_agent, created_at) FROM stdin;
1	\N	auth_error	{"email": "tassio@gmail.com", "error": "Este email já está cadastrado", "authType": "register", "timestamp": "2025-07-23T20:45:54.661Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 17:45:54.693
2	\N	auth_error	{"email": "tassiog@gmail.com", "error": "null value in column \\"referral_code\\" of relation \\"users\\" violates not-null constraint", "authType": "register", "timestamp": "2025-07-23T20:46:00.189Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 17:46:00.202
3	\N	user_registered	{"timestamp": "2025-07-23T20:47:02.985Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 17:47:03.036
4	\N	auth_error	{"email": "tassiog@gmail.com", "error": "Este email já está cadastrado", "authType": "register", "timestamp": "2025-07-23T20:56:41.682Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 17:56:42.55
5	\N	user_registered	{"timestamp": "2025-07-23T20:56:44.095Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 17:56:44.234
6	\N	user_registered	{"timestamp": "2025-07-23T22:47:11.715Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-23 19:47:12.213
201	a934f70f-af83-408c-a46e-b7b88bcbb5b5	logout	{}	\N	\N	2025-08-09 12:20:20.804
202	a934f70f-af83-408c-a46e-b7b88bcbb5b5	user_logged_out	{"timestamp": "2025-08-09T15:20:20.952Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 12:20:22.509
33	\N	auth_error	{"email": "", "error": "Email e senha são obrigatórios", "authType": "login", "timestamp": "2025-07-24T03:59:53.098Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 00:59:53.12
34	\N	auth_error	{"email": "11939342524", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:02:58.620Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:02:59.019
35	\N	auth_error	{"email": "11939342524", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:03:09.188Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:03:09.227
36	\N	auth_error	{"email": "", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:06:19.011Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:06:19.634
37	\N	auth_error	{"email": "", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:06:50.699Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:06:50.746
38	\N	auth_error	{"email": "tassio@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:08:33.491Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:08:33.885
39	\N	auth_error	{"email": "tassio@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:08:54.812Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:08:54.832
40	\N	auth_error	{"email": "tassio@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:08:58.305Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:08:58.324
41	\N	auth_error	{"email": "tassio@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:09:00.207Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:09:00.231
42	\N	user_registered	{"timestamp": "2025-07-24T04:09:35.056Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:09:36.572
45	\N	user_logged_in	{"timestamp": "2025-07-24T04:09:48.401Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:09:48.422
48	\N	auth_error	{"email": "", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:10:15.768Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:10:15.802
49	\N	auth_error	{"email": "tassiom@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:10:36.603Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:10:36.627
50	\N	auth_error	{"email": "", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T04:14:05.786Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:14:06.387
51	\N	user_logged_in	{"timestamp": "2025-07-24T04:14:14.473Z", "loginMethod": "phone"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 01:14:14.503
54	\N	user_registered	{"timestamp": "2025-07-24T05:22:23.376Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 02:22:23.41
57	\N	user_logged_in	{"timestamp": "2025-07-24T05:31:07.004Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 02:31:07.029
60	\N	user_logged_in	{"timestamp": "2025-07-24T09:47:24.049Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 06:47:27.613
61	\N	auth_error	{"email": "tassiog@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-24T17:03:28.118Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 14:03:29.18
62	\N	user_registered	{"timestamp": "2025-07-24T17:03:42.331Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 14:03:42.362
144	\N	user_registered	{"timestamp": "2025-07-25T00:46:52.608Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-24 21:46:55.453
147	\N	auth_error	{"email": "tassio@gmail.com", "error": "Credenciais incorretas", "authType": "login", "timestamp": "2025-07-26T20:54:29.406Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-26 17:54:30.064
148	\N	user_registered	{"timestamp": "2025-07-26T20:54:41.275Z", "referralCode": null, "registrationMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-26 17:54:41.295
149	\N	user_logged_in	{"timestamp": "2025-07-27T21:21:20.397Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-27 18:21:21.171
150	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:16:16.879Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:16:17.313
151	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:16:17.320Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:16:17.331
152	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:16:18.273Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:16:18.286
153	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:18:39.506Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:18:39.794
154	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:18:39.798Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:18:39.808
155	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:18:40.611Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:18:40.621
156	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:41:24.628Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:41:25.019
157	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:41:25.024Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:41:25.035
158	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:41:25.784Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:41:25.795
159	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:44:35.222Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:44:35.523
160	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:44:35.528Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:44:35.536
161	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:44:36.343Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:44:36.354
162	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:55:06.019Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:06.341
163	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:55:06.346Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:06.355
164	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:55:07.124Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:07.135
165	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 5, "reason": "bet", "timestamp": "2025-07-29T05:55:23.305Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:23.315
166	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 5, "timestamp": "2025-07-29T05:55:23.350Z", "categoryId": 4, "categoryTitle": "Super Prêmios"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:23.358
167	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 5, "result": "lose", "timestamp": "2025-07-29T05:55:23.437Z", "categoryId": 4, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:23.444
168	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_deducted	{"amount": 0.5, "reason": "bet", "timestamp": "2025-07-29T05:55:43.792Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:43.806
169	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T05:55:43.929Z", "categoryId": 1, "categoryTitle": "PIX na conta"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:43.938
170	a934f70f-af83-408c-a46e-b7b88bcbb5b5	bet_recorded	{"prize": "Perdeu", "amount": 0.5, "result": "lose", "timestamp": "2025-07-29T05:55:44.121Z", "categoryId": 1, "prizeValue": 0}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 02:55:44.131
171	a934f70f-af83-408c-a46e-b7b88bcbb5b5	PIX na conta_deducted	{"amount": 0.5, "reason": "PIX na conta", "timestamp": "2025-07-29T17:36:13.292Z"}	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-07-29 14:36:15.648
172	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T17:45:59.615Z", "categoryId": "1"}	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-07-29 14:46:00.59
173	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T17:58:51.097Z", "categoryId": "1"}	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-07-29 14:58:52.926
174	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 2, "timestamp": "2025-07-29T18:00:00.470Z", "categoryId": "2"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 15:00:00.529
175	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T18:00:04.010Z", "categoryId": "1"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-29 15:00:04.03
176	\N	user_logged_in	{"timestamp": "2025-07-29T18:25:05.776Z", "loginMethod": "email"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-07-29 15:25:07.014
177	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T18:25:15.427Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-07-29 15:25:16.015
178	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-07-29T18:25:32.744Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-07-29 15:25:33.333
179	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-01T18:37:48.191Z", "categoryId": "1"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 15:37:48.644
180	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-01T18:39:05.539Z", "categoryId": "1"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 15:39:05.551
181	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-01T18:39:14.169Z", "categoryId": "1"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-01 15:39:14.178
182	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 2, "timestamp": "2025-08-06T02:37:07.130Z", "categoryId": "2"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 23:37:16.179
183	a934f70f-af83-408c-a46e-b7b88bcbb5b5	logout	{}	\N	\N	2025-08-09 07:30:15.785
184	a934f70f-af83-408c-a46e-b7b88bcbb5b5	user_logged_out	{"timestamp": "2025-08-09T10:30:16.616Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 07:30:18.517
185	\N	user_logged_in	{"timestamp": "2025-08-09T10:40:26.912Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 07:40:27.931
186	a934f70f-af83-408c-a46e-b7b88bcbb5b5	logout	{}	\N	\N	2025-08-09 08:33:06.918
187	a934f70f-af83-408c-a46e-b7b88bcbb5b5	user_logged_out	{"timestamp": "2025-08-09T11:33:07.024Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 08:33:08.055
188	\N	user_logged_in	{"timestamp": "2025-08-09T11:33:10.561Z", "loginMethod": "email"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 08:33:10.572
189	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 5, "timestamp": "2025-08-09T14:01:48.603Z", "categoryId": "4"}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-09 11:01:49.974
190	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 5, "timestamp": "2025-08-09T14:02:28.885Z", "categoryId": "4"}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-09 11:02:28.92
191	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:09:01.230Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:09:01.61
192	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 2, "timestamp": "2025-08-09T14:09:31.967Z", "categoryId": "2"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:09:31.993
193	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 2.5, "timestamp": "2025-08-09T14:09:41.739Z", "categoryId": "3"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:09:41.76
194	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 5, "timestamp": "2025-08-09T14:09:52.244Z", "categoryId": "4"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:09:52.266
195	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:11:48.509Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:11:48.982
196	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:13:30.254Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:13:30.46
197	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:14:14.043Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:14:14.069
198	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:19:00.444Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:19:01.453
199	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:25:32.028Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:25:32.839
200	a934f70f-af83-408c-a46e-b7b88bcbb5b5	game_purchased	{"amount": 0.5, "timestamp": "2025-08-09T14:26:05.173Z", "categoryId": "1"}	::ffff:192.168.15.3	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-09 11:26:05.159
\.


--
-- Data for Name: user_bets; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.user_bets (id, user_id, game_id, category_id, amount, result, prize_name, prize_value, created_at) FROM stdin;
43b16df8-2359-4ced-8a46-3b037d38cd4d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:16:16.303
712a2177-f31c-4c52-8a6a-dc726a93cb1d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:16:17.817
b138b7dd-6d5b-49f7-8c88-04e2e46bad30	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:18:39.166
9f552bbd-8970-4957-89d4-af613ef67bcc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:18:40.281
f1b914af-dd39-463d-8ff2-85d678551f0f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:18:49.38
de2a8453-c553-4b35-b76a-b223ce146917	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:20:53.628
02e6c517-e554-4b8c-befb-c099c784c7bc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:21:00.991
b7f4f18b-f122-45c3-8e4b-a9ac5c7a92b0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:21:10.842
0009fdfd-2a55-447f-929e-a33820a8a777	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:22:33.452
2a493f5e-3c13-432a-a691-c1b73866b554	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:25:18.271
4569af47-8d7e-4a3f-9a3b-c6dda2f2a30d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:33:40.03
7635716f-f7f4-4266-bf86-5da7a3e5d0b4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:37:11.068
58943ddb-8577-458d-a39e-1323c270edcc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:41:23.842
e8874c58-d0da-43de-9dad-a9f36de28458	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:41:25.443
af171aca-e49e-45a9-b592-597846b082f3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:44:34.868
55ec45be-b0fc-49a5-b2f5-aff619800cad	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:44:35.946
caed2146-ba47-42d5-9bf1-dbbce5754d28	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:44:42.565
347c4e91-e74d-445f-ad03-5b7bcfa04a7d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:44:47.264
08ec6d2b-ad65-4284-880e-c29678161883	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:47:03.619
119f9f90-bc19-46e2-b0d6-3703650a68e1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:47:11.4
48466bf7-7224-4ca3-af0a-1d0db3a3190c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:55:05.551
550e718b-8fa2-44c6-8a86-80babe1969cf	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:55:06.773
efda8557-6451-4b28-a8ef-0afd1bb6dfef	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:55:10.966
350930d9-53dc-452e-9e9f-a21438a5d5c5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:55:14.681
3c3e86d7-cb6e-49e5-9714-e6d58db93267	a934f70f-af83-408c-a46e-b7b88bcbb5b5	11	4	5.00	loss	Perdeu	0.00	2025-07-29 02:55:23.252
a0946056-e3e8-4170-91a8-82bab90d75e9	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	lose	Perdeu	0.00	2025-07-29 02:55:23.419
dba45f07-4945-468a-96ad-030ed75be2ea	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-07-29 02:55:27.034
be05e47f-3883-4feb-a2a7-39276769d927	a934f70f-af83-408c-a46e-b7b88bcbb5b5	1	1	0.50	loss	Perdeu	0.00	2025-07-29 02:55:43.585
9a2d3921-1587-471d-9091-058293175a24	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	lose	Perdeu	0.00	2025-07-29 02:55:44.097
fe57f332-9040-4755-91b1-85e8f33b1604	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:55:49.261
7a96da33-6e37-4500-8e23-51fa2c53359f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:56:52.317
9f76aae6-5553-44fa-98d2-b8459bbe851e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:56:59.432
97290864-2a04-4925-98ab-1531b1aa0119	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 02:57:58.449
dcc6bad3-1ff4-4c60-933e-29deb51922c5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:02:58.779
0267c69f-11ed-4645-a5b4-728e77db3bf2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:03:02.762
566d1d49-efe3-4384-ade8-6761aea05361	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:03:21.447
03d5e209-b114-4506-9ff1-333796b4f6d3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-07-29 03:03:32.078
4349ded6-4bdb-40d9-a02c-3b5a4a36bcc0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-07-29 03:03:36.138
e0980188-31f5-4890-bd65-f2004c47b475	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-07-29 03:03:39.893
7769d60e-65e7-4fe3-bf60-4ff2abad77f9	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-07-29 03:04:02.515
4935fac0-9710-4960-baf7-4be110176b07	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-07-29 03:05:22.519
cdb0edbe-6907-4b9d-932f-b463c16d48d6	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-07-29 03:06:47.96
1fb7a297-9830-4df1-a13e-70067e61adb0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-07-29 03:06:51.296
5c6c0215-b58b-4b7d-8dda-334745157efd	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-07-29 03:06:55.953
69dd09cb-d7bd-4578-ab63-4b9fe1c5b37a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-07-29 03:07:11.796
1164c3b3-6423-4674-ae5d-6597d79f632e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-07-29 03:07:15.948
43f75d62-72db-401a-861a-d2de1d5d5c44	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-07-29 03:07:27.994
82684f43-6d12-4aa3-ab3d-53c79d5605ed	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:07:38.076
b126c66b-6427-457f-8d71-0d7e14e4d596	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:07:53.667
f21a315c-5726-487b-ba75-ef81c94a8dc1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:08:30.597
c3a3deb2-1538-45c1-b532-f68815648fa3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:32.704
91f30d1c-97ce-46d6-8f3f-688800494946	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:39.123
dd92c798-bec6-411c-affb-c8fbbaf6ff3f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:42.764
1d0c4d6f-aeec-42bf-8e4d-bc66ef970e33	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:45.891
6873c780-b656-4d14-90c3-920f23447ce6	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:49.084
df1d795e-3353-4174-83ad-b6612ab84f71	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:52.866
941c17b2-eb80-477e-815e-7774b5f89225	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:09:59.402
3f2151e2-8f71-4e6e-b088-2bfe61a245c2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:10:02.73
997464a8-a3ec-4bb7-baf0-c28ca51fd018	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:10:05.202
247d7af5-41eb-42a6-90c2-f7802e64fe2e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:10:07.742
a0068214-428d-4507-b92e-2d29714b492b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:10:10.467
fb337872-5c48-4687-bc1b-b7c2fa959ad1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:14:34.04
d7e40c92-b8f1-47e1-8ea5-378ac32dbed8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:14:34.042
786f8655-c3cd-4085-a135-02ea0a498ba3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:14:38.948
6ed78b7c-fd1b-45d5-8a93-5ef4b9345769	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:14:38.954
b074a94a-8b66-4f07-af47-0fe4ed74ef4b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:15:10.223
c49a30df-a270-4794-a5b9-068ed777c23e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:15:25.983
cd65c561-3302-4171-a425-b4b56f77a473	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:15:45.126
4213c820-341d-4278-89e2-f95cde7aed33	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:16:15.374
705c7401-a952-4f86-9794-000b78e852c3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:18:03.299
5636bb12-c46c-4bc4-a6b3-a9d5841f3370	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:18:45.621
8995fb28-c290-4b48-b41f-48a7e20fbf40	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:19:17.895
f79f015c-5af9-412a-9096-cf1d04184ead	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:19:29.795
654696db-bf27-49bd-8f0e-5ab74bc6a611	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:19:31.919
c8d7b10e-23a8-456d-84c7-bdbfafafaf5c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:24:04.6
da1dc1b3-35cd-4109-9ccc-763573440c0b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:24:04.604
65d9008c-3c41-45d9-b1dd-41045ed21074	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:24:11.054
5bb8ebe9-09af-4ff4-b9d0-07c22b3033be	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:24:25.313
854a264a-46f8-4359-a5f6-387a7277f066	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:24:57.67
90e8b8c8-c19b-4d29-b08a-f44b6229d66f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:25:00.672
4f8c206c-bdf2-4e27-b02a-ea7089655be2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:25:02.931
00a61225-a647-4e2c-919a-0d1443784c8d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:26:05.228
19228812-a4a6-42ce-841b-8cde7cfdf09c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:27:10.292
8dac7f13-8605-42c4-8280-b70934eafcd8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:32:16.805
df972723-4478-42fe-aca3-df05a040cee3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:36:28.86
7eb07d3b-1e44-4b98-b6e7-9f01f622d036	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:38:52.138
ee825e47-dbee-4e1e-adae-62716fa28bbb	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:40:36.541
97440853-5912-4810-8e9e-af9aa4843e88	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:41:16.118
c13bb2b9-e453-41de-b917-205f4238f382	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 03:44:40.857
35ecc819-82b2-4406-a6ce-316872a81739	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:37:53.294
ffd7cf84-547f-4516-9ccd-5a2b4748755e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:45:59.605
c6a2dc13-81f9-45e7-bb61-da7f6b7bb836	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:58:50.663
185c89d4-5044-43e7-9ff7-8b45fa8239dd	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:58:53.142
ecb6fa66-e5af-4982-ab96-81de2c10766a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:58:53.177
dd3fb4bf-46ce-4271-8d61-a3b8583f16fd	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:09.926
e5c04ee7-2098-4d2f-8fd1-a2f422abf623	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:14.286
2acb34de-34d1-44e4-843f-450989725bd5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:28.965
c2fd87ce-65d6-43c3-9bda-668324298a09	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:45.394
e49ed7df-9edc-4b4d-99e9-d6140d11fa10	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:45.436
355d3113-def3-4f8c-b1ec-2a0499d0cd6f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:56.551
af17bdc2-b564-4075-8f98-92f6449c657e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 14:59:56.586
8aa48fc3-0a98-4aff-ba11-f9d303c0eca0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-07-29 15:00:00.279
301ff906-a662-49e7-92c2-67ba77aada73	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:00:03.889
c96145df-e741-4659-a0ce-01f2dd038475	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:00:04.259
e10041f0-d04d-4435-8c63-ece510056e99	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:00:04.262
67c4437c-3194-4af2-b379-1c641fe0b397	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:15.868
47f15b79-5541-42d5-b4a0-e804337571f5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:16.141
2ceb2a44-ba72-4063-8444-833f66ccf61f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:16.15
05973ac3-b7ef-4906-8978-1679c2d7fc58	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:33.295
15675e3e-1ff4-40b6-a984-7aaf87b9ca7d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:33.437
0ff3a4da-29a4-403f-a5b3-c5ccce831f48	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:33.45
5ff6f475-f942-4a6e-a1a3-96f30fe3eb1f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-07-29 15:25:35.953
e34248d7-d7ba-4c3f-939e-a8ba8622bcc4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:37:48.184
63990bd7-955c-41e0-b8d6-f96c36823bca	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:37:48.746
5dbc465f-c319-4f52-8ae8-3e10b760026b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:37:48.748
decf9d85-a9f2-4c0e-99a3-6f7f196e926d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:38:00.143
f8c8cf85-1fc1-4338-ac80-b41eb1e998fd	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:38:04.515
dcded317-f36b-4c1e-8420-25691a7a833c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:38:06.956
1cbe28a4-be66-4ba9-8dbe-13091ca0a3bb	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:38:10.365
2ca3ecf6-b4c5-44ab-8c91-917b7045824d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:38:14.394
816473d5-8815-486e-b8f9-763adefd09f7	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:01.76
e3a6020b-232b-4725-8818-060182a3a09e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:05.496
630de5f0-9c64-4586-ac45-7bd22f35b31e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:05.644
3f7be351-135a-4690-997e-0d76a5527cf7	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:05.647
37838350-0e6e-4c2a-881c-45f5dff81d89	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:14.157
326ab871-5579-4f36-9823-0a2e9e6d6f60	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:14.267
a8494241-4972-4d6a-bb6a-95ac76efb61e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:14.268
93a3fab0-f5f1-49f8-b9b9-a64ce7136546	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:17.19
0442ce5d-068f-47ba-80f0-67181cfe4582	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:19.373
f4974658-20ec-4a95-84a9-c8cfdc585af2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-01 15:39:22.232
364a6a04-8e2d-4154-8c0f-52b630da64e0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:06.065
1bad792a-08b9-4e56-a748-913fb9f655fd	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:16.257
73584b5a-5347-4ee1-bf98-fb85984f6893	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:16.261
7edde860-add5-4bf5-90cb-e8369130c8a5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:36.556
5bf579b4-d8ee-4cc2-910a-08a77d7d9ac1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:39.292
18e34071-9aca-454a-b590-63edbfb2b39c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:41.666
c2abf270-3a28-4fb5-a1f3-00ebe116b3f1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:44.022
b0b55d9b-6c44-43f2-acb4-a35f4f7ca0e0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:46.204
fd4cf2f3-82bd-48a1-8aaf-f13cde178957	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:48.603
ba0b599f-4524-4d3e-bd08-f1c98ba60352	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:50.802
405b5ae1-922b-4dc5-8835-be030cfdb0e4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:53.12
e1e176ec-bf7c-47bc-b225-7fc5e7368eba	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:55.477
0830c742-5981-40b0-b30e-5d2293c49d85	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:37:58.145
68df60cf-fef5-42fc-8da3-84d94d467e77	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:00.548
7b6e418d-7792-486b-b6b3-f109fff19a7a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:02.66
5133ad8e-a1d0-40a1-a684-9eab3446b757	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:04.894
2dff09b7-7756-4c88-a2ec-a4f35d4fc09c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:06.915
1906434e-8747-4608-a5e0-249f62258a6f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:10.046
b23edf31-12e7-4d78-bc71-b55255d65c14	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:12.319
20762d2d-3a34-4be7-af22-693d7f0be3c5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:15.033
2371f9d0-c86b-4519-955d-43e81b00babc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:17.298
1ca07a76-8e87-4181-adc9-6e7309868793	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:22.741
d68caf3d-952c-4476-9963-fb722853a098	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:26.465
50772d13-a0cc-46f9-af0e-27cf51596728	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:29.363
4a263ed2-afe7-4b71-a56d-475bc65655ea	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-05 23:38:31.894
8001d9fd-0a5a-475d-b416-b4c856252448	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:01:48.588
c497aae6-7726-4f0a-b5df-1124c3f2c4d0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:01:50.238
d58b6755-6838-4871-87f9-e510a1c961f6	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:01:50.257
aa49d830-5307-457c-b48b-c22fa88ce8ee	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:01:56.794
0d1e5674-bb86-4605-979f-cd4988c7f4f3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:28.876
f934f864-0a0a-4dca-8abd-d92249b2c5f5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:29.481
360d8068-0511-4d5e-b0aa-b8dab6f2d837	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:29.492
e68aacf9-3bbf-43be-8c6c-1d805d6b34a7	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:33.859
02cf3256-2066-47b8-81fc-26ccfc2303ed	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:37.939
30b0e393-d128-448b-a49b-8574efc12613	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:02:40.928
46a781c1-e322-437c-b740-5cc199482ad9	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:01.228
b6589382-1310-40f8-abd3-c511036f4f69	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:01.804
392c5484-e4fa-4036-a4da-7a1dcc93c442	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:01.818
f6ab734d-ddb3-42a9-b345-e62a1cf15854	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:05.697
0a776656-97e6-4d7d-ac93-95870a5780ef	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:07.87
adef0b17-a9c5-4396-bcb8-b94302aea22a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:09.583
7e837bd1-3f62-4403-b900-0c6f6b50a0f5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:11.428
877d0fa4-8a91-4160-b23c-78ab472a1951	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:13.379
89a79d89-5b43-4a27-96d8-d364b935410c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:16.65
83f39507-60b8-4aee-8402-eaec82d76e69	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:18.493
6278311a-3103-4a4f-85d9-9399d858975a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:21.77
eb013435-d552-4377-81b8-5b8d18ab310e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:23.818
bf8689a2-d840-4d65-8329-742d179e3ae5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:09:25.866
a5dc2392-c4ea-4f9c-80e9-8464f7f6a3e2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:31.954
5e820f75-b49e-4448-8296-6c1f61fcd606	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:32.084
ab66e143-f420-4a5f-aaf3-c4770e2073f1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:32.086
38e6e9f6-42db-4939-a055-cb23b691dddf	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:33.956
2aa35961-2336-431a-a13e-d8ced5094e93	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:36.003
4cd01c81-de5d-4b9c-85c2-535b12b96a22	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	2	2.00	pending	\N	\N	2025-08-09 11:09:38.051
20ce0424-7a52-4939-9ef0-e8d32e814a6f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-08-09 11:09:41.739
e4d2b763-5137-4cd0-a800-6caffd7d84ef	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-08-09 11:09:41.846
c2b0e46f-0684-4be0-822e-0b5701056219	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-08-09 11:09:41.846
62e1b580-6b43-43f3-a808-ba34f1b5184a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-08-09 11:09:43.888
cef1f7d4-3635-4e56-966d-01e7561e9e06	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	3	2.50	pending	\N	\N	2025-08-09 11:09:46.039
1e85cd83-2a08-44ff-ad06-9ff937759ad9	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:52.185
632b7952-f21a-43cd-9a38-71214c664b76	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:52.365
c47dab5b-a6e5-49d9-a5e5-bca3724c2ad8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:52.366
ff46ccf6-f969-4e0c-b76c-74b378fe7f9d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:54.642
cf3a4ec3-0092-4e42-9939-bc2e778efe7e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:56.36
5ea064c4-b3c0-4500-9602-f6af2a92ce4e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:58.122
f20490c6-16c4-4c21-a288-7dd2f58b06fb	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:09:59.761
d06be085-c397-4a10-a822-38f901d8cd05	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:10:01.603
a5a8ee67-13f9-4f57-8557-62d73951a66e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:10:03.446
d033f70e-e127-45a0-b4a0-af5710d34ac7	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	4	5.00	pending	\N	\N	2025-08-09 11:10:05.236
d460add9-0eb3-4215-a775-73c0c383e8b4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:48.406
30dfdf33-6e21-4b01-97d3-9cd42bda431f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:49.144
0ef4e32f-2360-4986-9f24-243026a8a83b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:49.146
6b949350-2879-4728-b6b4-18eb836440d7	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:51.486
4d1c91a2-4e6a-4ce9-b164-c7b5b3e38ada	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:53.733
c6d675dd-50e5-4433-9548-e0b63980cdec	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:56.161
411e7591-097c-47c3-8222-ccf8c9d50210	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:11:58.546
be1dbe11-7558-40a7-ba72-7ad3b3b58b52	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:01.003
b43a3b4c-da87-489d-ba7c-35b67b1583b2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:03.213
dacceb16-0c15-43cd-8c1a-9dafef37eebf	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:05.313
20f97407-e892-4b4d-a572-765b18124319	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:07.558
6c797a11-3a0e-4e7c-9790-d4aaa684234e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:09.811
a27b6015-9c65-4e3e-90e7-4893d2f4afe4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:12.349
3d24127a-7458-4b45-9fe4-3486979c0794	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:14.936
33620788-4f4b-443f-aac8-2471b309e7a4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:17.39
c096b821-f8bc-44b1-a89a-9155d4f8c69e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:19.282
8ba7928c-6f61-4f52-9eb1-24303e179a3c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:21.9
80c442ff-454e-4094-90e7-8eaf1a2cdd49	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:12:24.682
3c314447-690b-4e45-bfaa-d83020b38ed5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:16.224
b7abcc94-7d59-4676-9b1e-d74575fb3141	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:18.528
eb014526-8c87-4902-9f5b-4e54c7aba660	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:20.885
b1618645-8795-4456-80d3-e9888fbbe6fe	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:22.921
73fd7207-f847-4343-bdf6-85d0fd118609	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:25.276
95a27513-f37f-483e-bc41-1acf8ca2a3fb	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:30.243
362743d3-d1a7-4ba0-81f9-792c7ca66ef4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:30.599
d320e63c-f10e-4b63-9fba-7a2dfe2f8e27	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:30.603
c042e3f5-135a-4908-99e6-5f257682491b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:32.829
cc0d4cff-c8b9-4130-84e4-14801d7a64e8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:35.004
04863385-555a-45ff-980a-7a006fa0216f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:37.081
709801fa-ba8a-4377-940d-734dda1ee6e0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:39.313
ab5f6a7f-ce18-4607-a5c0-6fbc6a024396	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:13:41.556
c41b709b-3cd8-4b4b-a2ef-74b268a39a7a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:14.034
e216f79d-c362-4d01-a21c-1dbea746ac09	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:14.166
5e771f2f-1dd8-4cca-ae0b-a71547136e78	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:14.175
573026db-f38c-4b71-a441-dcb0f71eb49f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:16.788
b8bc8ebe-b9f4-4465-b401-f376f2897bca	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:18.837
6becabe1-e46c-4f12-a804-0de877bd76f2	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:21.183
57b93cdf-624c-4e88-b425-4f6f5402c449	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:23.752
b3acd6e7-22a5-4572-8c4c-bbb5f94ee27d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:26.2
2fc34fb5-d123-41d3-a8f0-590297d73c16	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:28.867
f23d84b7-2af3-4ec9-bddb-050d35c6359c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:14:30.633
3f523b58-e936-4620-bb38-6c4be6ba2db4	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:00.318
aab60d7e-5e3f-4a2f-990d-93f081e567c8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:01.685
7ca6741d-a008-41e1-9f79-ac5394ee1e2c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:01.69
8b9d4487-422f-463e-9517-ae916f573c09	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:05.668
4c4561c5-2d33-4e41-b51d-2117fe9ff559	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:05.673
1abd4758-40e9-43ee-9810-7389e4f61f6b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:05.772
4572bd65-9c82-4270-b69a-ea090da1c8d5	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:08.217
d879f99f-a75d-45cb-9795-3f87a7ff8d21	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:10.464
e20e6f6c-a6ef-437f-850f-4188fba22a6f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:12.423
27fb8f75-5a8f-4565-b974-9e373d280386	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:14.147
ab5366ae-4f7b-4f7d-91b4-ca400f565764	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:16.389
d17399e5-2e1b-459e-a714-e1fbb66b8654	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:18.032
7c07a491-90e0-478e-894c-716607c97b54	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:20.077
f453fcbb-ce94-4439-b0f8-dbe40fb0698b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:22.331
ab96fda9-1232-4a11-87f8-607a1aeb1b34	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:24.898
8c835f66-997d-46bf-944b-d82242e3676a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:27.048
61c8c29b-d41b-4272-ad21-9bbdec35daae	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:29.196
d700bdba-052d-4994-8172-62483cf86f28	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:31.554
bd4743a6-0ca5-4d71-9a9a-079d62e745fc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:33.912
78727576-40cc-456b-ae06-ecd532564b4d	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:36.088
6f89afbe-afb9-4944-b5d8-774af5a2626e	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:38.52
115c5a1c-195c-4d56-a912-7198904fd6ff	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:41.182
7c8a36a2-7594-4963-a0e5-6945ce5f6b50	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:43.64
b202041e-5568-4990-b7b9-f877aba29d63	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:45.995
419261c0-372a-4cc1-bf8d-2d5dbb35647b	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:48.149
a1b5bb6b-4cbb-4f92-a3d8-83c74e84f333	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:50.401
3068d7ca-d553-496d-91d3-72b5c2e90869	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:52.652
cad7ffd1-e9a3-4023-9a04-a437366fac89	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:54.899
7e2e6b1f-ccc1-4fb0-9db7-8666b34d1fe0	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:19:57.153
eb306855-97e1-45f1-9cf4-12928fe50856	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:01.063
b58fcbf0-8dd0-409e-85b4-6fe2660f10ba	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:03.3
ce2a8436-1602-4e2b-b63b-8dd147a88017	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:05.973
88a1ff5e-3d6a-4001-a3b7-bf0b8f021fdc	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:07.998
2b386637-3614-4604-8126-18ce70feff09	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:09.845
57e1f7b6-3a1f-4932-b323-0a5a0a47c940	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:11.908
b0b5aba5-daea-4771-be17-4d33bbdc5ef6	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:13.736
08644186-15d0-4095-8551-896889acca29	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:15.584
674802fd-0264-4725-8e21-5fae784d34de	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:17.429
fce9b2cb-93f5-4bb2-9257-19a3232d415f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:19.765
3906becd-f13e-4c27-9532-9a01986f9055	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:22.137
3075d88f-2750-4331-8ef5-4b8b00d26506	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:20:24.269
cb73caf5-8dc4-463a-b6e7-de20757e14ca	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:31.912
416cde29-afa2-46a5-be42-30f890e9fd82	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:33.075
b79bebf0-1749-424b-8bd8-f26e3924e67f	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:33.108
f3005514-05b0-4c93-9787-495b43868002	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:35.6
c102a1c6-e58d-4e25-96fa-41530ac3b5c6	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:37.729
1ff95a50-93c2-4d98-9d99-49e20e1d5cdf	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:39.869
2b1820d9-cc7c-49a0-a980-2a829acb0c15	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:25:41.716
f175b9ec-1bc1-48e5-997f-209da93e754a	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:05.109
9547e2f5-4be6-4084-92f2-f56fdf1fbdeb	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:05.258
1ab6c506-3498-4831-9c23-b19790261488	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:05.278
672a2580-a662-4747-a2b5-fdcfd50184c3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:07.109
f04ee877-a002-4bb7-b430-a349ec3e2c79	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:09.059
b9982db7-f022-47b3-929e-35cc584baab3	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:10.592
7cd0593a-0440-46a1-9e04-3257b1d227f8	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:12.331
4fa1e144-2586-479c-be49-ebbc4776d829	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:13.971
3526c592-bc18-4d97-8a02-70dfe640c45c	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:15.408
d45bda93-8669-4b12-844e-eba7ef39e6b1	a934f70f-af83-408c-a46e-b7b88bcbb5b5	\N	1	0.50	pending	\N	\N	2025-08-09 11:26:17.049
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.user_notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.users (id, name, email, phone, cpf, password_hash, balance, bonus_balance, referral_code, referred_by, total_earnings, referral_earnings, total_bets, won_bets, lost_bets, is_verified, is_active, email_verified_at, phone_verified_at, created_at, updated_at, last_login_at, last_activity_at, influencer) FROM stdin;
a934f70f-af83-408c-a46e-b7b88bcbb5b5	Montenegro	montenegro@gmail.com	11911112233	\N	$2b$10$Ghy0ne3i0fvi91Iv6pA1x.fvaKB8mTbzmMLt492W9n8vKkFqiKui.	5258.00	10.00	GUWGC6	\N	0.00	0.00	14	0	14	f	t	\N	\N	2025-07-26 17:54:39.773	2025-08-09 14:45:42.277468	2025-08-09 11:33:10.537258	2025-08-09 11:33:10.537258	f
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: brx
--

COPY public.withdrawals (id, user_id, amount, pix_key, pix_key_type, status, admin_notes, created_at, processed_at) FROM stdin;
\.


--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.admin_audit_logs_id_seq', 6, true);


--
-- Name: bonuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.bonuses_id_seq', 1, true);


--
-- Name: content_pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.content_pages_id_seq', 3, true);


--
-- Name: game_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.game_categories_id_seq', 5, true);


--
-- Name: game_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.game_results_id_seq', 1, false);


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.games_id_seq', 14, true);


--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.referral_bonuses_id_seq', 1, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 434, true);


--
-- Name: user_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: brx
--

SELECT pg_catalog.setval('public.user_analytics_id_seq', 1, false);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_token_key UNIQUE (token);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: bonus_transactions bonus_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.bonus_transactions
    ADD CONSTRAINT bonus_transactions_pkey PRIMARY KEY (id);


--
-- Name: bonuses bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.bonuses
    ADD CONSTRAINT bonuses_pkey PRIMARY KEY (id);


--
-- Name: content_pages content_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.content_pages
    ADD CONSTRAINT content_pages_pkey PRIMARY KEY (id);


--
-- Name: content_pages content_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.content_pages
    ADD CONSTRAINT content_pages_slug_key UNIQUE (slug);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: game_categories game_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_categories
    ADD CONSTRAINT game_categories_pkey PRIMARY KEY (id);


--
-- Name: game_categories game_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_categories
    ADD CONSTRAINT game_categories_slug_key UNIQUE (slug);


--
-- Name: game_plays game_plays_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_plays
    ADD CONSTRAINT game_plays_pkey PRIMARY KEY (id);


--
-- Name: game_purchases game_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_purchases
    ADD CONSTRAINT game_purchases_pkey PRIMARY KEY (id);


--
-- Name: game_results game_results_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_results
    ADD CONSTRAINT game_results_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: prizes prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.prizes
    ADD CONSTRAINT prizes_pkey PRIMARY KEY (id);


--
-- Name: referral_bonuses referral_bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.referral_bonuses
    ADD CONSTRAINT referral_bonuses_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: scratch_card_types scratch_card_types_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.scratch_card_types
    ADD CONSTRAINT scratch_card_types_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_analytics user_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_bets user_bets_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_bets
    ADD CONSTRAINT user_bets_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_cpf_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_cpf_key UNIQUE (cpf);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs USING btree (admin_id);


--
-- Name: idx_admin_audit_logs_created_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs USING btree (created_at);


--
-- Name: idx_admin_sessions_admin_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_sessions_admin_id ON public.admin_sessions USING btree (admin_id);


--
-- Name: idx_admin_sessions_token; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_sessions_token ON public.admin_sessions USING btree (token);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_admin_users_username; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_admin_users_username ON public.admin_users USING btree (username);


--
-- Name: idx_analytics_events_event_name; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_analytics_events_event_name ON public.analytics_events USING btree (event_name);


--
-- Name: idx_analytics_events_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_analytics_events_user_id ON public.analytics_events USING btree (user_id);


--
-- Name: idx_game_plays_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_game_plays_user_id ON public.game_plays USING btree (user_id);


--
-- Name: idx_game_purchases_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_game_purchases_user_id ON public.game_purchases USING btree (user_id);


--
-- Name: idx_payment_transactions_created_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions USING btree (created_at);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_type; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_payment_transactions_type ON public.payment_transactions USING btree (type);


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);


--
-- Name: idx_prizes_scratch_card_type_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_prizes_scratch_card_type_id ON public.prizes USING btree (scratch_card_type_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_user_analytics_created_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_analytics_created_at ON public.user_analytics USING btree (created_at);


--
-- Name: idx_user_analytics_event_type; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_analytics_event_type ON public.user_analytics USING btree (event_type);


--
-- Name: idx_user_analytics_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_analytics_user_id ON public.user_analytics USING btree (user_id);


--
-- Name: idx_user_bets_created_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_bets_created_at ON public.user_bets USING btree (created_at);


--
-- Name: idx_user_bets_game_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_bets_game_id ON public.user_bets USING btree (game_id);


--
-- Name: idx_user_bets_user_id; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_user_bets_user_id ON public.user_bets USING btree (user_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_activity; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_last_activity ON public.users USING btree (last_activity_at);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_referral_code; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);


--
-- Name: idx_users_referred_by; Type: INDEX; Schema: public; Owner: brx
--

CREATE INDEX idx_users_referred_by ON public.users USING btree (referred_by);


--
-- Name: admin_users update_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: brx
--

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_pages update_content_pages_updated_at; Type: TRIGGER; Schema: public; Owner: brx
--

CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON public.content_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: brx
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: brx
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_audit_logs admin_audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id);


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: bonus_transactions bonus_transactions_bonus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.bonus_transactions
    ADD CONSTRAINT bonus_transactions_bonus_id_fkey FOREIGN KEY (bonus_id) REFERENCES public.bonuses(id);


--
-- Name: bonus_transactions bonus_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.bonus_transactions
    ADD CONSTRAINT bonus_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: game_plays game_plays_prize_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_plays
    ADD CONSTRAINT game_plays_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES public.prizes(id) ON DELETE SET NULL;


--
-- Name: game_plays game_plays_scratch_card_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_plays
    ADD CONSTRAINT game_plays_scratch_card_type_id_fkey FOREIGN KEY (scratch_card_type_id) REFERENCES public.scratch_card_types(id) ON DELETE RESTRICT;


--
-- Name: game_plays game_plays_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_plays
    ADD CONSTRAINT game_plays_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE RESTRICT;


--
-- Name: game_results game_results_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.game_results
    ADD CONSTRAINT game_results_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: games games_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.game_categories(id);


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: prizes prizes_scratch_card_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.prizes
    ADD CONSTRAINT prizes_scratch_card_type_id_fkey FOREIGN KEY (scratch_card_type_id) REFERENCES public.scratch_card_types(id) ON DELETE CASCADE;


--
-- Name: referral_bonuses referral_bonuses_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.referral_bonuses
    ADD CONSTRAINT referral_bonuses_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id);


--
-- Name: referral_bonuses referral_bonuses_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.referral_bonuses
    ADD CONSTRAINT referral_bonuses_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_analytics user_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_bets user_bets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_bets
    ADD CONSTRAINT user_bets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.game_categories(id);


--
-- Name: user_bets user_bets_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_bets
    ADD CONSTRAINT user_bets_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: user_bets user_bets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_bets
    ADD CONSTRAINT user_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brx
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

