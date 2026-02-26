-- Finance Dashboard Migration
-- Run this in your Supabase SQL Editor

-- Create the finance_transactions table
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the finance_reports table
CREATE TABLE IF NOT EXISTS finance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  report_name TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_transactions INTEGER NOT NULL,
  net_value DECIMAL(12,2) NOT NULL
);

-- Enable RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_reports ENABLE ROW LEVEL SECURITY;

-- Policies for finance_transactions
CREATE POLICY "Users can view own transactions"
  ON finance_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON finance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON finance_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON finance_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for finance_reports
CREATE POLICY "Users can view own reports"
  ON finance_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON finance_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
