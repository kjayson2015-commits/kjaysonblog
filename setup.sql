-- =====================================================================
--  Blog database setup — paste this whole file into Supabase's SQL Editor
--  and press Run. It's safe to run more than once.
--
--  BEFORE YOU RUN IT: change the email in STEP 4 to the email you will
--  log in with.
-- =====================================================================

-- STEP 1. Tables ---------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  html         text not null default '',
  category     text not null default '',
  excerpt      text not null default '',
  status       text not null default 'draft' check (status in ('publish', 'draft')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.settings (
  id      int primary key default 1 check (id = 1),
  title   text not null default 'My Blog',
  tagline text not null default '',
  about   text not null default ''
);

create table if not exists public.admins (
  email text primary key
);

-- STEP 2. "Is the logged-in person an admin?" ---------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- STEP 3. Security rules --------------------------------------------------
-- Everyone can read published posts and the site settings.
-- Only admins can see drafts or add, change and delete anything.
alter table public.posts    enable row level security;
alter table public.settings enable row level security;
alter table public.admins   enable row level security;   -- no rules = nobody can read it from the site

grant select on public.posts, public.settings to anon, authenticated;
grant insert, update, delete on public.posts, public.settings to authenticated;

drop policy if exists "read posts"      on public.posts;
drop policy if exists "add posts"       on public.posts;
drop policy if exists "edit posts"      on public.posts;
drop policy if exists "delete posts"    on public.posts;
drop policy if exists "read settings"   on public.settings;
drop policy if exists "add settings"    on public.settings;
drop policy if exists "edit settings"   on public.settings;

create policy "read posts"    on public.posts    for select using (status = 'publish' or public.is_admin());
create policy "add posts"     on public.posts    for insert with check (public.is_admin());
create policy "edit posts"    on public.posts    for update using (public.is_admin()) with check (public.is_admin());
create policy "delete posts"  on public.posts    for delete using (public.is_admin());
create policy "read settings" on public.settings for select using (true);
create policy "add settings"  on public.settings for insert with check (public.is_admin());
create policy "edit settings" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- STEP 4. Make yourself the admin  >>> CHANGE THIS EMAIL <<< ---------------
insert into public.admins (email) values ('you@example.com')
on conflict do nothing;

-- STEP 5. Starter content (edit or delete it later from your dashboard) -----
insert into public.settings (id, title, tagline, about)
values (1, 'My Blog', 'Notes, updates and ideas',
        'Say a line or two about yourself and what you write about. Change this in Dashboard → Settings.')
on conflict (id) do nothing;

insert into public.posts (title, category, excerpt, status, published_at, created_at, updated_at, html)
select * from (values
  ('Welcome to your new blog', 'Announcements', '', 'publish',
   '2026-09-27 21:00:00+00'::timestamptz, '2026-09-27 21:00:00+00'::timestamptz, '2026-09-27 21:00:00+00'::timestamptz,
   $p$<p>This is your first post. It's a sample, so feel free to edit it or delete it once you've written something of your own.</p><p>Your blog has two sides. Readers see this page: the home feed, single posts, categories and search. You also get a <strong>Dashboard</strong>: click <em>Log in</em> at the bottom of the page to write posts, keep drafts and change the site's name.</p><blockquote>Tip: open Dashboard → Posts, hover over this post and choose Trash to remove it.</blockquote><p>Happy writing!</p>$p$),
  ('How to write and publish a post', 'Guides', 'A two-minute tour of the editor: titles, formatting, categories, drafts and publishing.', 'publish',
   '2026-09-26 15:00:00+00'::timestamptz, '2026-09-26 15:00:00+00'::timestamptz, '2026-09-26 15:00:00+00'::timestamptz,
   $p$<h2>Start a post</h2><p>Log in, then click <strong>+ New post</strong> in the top bar. Give it a title, then write in the big box underneath.</p><h2>Format as you go</h2><ul><li>Use the <strong>Paragraph</strong> menu to turn a line into a heading, a quote or preformatted text.</li><li><strong>B</strong>, <em>I</em> and <u>U</u> make selected text bold, italic or underlined.</li><li>Select some words and press <strong>Link</strong> to add a web address.</li></ul><h2>Save or publish</h2><ol><li><strong>Save draft</strong> keeps the post private to you.</li><li><strong>Publish</strong> puts it on the home page for everyone.</li><li>Already published? <strong>Update</strong> saves your changes, and <strong>Switch to draft</strong> takes it down again.</li></ol><p>Press Ctrl+S (or ⌘S) at any time to save.</p>$p$),
  ('Five ideas for your first week of posts', 'Ideas', '', 'publish',
   '2026-09-25 13:00:00+00'::timestamptz, '2026-09-25 13:00:00+00'::timestamptz, '2026-09-25 13:00:00+00'::timestamptz,
   $p$<p>Staring at an empty blog is the hardest part. Here are five easy starters.</p><ol><li><strong>An introduction.</strong> Who you are and what readers can expect here.</li><li><strong>Something you learned this week.</strong> Short and specific beats long and general.</li><li><strong>A how-to.</strong> Write down a process you know well, step by step.</li><li><strong>A list of favourites.</strong> Tools, books, places or people you'd recommend.</li><li><strong>An update.</strong> What you're working on and what's next.</li></ol>$p$)
) as v
where not exists (select 1 from public.posts);
