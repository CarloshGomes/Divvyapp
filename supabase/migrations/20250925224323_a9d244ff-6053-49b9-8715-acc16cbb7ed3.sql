-- Corrigir avisos de segurança das funções

-- 1. Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Corrigir função handle_new_user com search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Corrigir função calculate_equal_split com search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;