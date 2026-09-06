-- WSaku Pro core schema. Use in a dedicated Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.workspaces (id uuid primary key default gen_random_uuid(), name text not null, created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now());
create table if not exists public.workspace_members (workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'user' check(role in ('admin','user')), created_at timestamptz not null default now(), primary key(workspace_id,user_id));
create table if not exists public.cash_accounts (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, type text not null default 'cash' check(type in ('cash','bank','ewallet')), opening_balance numeric(18,2) not null default 0, is_active boolean not null default true, created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now());
create table if not exists public.categories (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, kind text not null check(kind in ('income','expense')), is_active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,name,kind));
create table if not exists public.accounts (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, code text, is_active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,name));
create table if not exists public.transactions (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, transaction_date date not null default current_date, type text not null check(type in ('income','expense','transfer')), cash_account_id uuid references public.cash_accounts(id) on delete restrict, category_id uuid references public.categories(id) on delete restrict, account_id uuid references public.accounts(id) on delete restrict, amount numeric(18,2) not null check(amount>0), description text, created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.transaction_transfers (transaction_id uuid primary key references public.transactions(id) on delete cascade, source_cash_account_id uuid not null references public.cash_accounts(id) on delete restrict, destination_cash_account_id uuid not null references public.cash_accounts(id) on delete restrict, check(source_cash_account_id<>destination_cash_account_id));
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, user_id uuid references auth.users(id) on delete set null, action text not null, table_name text, record_id uuid, created_at timestamptz not null default now());

create index if not exists idx_ws_members_user on public.workspace_members(user_id);
create index if not exists idx_transactions_workspace_date on public.transactions(workspace_id,transaction_date desc);
create index if not exists idx_cash_accounts_workspace on public.cash_accounts(workspace_id);
create index if not exists idx_categories_workspace on public.categories(workspace_id);
create index if not exists idx_accounts_workspace on public.accounts(workspace_id);

create or replace function public.is_workspace_member(p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid())); $$;
create or replace function public.is_workspace_admin(p_workspace_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()) and role='admin'); $$;
revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_transfers enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy workspaces_select_member on public.workspaces for select to authenticated using(public.is_workspace_member(id));
create policy workspaces_insert_owner on public.workspaces for insert to authenticated with check(created_by=(select auth.uid()));
create policy workspaces_update_admin on public.workspaces for update to authenticated using(public.is_workspace_admin(id)) with check(public.is_workspace_admin(id));
create policy members_select_member on public.workspace_members for select to authenticated using(public.is_workspace_member(workspace_id));
create policy members_insert_admin on public.workspace_members for insert to authenticated with check(public.is_workspace_admin(workspace_id));
create policy members_update_admin on public.workspace_members for update to authenticated using(public.is_workspace_admin(workspace_id)) with check(public.is_workspace_admin(workspace_id));
create policy members_delete_admin on public.workspace_members for delete to authenticated using(public.is_workspace_admin(workspace_id));
create policy cash_accounts_member on public.cash_accounts for select to authenticated using(public.is_workspace_member(workspace_id));
create policy cash_accounts_write on public.cash_accounts for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy categories_member on public.categories for select to authenticated using(public.is_workspace_member(workspace_id));
create policy categories_write on public.categories for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy accounts_member on public.accounts for select to authenticated using(public.is_workspace_member(workspace_id));
create policy accounts_write on public.accounts for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy transactions_member on public.transactions for select to authenticated using(public.is_workspace_member(workspace_id));
create policy transactions_write on public.transactions for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy transfers_member on public.transaction_transfers for select to authenticated using(exists(select 1 from public.transactions t where t.id=transaction_id and public.is_workspace_member(t.workspace_id)));
create policy transfers_write on public.transaction_transfers for all to authenticated using(exists(select 1 from public.transactions t where t.id=transaction_id and public.is_workspace_member(t.workspace_id))) with check(exists(select 1 from public.transactions t where t.id=transaction_id and public.is_workspace_member(t.workspace_id)));
create policy audit_logs_member on public.audit_logs for select to authenticated using(workspace_id is null or public.is_workspace_member(workspace_id));
