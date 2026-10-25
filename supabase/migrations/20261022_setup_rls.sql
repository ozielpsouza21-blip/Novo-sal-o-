-- ==============================================================================
-- Migration: 20261022_setup_rls.sql
-- Description: Configuração de Row Level Security (RLS) para Studio Royale
-- Tables: perfis, produtos, pedidos, agendamentos
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Tabela: perfis
-- RLS: Leitura própria, escrita própria
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_select_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_delete_own" ON public.perfis;

-- Leitura própria
CREATE POLICY "perfis_select_own"
    ON public.perfis FOR SELECT
    USING (auth.uid() = id);

-- Escrita própria (INSERT, UPDATE, DELETE)
CREATE POLICY "perfis_insert_own"
    ON public.perfis FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "perfis_update_own"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "perfis_delete_own"
    ON public.perfis FOR DELETE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Tabela: produtos
-- RLS: Leitura pública, apenas admin escreve
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    categoria TEXT,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT true,
    estoque INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos_select_public" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert_admin" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_admin" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete_admin" ON public.produtos;

-- Leitura pública
CREATE POLICY "produtos_select_public"
    ON public.produtos FOR SELECT
    USING (true);

-- Apenas admin escreve (INSERT, UPDATE, DELETE)
CREATE POLICY "produtos_insert_admin"
    ON public.produtos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "produtos_update_admin"
    ON public.produtos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "produtos_delete_admin"
    ON public.produtos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ------------------------------------------------------------------------------
-- 3. Tabela: pedidos
-- RLS: Leitura própria, escrita própria
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    cliente_email TEXT,
    itens JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    metodo_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_select_own" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_insert_own" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_update_own" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_delete_own" ON public.pedidos;

-- Leitura própria
CREATE POLICY "pedidos_select_own"
    ON public.pedidos FOR SELECT
    USING (auth.uid() = user_id);

-- Escrita própria
CREATE POLICY "pedidos_insert_own"
    ON public.pedidos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedidos_update_own"
    ON public.pedidos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedidos_delete_own"
    ON public.pedidos FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Tabela: agendamentos
-- RLS: Leitura própria, escrita própria
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_nome TEXT NOT NULL,
    servico TEXT NOT NULL,
    profissional TEXT,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    status TEXT DEFAULT 'agendado',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendamentos_select_own" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_own" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_own" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_own" ON public.agendamentos;

-- Leitura própria
CREATE POLICY "agendamentos_select_own"
    ON public.agendamentos FOR SELECT
    USING (auth.uid() = user_id);

-- Escrita própria
CREATE POLICY "agendamentos_insert_own"
    ON public.agendamentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agendamentos_update_own"
    ON public.agendamentos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agendamentos_delete_own"
    ON public.agendamentos FOR DELETE
    USING (auth.uid() = user_id);
