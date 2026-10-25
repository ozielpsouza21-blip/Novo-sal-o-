-- ==============================================================================
-- Migration Definitiva e Protegida: 20261025_definitive_schema_and_rls.sql
-- Aplicação: Studio Royale Salão de Beleza & Spa VIP
-- Descrição: Estrutura completa e consolidada de tabelas, relacionamentos,
--            funções auxiliares com SECURITY DEFINER + search_path seguro,
--            validação rigorosa de perfis/roles sem recursão de RLS,
--            REVOKE de permissões públicas para perfis com GRANT restrito,
--            e políticas RLS idempotentes e seguras com checkout para visitantes.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Funções Auxiliares de Segurança (Evita recursão de RLS e fixa search_path)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    u_role TEXT;
BEGIN
    IF user_id IS NULL THEN
        RETURN 'anonimo';
    END IF;
    -- SECURITY DEFINER ignora RLS ao ler a tabela perfis, prevenindo recursão infinita
    SELECT role INTO u_role FROM public.perfis WHERE id = user_id;
    RETURN COALESCE(u_role, 'cliente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role(auth.uid()) = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_professional_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role(auth.uid()) IN ('admin', 'profissional'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ------------------------------------------------------------------------------
-- 1. Tabela: perfis (Profiles), Validador SECURITY DEFINER e Permissões
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    avatar_url TEXT,
    endereco TEXT,
    bio TEXT,
    role TEXT DEFAULT 'cliente' CHECK (role IN ('cliente', 'profissional', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 1.1 Revogar todas as permissões públicas/anônimas da tabela perfis
REVOKE ALL ON TABLE public.perfis FROM PUBLIC, anon;

-- 1.2 Conceder permissões explícitas para usuários autenticados e service_role
GRANT SELECT, INSERT, UPDATE ON TABLE public.perfis TO authenticated;
GRANT ALL ON TABLE public.perfis TO service_role;

-- 1.3 Função SECURITY DEFINER com search_path fixo para validar inserções e atualizações de role
CREATE OR REPLACE FUNCTION public.validate_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação em Inserção (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF (NEW.role IS NOT NULL AND NEW.role != 'cliente') AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Apenas administradores podem atribuir perfis diferentes de cliente no registro.';
        END IF;
    -- Validação em Atualização (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        IF (NEW.role IS DISTINCT FROM OLD.role) AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar a função (role) de usuários.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_profile_role ON public.perfis;
CREATE TRIGGER trg_validate_profile_role
    BEFORE INSERT OR UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_role();

-- 1.4 Políticas RLS sem recursão (verificação direta de autoridade no próprio registro)
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_policy" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
DROP POLICY IF EXISTS "perfis_delete_policy" ON public.perfis;

-- Leitura: Próprio usuário autenticado no seu registro ou Administrador
CREATE POLICY "perfis_select_policy" ON public.perfis
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());

-- Inserção: Próprio usuário autenticado no seu registro ou Administrador
CREATE POLICY "perfis_insert_policy" ON public.perfis
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- Atualização: Próprio usuário autenticado no seu registro ou Administrador
CREATE POLICY "perfis_update_policy" ON public.perfis
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- Exclusão: Apenas Administradores
CREATE POLICY "perfis_delete_policy" ON public.perfis
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- Trigger para criação automática de perfil via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'cliente'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------------------------
-- 2. Tabela: servicos (Services Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.servicos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    titulo TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duracao TEXT DEFAULT '60 min',
    company_name TEXT DEFAULT 'Studio Royale',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos_select_policy" ON public.servicos;
DROP POLICY IF EXISTS "servicos_write_policy" ON public.servicos;
DROP POLICY IF EXISTS "servicos_insert_policy" ON public.servicos;
DROP POLICY IF EXISTS "servicos_update_policy" ON public.servicos;
DROP POLICY IF EXISTS "servicos_delete_policy" ON public.servicos;

CREATE POLICY "servicos_select_policy" ON public.servicos
    FOR SELECT USING (ativo = true OR public.is_professional_or_admin());

CREATE POLICY "servicos_insert_policy" ON public.servicos
    FOR INSERT WITH CHECK (public.is_professional_or_admin());

CREATE POLICY "servicos_update_policy" ON public.servicos
    FOR UPDATE USING (public.is_professional_or_admin()) WITH CHECK (public.is_professional_or_admin());

CREATE POLICY "servicos_delete_policy" ON public.servicos
    FOR DELETE USING (public.is_professional_or_admin());


-- ------------------------------------------------------------------------------
-- 3. Tabela: produtos (Products Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    categoria TEXT,
    imagem_url TEXT,
    estoque INTEGER DEFAULT 0,
    company_name TEXT,
    showcase_id TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;
DROP POLICY IF EXISTS "produtos_write_policy" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert_policy" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_policy" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete_policy" ON public.produtos;

CREATE POLICY "produtos_select_policy" ON public.produtos
    FOR SELECT USING (ativo = true OR public.is_professional_or_admin());

CREATE POLICY "produtos_insert_policy" ON public.produtos
    FOR INSERT WITH CHECK (public.is_professional_or_admin());

CREATE POLICY "produtos_update_policy" ON public.produtos
    FOR UPDATE USING (public.is_professional_or_admin()) WITH CHECK (public.is_professional_or_admin());

CREATE POLICY "produtos_delete_policy" ON public.produtos
    FOR DELETE USING (public.is_professional_or_admin());


-- ------------------------------------------------------------------------------
-- 4. Tabela: pedidos (Orders)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cliente_nome TEXT,
    cliente_email TEXT,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    metodo_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_select_policy" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_insert_policy" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_update_policy" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_delete_policy" ON public.pedidos;

CREATE POLICY "pedidos_select_policy" ON public.pedidos
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin()
    );

CREATE POLICY "pedidos_insert_policy" ON public.pedidos
    FOR INSERT WITH CHECK (
        (user_id IS NULL AND auth.uid() IS NULL) OR (auth.uid() = user_id) OR public.is_admin()
    );

CREATE POLICY "pedidos_update_policy" ON public.pedidos
    FOR UPDATE
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin()
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin()
    );

CREATE POLICY "pedidos_delete_policy" ON public.pedidos
    FOR DELETE USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 5. Tabela: itens_pedido (Order Items)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pedido_id TEXT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id TEXT REFERENCES public.produtos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    imagem_url TEXT
);

ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itens_pedido_select_policy" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_insert_policy" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_update_policy" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_delete_policy" ON public.itens_pedido;

CREATE POLICY "itens_pedido_select_policy" ON public.itens_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pedidos p
            WHERE p.id = itens_pedido.pedido_id
            AND ((p.user_id IS NOT NULL AND p.user_id = auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "itens_pedido_insert_policy" ON public.itens_pedido
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pedidos p
            WHERE p.id = itens_pedido.pedido_id
            AND (
                (p.user_id IS NOT NULL AND p.user_id = auth.uid())
                OR public.is_admin()
                OR (p.user_id IS NULL AND p.created_at >= (NOW() - INTERVAL '5 minutes'))
            )
        )
    );

CREATE POLICY "itens_pedido_update_policy" ON public.itens_pedido
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pedidos p
            WHERE p.id = itens_pedido.pedido_id
            AND ((p.user_id IS NOT NULL AND p.user_id = auth.uid()) OR public.is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pedidos p
            WHERE p.id = itens_pedido.pedido_id
            AND ((p.user_id IS NOT NULL AND p.user_id = auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "itens_pedido_delete_policy" ON public.itens_pedido
    FOR DELETE USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.criar_pedido_visitante(
    p_cliente_nome TEXT,
    p_cliente_email TEXT,
    p_metodo_pagamento TEXT,
    p_total NUMERIC,
    p_itens JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_pedido_id TEXT;
    v_item JSONB;
BEGIN
    INSERT INTO public.pedidos (user_id, cliente_nome, cliente_email, total, metodo_pagamento, status)
    VALUES (NULL, p_cliente_nome, p_cliente_email, p_total, p_metodo_pagamento, 'pendente')
    RETURNING id INTO v_pedido_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO public.itens_pedido (pedido_id, produto_id, titulo, quantidade, preco_unitario, imagem_url)
        VALUES (
            v_pedido_id,
            v_item->>'produto_id',
            v_item->>'titulo',
            (v_item->>'quantidade')::INTEGER,
            (v_item->>'preco_unitario')::NUMERIC,
            v_item->>'imagem_url'
        );
    END LOOP;

    RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ------------------------------------------------------------------------------
-- 6. Tabela: agendamentos (Appointments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    servico_id TEXT,
    servico_nome TEXT NOT NULL,
    company_name TEXT DEFAULT 'Studio Royale',
    cliente_nome TEXT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    status TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente_remarcacao', 'pendente_cancelamento', 'cancelado')),
    observacoes TEXT,
    novadata DATE,
    novohorario TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendamentos_select_policy" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON public.agendamentos;

CREATE POLICY "agendamentos_select_policy" ON public.agendamentos
    FOR SELECT USING (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "agendamentos_insert_policy" ON public.agendamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "agendamentos_update_policy" ON public.agendamentos
    FOR UPDATE
    USING (auth.uid() = user_id OR public.is_professional_or_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "agendamentos_delete_policy" ON public.agendamentos
    FOR DELETE USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_agendamento_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_professional_or_admin() THEN
        IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
            RAISE EXCEPTION 'Não autorizado a alterar este agendamento.';
        END IF;

        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Não é permitido alterar o usuário do agendamento.';
        END IF;

        IF NEW.servico_id IS DISTINCT FROM OLD.servico_id THEN
            RAISE EXCEPTION 'Não é permitido alterar o serviço do agendamento.';
        END IF;

        IF NEW.status NOT IN ('pendente_remarcacao', 'pendente_cancelamento', OLD.status) THEN
            RAISE EXCEPTION 'Clientes só podem solicitar remarcação ou cancelamento.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_agendamento_update ON public.agendamentos;
CREATE TRIGGER trg_validate_agendamento_update
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION public.validate_agendamento_update();


-- ------------------------------------------------------------------------------
-- 7. Tabela: fila_espera (Waitlist)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fila_espera (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    servico_id TEXT,
    servico_nome TEXT NOT NULL,
    company_name TEXT DEFAULT 'Studio Royale',
    data DATE NOT NULL,
    horario TIME NOT NULL,
    posicao INTEGER NOT NULL DEFAULT 1,
    tempo_estimado_min INTEGER DEFAULT 15,
    status TEXT DEFAULT 'aguardando',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fila_espera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fila_espera_select_policy" ON public.fila_espera;
DROP POLICY IF EXISTS "fila_espera_insert_policy" ON public.fila_espera;
DROP POLICY IF EXISTS "fila_espera_update_policy" ON public.fila_espera;
DROP POLICY IF EXISTS "fila_espera_delete_policy" ON public.fila_espera;

CREATE POLICY "fila_espera_select_policy" ON public.fila_espera
    FOR SELECT USING (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "fila_espera_insert_policy" ON public.fila_espera
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "fila_espera_update_policy" ON public.fila_espera
    FOR UPDATE
    USING (auth.uid() = user_id OR public.is_professional_or_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_professional_or_admin());

CREATE POLICY "fila_espera_delete_policy" ON public.fila_espera
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());


-- ------------------------------------------------------------------------------
-- 8. Gerenciamento Consolidado de Permissões de Execução (REVOKE / GRANT)
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_professional_or_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.criar_pedido_visitante(TEXT, TEXT, TEXT, NUMERIC, JSONB) TO authenticated, anon;
