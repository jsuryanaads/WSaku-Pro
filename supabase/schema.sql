-- WSaku Pro production schema reference.
-- This file documents the current database shape. Production changes are applied
-- through Supabase migrations in the project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now(),
  unique (workspace_id,user_id)
);

create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null default 'cash' check (type in ('cash','bank','ewallet','other')),
  opening_balance numeric(18,2) not null default 0 check (opening_balance >= 0),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (workspace_id,name,type)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (workspace_id,name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  transaction_date date not null default current_date,
  type text not null check (type in ('income','expense','transfer')),
  cash_account_id uuid not null references public.cash_accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  account_id uuid references public.accounts(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_transfers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  from_cash_account_id uuid not null references public.cash_accounts(id) on delete restrict,
  to_cash_account_id uuid not null references public.cash_accounts(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (transaction_id),
  check (from_cash_account_id <> to_cash_account_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ws_members_user on public.workspace_members(user_id);
create index if not exists idx_transactions_workspace_date on public.transactions(workspace_id,transaction_date desc);
create index if not exists idx_transactions_cash_account on public.transactions(cash_account_id);
create index if not exists idx_transactions_category on public.transactions(category_id);
create index if not exists idx_cash_accounts_workspace on public.cash_accounts(workspace_id);
create index if not exists idx_categories_workspace on public.categories(workspace_id);
create index if not exists idx_accounts_workspace on public.accounts(workspace_id);
create index if not exists idx_transfer_workspace on public.transaction_transfers(workspace_id);

-- Composite keys enforce that financial references cannot cross workspaces.
create unique index if not exists cash_accounts_workspace_id_id_uidx on public.cash_accounts(workspace_id,id);
create unique index if not exists categories_workspace_id_id_uidx on public.categories(workspace_id,id);
create unique index if not exists accounts_workspace_id_id_uidx on public.accounts(workspace_id,id);
create unique index if not exists transactions_workspace_id_id_uidx on public.transactions(workspace_id,id);

alter table public.transactions
  drop constraint if exists transactions_workspace_cash_account_fkey;
alter table public.transactions
  add constraint transactions_workspace_cash_account_fkey
  foreign key (workspace_id,cash_account_id) references public.cash_accounts(workspace_id,id);

alter table public.transactions
  drop constraint if exists transactions_workspace_category_fkey;
alter table public.transactions
  add constraint transactions_workspace_category_fkey
  foreign key (workspace_id,category_id) references public.categories(workspace_id,id);

alter table public.transactions
  drop constraint if exists transactions_workspace_account_fkey;
alter table public.transactions
  add constraint transactions_workspace_account_fkey
  foreign key (workspace_id,account_id) references public.accounts(workspace_id,id);

alter table public.transaction_transfers
  drop constraint if exists transaction_transfers_workspace_transaction_fkey;
alter table public.transaction_transfers
  add constraint transaction_transfers_workspace_transaction_fkey
  foreign key (workspace_id,transaction_id) references public.transactions(workspace_id,id);

alter table public.transaction_transfers
  drop constraint if exists transaction_transfers_workspace_from_account_fkey;
alter table public.transaction_transfers
  add constraint transaction_transfers_workspace_from_account_fkey
  foreign key (workspace_id,from_cash_account_id) references public.cash_accounts(workspace_id,id);

alter table public.transaction_transfers
  drop constraint if exists transaction_transfers_workspace_to_account_fkey;
alter table public.transaction_transfers
  add constraint transaction_transfers_workspace_to_account_fkey
  foreign key (workspace_id,to_cash_account_id) references public.cash_accounts(workspace_id,id);

-- Workspace authorization helpers are SECURITY INVOKER in production.
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
  select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()));
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
  select exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=(select auth.uid()) and role='admin');
$$;

create or replace function public.bootstrap_workspace(p_name text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_user_id uuid := (select auth.uid()); v_workspace_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Workspace name is required'; end if;
  insert into public.workspaces(name,created_by) values(trim(p_name),v_user_id) returning id into v_workspace_id;
  insert into public.workspace_members(workspace_id,user_id,role) values(v_workspace_id,v_user_id,'admin');
  return v_workspace_id;
end;
$$;

create or replace function public.create_transfer(
  p_workspace_id uuid,
  p_transaction_date date,
  p_from_cash_account_id uuid,
  p_to_cash_account_id uuid,
  p_amount numeric,
  p_description text default null
)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_user_id uuid := (select auth.uid()); v_transaction_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_workspace_id is null then raise exception 'Workspace is required'; end if;
  if p_from_cash_account_id is null or p_to_cash_account_id is null then raise exception 'Source and destination accounts are required'; end if;
  if p_from_cash_account_id = p_to_cash_account_id then raise exception 'Source and destination accounts must be different'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Transfer amount must be greater than zero'; end if;
  if not public.is_workspace_member(p_workspace_id) then raise exception 'Not a workspace member'; end if;
  if not exists(select 1 from public.cash_accounts where id=p_from_cash_account_id and workspace_id=p_workspace_id and is_active) then raise exception 'Invalid source account'; end if;
  if not exists(select 1 from public.cash_accounts where id=p_to_cash_account_id and workspace_id=p_workspace_id and is_active) then raise exception 'Invalid destination account'; end if;
  insert into public.transactions(workspace_id,transaction_date,type,cash_account_id,amount,description,created_by)
    values(p_workspace_id,coalesce(p_transaction_date,current_date),'transfer',p_from_cash_account_id,p_amount,nullif(trim(p_description),''),v_user_id)
    returning id into v_transaction_id;
  insert into public.transaction_transfers(workspace_id,transaction_id,from_cash_account_id,to_cash_account_id,amount)
    values(p_workspace_id,v_transaction_id,p_from_cash_account_id,p_to_cash_account_id,p_amount);
  return v_transaction_id;
end;
$$;

revoke execute on function public.bootstrap_workspace(text) from public,anon;
revoke execute on function public.is_workspace_admin(uuid) from public,anon;
revoke execute on function public.is_workspace_member(uuid) from public,anon;
revoke execute on function public.create_transfer(uuid,date,uuid,uuid,numeric,text) from public,anon;
grant execute on function public.bootstrap_workspace(text) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.create_transfer(uuid,date,uuid,uuid,numeric,text) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_transfers enable row level security;
alter table public.audit_logs enable row level security;

-- Current production policies are workspace-scoped and authenticated-only.
create policy if not exists profiles_select_self on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy if not exists profiles_update_self on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy if not exists workspaces_select_member on public.workspaces for select to authenticated using(is_workspace_member(id));
create policy if not exists workspaces_insert_owner on public.workspaces for insert to authenticated with check(created_by=(select auth.uid()));
create policy if not exists workspaces_update_admin on public.workspaces for update to authenticated using(is_workspace_admin(id)) with check(is_workspace_admin(id));

-- Balance view used by the dashboard. Transfers affect both source and destination.
create or replace view public.cash_account_balances with (security_invoker=true) as
with normal as (
  select cash_account_id as id,
    coalesce(sum(case when type='income' then amount when type='expense' then -amount else 0 end),0) as net
  from public.transactions where type in ('income','expense') group by cash_account_id
), transfers as (
  select ca.id,
    coalesce(sum(case when tt.to_cash_account_id=ca.id then tt.amount else 0 end),0)
    - coalesce(sum(case when tt.from_cash_account_id=ca.id then tt.amount else 0 end),0) as net
  from public.cash_accounts ca
  left join public.transaction_transfers tt on tt.workspace_id=ca.workspace_id
    and (tt.to_cash_account_id=ca.id or tt.from_cash_account_id=ca.id)
  group by ca.id
)
select ca.id,ca.workspace_id,ca.name,ca.type,ca.opening_balance,ca.is_active,
  ca.opening_balance+coalesce(n.net,0)+coalesce(tr.net,0) as balance
from public.cash_accounts ca
left join normal n on n.id=ca.id
left join transfers tr on tr.id=ca.id;

-- See Supabase migrations for the authoritative RLS policy set and validation triggers.
-- Auth Dashboard setting still required: enable leaked-password protection.
