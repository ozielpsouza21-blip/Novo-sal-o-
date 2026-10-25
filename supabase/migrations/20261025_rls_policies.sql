-- ==========================================
-- Studio Royale - Migração Supabase & RLS
-- ==========================================
-- Data: 2026-10-25
-- Descrição: Criação/ajuste de tabelas e definição de políticas de RLS 
-- para perfis, produtos, pedidos e agendamentos.

-- ------------------------------------------
-- 1. Tabela de Perfis de Usuários (perfis)
-- ------------------------------------------
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

-- Ativar Row Level Security
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores para re-execução idempotente
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Permitir inserção do próprio perfil" ON public.perfis;

-- Criar Políticas RLS para Perfis
CREATE POLICY "Permitir leitura do próprio perfil"
    ON public.perfis FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Permitir atualização do próprio perfil"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Permitir inserção do próprio perfil"
    ON public.perfis FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function & Trigger para automatizar criação de perfil no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'client'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------
-- 2. Tabela de Produtos (produtos - Vitrine)
-- ------------------------------------------
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

-- Ativar Row Level Security
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura pública de produtos ativos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir gerenciamento por usuários autenticados" ON public.produtos;

-- Políticas RLS para Produtos
-- Leitura pública (usuários anônimos e autenticados podem ver produtos ativos na vitrine)
CREATE POLICY "Permitir leitura pública de produtos ativos"
    ON public.produtos FOR SELECT
    USING (ativo = true OR auth.role() = 'authenticated');

-- Gestão de produtos para usuários autenticados
CREATE POLICY "Permitir gerenciamento por usuários autenticados"
    ON public.produtos FOR ALL
    USING (auth.role() = 'authenticated');


-- ------------------------------------------
-- 3. Tabela de Pedidos (pedidos)
-- ------------------------------------------
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

-- Ativar Row Level Security
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura de pedidos do próprio usuário" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir inserção de pedidos pelo próprio usuário" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir atualização de pedidos do próprio usuário" ON public.pedidos;

-- Políticas RLS para Pedidos
CREATE POLICY "Permitir leitura de pedidos do próprio usuário"
    ON public.pedidos FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de pedidos pelo próprio usuário"
    ON public.pedidos FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de pedidos do próprio usuário"
    ON public.pedidos FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');


-- ------------------------------------------
-- 4. Tabela de Agendamentos (agendamentos)
-- ------------------------------------------
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

-- Ativar Row Level Security
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura de agendamentos do próprio usuário" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir inserção de agendamentos pelo próprio usuário" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir atualização de agendamentos do próprio usuário" ON public.agendamentos;

-- Políticas RLS para Agendamentos
CREATE POLICY "Permitir leitura de agendamentos do próprio usuário"
    ON public.agendamentos FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de agendamentos pelo próprio usuário"
    ON public.agendamentos FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de agendamentos do próprio usuário"
    ON public.agendamentos FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');
