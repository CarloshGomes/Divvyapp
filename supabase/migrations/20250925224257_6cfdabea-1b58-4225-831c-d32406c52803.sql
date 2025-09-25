-- Sistema de Divisão de Despesas - Estrutura Completa do Banco

-- 1. Tabela de perfis de usuários (expandida)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de grupos para divisão de despesas
CREATE TABLE public.expense_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_type TEXT NOT NULL CHECK (group_type IN ('travel', 'party', 'gathering', 'house', 'other')) DEFAULT 'other',
  total_amount DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de membros dos grupos
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 4. Tabela de despesas compartilhadas
CREATE TABLE public.shared_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'other',
  receipt_url TEXT,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'custom')) DEFAULT 'equal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela de divisão de despesas (quem deve quanto)
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(expense_id, user_id)
);

-- 6. Tabela de caixinha coletiva
CREATE TABLE public.group_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela de contribuições para a caixinha
CREATE TABLE public.pool_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.group_pool(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'pix',
  pix_key TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Tabela de pagamentos PIX
CREATE TABLE public.pix_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_split_id UUID REFERENCES public.expense_splits(id) ON DELETE CASCADE,
  pool_contribution_id UUID REFERENCES public.pool_contributions(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  pix_key TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  transaction_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK ((expense_split_id IS NOT NULL AND pool_contribution_id IS NULL) OR 
         (expense_split_id IS NULL AND pool_contribution_id IS NOT NULL))
);

-- 9. Tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense_added', 'payment_pending', 'payment_confirmed', 'group_invite', 'pool_contribution')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID, -- ID da despesa, grupo, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para expense_groups
CREATE POLICY "Users can view groups they are members of" ON public.expense_groups FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON public.expense_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON public.expense_groups FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'));

-- Políticas RLS para group_members
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members gm2 WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()));
CREATE POLICY "Group admins can manage members" ON public.group_members FOR ALL 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'));

-- Políticas RLS para shared_expenses
CREATE POLICY "Users can view expenses from their groups" ON public.shared_expenses FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = shared_expenses.group_id AND user_id = auth.uid()));
CREATE POLICY "Group members can create expenses" ON public.shared_expenses FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = shared_expenses.group_id AND user_id = auth.uid()));
CREATE POLICY "Expense creators can update their expenses" ON public.shared_expenses FOR UPDATE 
USING (auth.uid() = paid_by);

-- Políticas RLS para expense_splits
CREATE POLICY "Users can view their splits" ON public.expense_splits FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.shared_expenses se 
  JOIN public.group_members gm ON se.group_id = gm.group_id 
  WHERE se.id = expense_id AND gm.user_id = auth.uid()
));
CREATE POLICY "Users can update their own splits" ON public.expense_splits FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para group_pool
CREATE POLICY "Users can view pools from their groups" ON public.group_pool FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_pool.group_id AND user_id = auth.uid()));
CREATE POLICY "Group admins can manage pools" ON public.group_pool FOR ALL 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_pool.group_id AND user_id = auth.uid() AND role = 'admin'));

-- Políticas RLS para pool_contributions
CREATE POLICY "Users can view contributions from their groups" ON public.pool_contributions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.group_pool gp 
  JOIN public.group_members gm ON gp.group_id = gm.group_id 
  WHERE gp.id = pool_id AND gm.user_id = auth.uid()
));
CREATE POLICY "Users can create their own contributions" ON public.pool_contributions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para pix_payments
CREATE POLICY "Users can view their payments" ON public.pix_payments FOR SELECT 
USING (auth.uid() = payer_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create their own payments" ON public.pix_payments FOR INSERT 
WITH CHECK (auth.uid() = payer_id);

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Funções para atualizações automáticas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expense_groups_updated_at BEFORE UPDATE ON public.expense_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shared_expenses_updated_at BEFORE UPDATE ON public.shared_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_pool_updated_at BEFORE UPDATE ON public.group_pool FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para calcular divisão igual de despesas
CREATE OR REPLACE FUNCTION public.calculate_equal_split(expense_id UUID)
RETURNS VOID AS $$
DECLARE
  expense_amount DECIMAL(12,2);
  member_count INTEGER;
  split_amount DECIMAL(12,2);
  member_record RECORD;
BEGIN
  -- Buscar o valor da despesa
  SELECT amount INTO expense_amount 
  FROM public.shared_expenses 
  WHERE id = expense_id;
  
  -- Contar membros do grupo
  SELECT COUNT(*) INTO member_count
  FROM public.group_members gm
  JOIN public.shared_expenses se ON gm.group_id = se.group_id
  WHERE se.id = expense_id;
  
  -- Calcular valor por pessoa
  split_amount := expense_amount / member_count;
  
  -- Inserir splits para cada membro
  FOR member_record IN 
    SELECT gm.user_id
    FROM public.group_members gm
    JOIN public.shared_expenses se ON gm.group_id = se.group_id
    WHERE se.id = expense_id
  LOOP
    INSERT INTO public.expense_splits (expense_id, user_id, amount, percentage)
    VALUES (expense_id, member_record.user_id, split_amount, (100.0 / member_count));
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_shared_expenses_group_id ON public.shared_expenses(group_id);
CREATE INDEX idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON public.expense_splits(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);