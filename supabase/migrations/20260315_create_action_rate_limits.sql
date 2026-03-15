create table if not exists public.action_rate_limits (
    id bigserial primary key,
    scope text not null,
    key_hash text not null,
    window_started_at timestamptz not null default now(),
    hit_count integer not null default 0,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (scope, key_hash)
);

create index if not exists idx_action_rate_limits_window_started_at
    on public.action_rate_limits (window_started_at);
