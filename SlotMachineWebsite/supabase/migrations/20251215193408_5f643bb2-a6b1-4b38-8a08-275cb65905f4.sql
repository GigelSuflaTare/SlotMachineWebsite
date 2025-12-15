-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_balances table
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance
CREATE POLICY "Users can view their own balance"
ON public.user_balances
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own balance
CREATE POLICY "Users can update their own balance"
ON public.user_balances
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own balance record
CREATE POLICY "Users can insert their own balance"
ON public.user_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to auto-create balance on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 100);
  RETURN NEW;
END;
$$;

-- Trigger for new user balance
CREATE TRIGGER on_auth_user_created_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_balance();

-- Update timestamp trigger
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();