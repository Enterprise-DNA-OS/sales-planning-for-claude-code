create table reps (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 capacity integer not null check(capacity>0), reviewed_on date, review_due date, purpose text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table accounts (
 id uuid primary key default gen_random_uuid(), external_id text not null unique, name text not null,
 country text not null default '', segment text not null default '', currency text not null check(currency ~ '^[A-Z]{3}$'),
 annual_revenue_cents bigint check(annual_revenue_cents>=0), workload integer not null default 1 check(workload>0),
 reviewed_on date, review_due date, purpose text not null default '', source jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table plans (
 id uuid primary key default gen_random_uuid(), name text not null unique, starts date not null, ends date not null check(ends>=starts),
 currency text not null check(currency ~ '^[A-Z]{3}$'), target_cents bigint not null check(target_cents>=0),
 status text not null default 'draft' check(status in ('draft','approved')), creator text not null,
 approved_by text, approved_at timestamptz, evidence text, snapshot jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='draft' or (approved_by is not null and approved_by<>creator and snapshot is not null and length(evidence)>0))
);
create table territories (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references plans, code text not null,
 name text not null, rep_id uuid not null references reps, quota_cents bigint not null default 0 check(quota_cents>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(plan_id,code), unique(id,plan_id)
);
create table assignments (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references plans, account_id uuid not null references accounts,
 territory_id uuid not null, rationale text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(plan_id,account_id), foreign key(territory_id,plan_id) references territories(id,plan_id)
);
create table followups (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references plans, note text not null, due date not null,
 owner text not null, resolved_at timestamptz, resolution text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table events (
 id uuid primary key default gen_random_uuid(), actor text not null, command text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function freeze_plan() returns trigger language plpgsql as $$
begin
 if old.status='approved' then raise exception 'Approved plans are immutable; clone the plan'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger plans_freeze before update or delete on plans for each row execute function freeze_plan();
create function check_plan_child() returns trigger language plpgsql as $$
declare p uuid; s text; c text; ac text;
begin
 if tg_op='DELETE' then p=old.plan_id; else p=new.plan_id; end if;
 select status,currency into s,c from plans where id=p for update;
 if s='approved' then raise exception 'Approved plan allocations are immutable'; end if;
 if tg_op='UPDATE' and new.plan_id<>old.plan_id then raise exception 'Cannot move records between plans'; end if;
 if tg_table_name='assignments' and tg_op<>'DELETE' then
  select currency into ac from accounts where id=new.account_id;
  if ac<>c then raise exception 'Account currency must match plan currency'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger territories_guard before insert or update or delete on territories for each row execute function check_plan_child();
create trigger assignments_guard before insert or update or delete on assignments for each row execute function check_plan_child();
do $$ declare t text; begin
 foreach t in array array['reps','accounts','plans','territories','assignments','followups','events'] loop
 execute format('create trigger %I before update on %I for each row execute function touch_updated()',t||'_updated',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create view v_coverage as
 select p.id plan_id,p.name plan,p.status,a.id account_id,a.external_id,a.name account,a.country,a.segment,a.currency,
 a.workload,a.annual_revenue_cents,t.code territory,r.name rep,x.rationale,
 a.reviewed_on,a.review_due,a.purpose
 from plans p join accounts a on a.currency=p.currency
 left join assignments x on x.plan_id=p.id and x.account_id=a.id
 left join territories t on t.id=x.territory_id left join reps r on r.id=t.rep_id;
create view v_capacity as
 select p.id plan_id,p.name plan,r.id rep_id,r.code,r.name rep,r.capacity,
 count(x.id)::int accounts,coalesce(sum(a.workload),0)::int workload,
 coalesce(sum(a.workload),0)::int-r.capacity overload
 from plans p join territories t on t.plan_id=p.id join reps r on r.id=t.rep_id
 left join assignments x on x.territory_id=t.id left join accounts a on a.id=x.account_id
 group by p.id,p.name,r.id,r.code,r.name,r.capacity;
create view v_quotas as
 select p.id plan_id,p.name plan,p.currency,p.target_cents,
 coalesce(sum(t.quota_cents),0)::bigint allocated_cents,
 p.target_cents-coalesce(sum(t.quota_cents),0)::bigint gap_cents
 from plans p left join territories t on t.plan_id=p.id group by p.id,p.name,p.currency,p.target_cents;
create view v_compliance as
 select 'account' kind,id,name,'Accuracy review missing or overdue' issue from accounts where reviewed_on is null or review_due is null or review_due<current_date
 union all select 'account',id,name,'Retention purpose missing' from accounts where trim(purpose)=''
 union all select 'rep',id,name,'Accuracy review missing or overdue' from reps where reviewed_on is null or review_due is null or review_due<current_date
 union all select 'rep',id,name,'Retention purpose missing' from reps where trim(purpose)='';
revoke all on v_coverage,v_capacity,v_quotas,v_compliance from public;
