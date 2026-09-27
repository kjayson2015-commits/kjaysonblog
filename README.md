# Your blog: how to put it online

Your blog runs on two free services:

- **Supabase** stores your posts and handles your login, so the dashboard works.
- **GitHub Pages** shows the website to everyone. Every hour, GitHub also builds a real web page for each published post, plus a sitemap, so Google can find and read your posts.

You only need to do this setup once.

---

## 1. Create the database (Supabase)

1. Go to **supabase.com**, sign up for free and click **New project**.
2. Pick a name (for example `my-blog`), set a database password (save it somewhere) and choose the region closest to you. Click **Create**, then wait a minute or two.

## 2. Set up the tables

1. Open **SQL Editor → New query**.
2. Paste in everything from `setup.sql`.
3. At **STEP 4** near the bottom, change `you@example.com` to the email you'll log in with.
4. Click **Run**. You should see "Success". (It's safe to run again later if you ever need to.)

## 3. Create your login

1. Open **Authentication → Users → Add user → Create new user**. Enter the **same email** as in step 2, choose a password, tick **Auto Confirm User** and click Create.
2. Open **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up".

## 4. Fill in config.js

Open `config.js` in any text editor and fill in three things, keeping the quote marks:

- **supabaseUrl**: click **Connect** at the top of your Supabase project (or go to Project Settings → API) and copy the **Project URL**.
- **supabaseKey**: the **anon public** key (newer projects call it the **publishable** key). Never use the "service_role" or "secret" key.
- **siteUrl**: already set to `https://kjayson.online`.

## 5. Put it on GitHub

1. On **github.com**, click **New repository**. Name it (for example `blog`), make it **Public** and click Create.
2. Click **uploading an existing file** and drag in: `index.html`, `config.js`, `build.mjs`, `logo.jpg`, `icon-64.png` and `icon-180.png`. Click **Commit changes**.
3. Add the file that tells GitHub to build your blog. Click **Add file → Create new file** and type this exact name: `.github/workflows/build.yml` (the slashes create the folders). Open `build.yml` from the `.github/workflows` folder in this zip (you may need to show hidden files), copy everything into the box and click **Commit changes**.
4. Open **Settings → Pages**. Under **Source**, choose **GitHub Actions**.
5. Open the **Actions** tab and click **Build and publish blog → Run workflow**. After about a minute you'll see a green tick.

## 6. Connect kjayson.online (Namecheap)

**In Namecheap:**

1. Go to **Domain List** and click **Manage** next to `kjayson.online`.
2. Open the **Advanced DNS** tab.
3. Under **Host Records**, delete the records Namecheap added for you (usually a **CNAME** for `www` pointing to `parkingpage.namecheap.com` and a **URL Redirect** for `@`). Click the bin icon next to each one.
4. Click **Add New Record** five times and fill them in like this (leave TTL on Automatic):

   | Type | Host | Value |
   |---|---|---|
   | A Record | `@` | `185.199.108.153` |
   | A Record | `@` | `185.199.109.153` |
   | A Record | `@` | `185.199.110.153` |
   | A Record | `@` | `185.199.111.153` |
   | CNAME Record | `www` | `YOUR-GITHUB-USERNAME.github.io.` |

5. Click the green **tick** on each row to save it.

**In GitHub:**

6. Go to **Settings → Pages → Custom domain**, type `kjayson.online` and click **Save**. GitHub checks your DNS, which can take from a few minutes to a few hours.
7. When it says the DNS check was successful, tick **Enforce HTTPS**. Visitors who type `www.kjayson.online` will be sent to `kjayson.online` automatically.

**In Supabase:**

8. Go to **Authentication → URL Configuration** and set **Site URL** to `https://kjayson.online`.

`config.js` already has `siteUrl` set to `https://kjayson.online`, so nothing to change there.

## 7. Tell Google about your blog

1. Go to **search.google.com/search-console** and click **Add property → Domain**. Type `kjayson.online`.
2. Google shows you a line starting with `google-site-verification=`. Copy it, and in Namecheap's **Advanced DNS** click **Add New Record → TXT Record**, with Host `@` and that line as the Value. Save it, go back to Google and click **Verify**. If it doesn't work the first time, wait 10 minutes and try again.
3. Open **Sitemaps**, type `sitemap.xml` and click **Submit**.
4. Each time you publish something important, open **URL inspection**, paste the post's address and click **Request indexing**.
5. Optional: at **bing.com/webmasters**, choose **Import from Google Search Console**. This also covers Bing, DuckDuckGo and Yahoo.

## 8. Start writing

Open **kjayson.online** and click **Log in** at the bottom of the page. Change your blog name, tagline, About text and **Your name** in **Settings**. Delete the sample posts and write your own.

---

## How to get a post found first

Nobody can promise a #1 spot on Google, but the blog now handles the technical side for you: each post gets its own address, title, description, sitemap entry and structured data. What decides where you rank is mostly what you write:

1. **Pick one focus phrase per post**: the exact words someone would type into Google, such as "how to read a court transcript". Specific phrases are much easier to win than broad ones like "court".
2. Type it into **Focus phrase** in the editor's **Search engines** box and work through the checklist. The phrase should be in the title, the permalink, the search description, the first paragraph and at least one heading.
3. **Answer the question fully.** Aim for 300 words or more, and make it more useful than what's already ranking.
4. **Write a search description** of 70–155 characters. It's the grey text under your title on Google, and it's what makes people click.
5. **Link between your own posts**, and share each post wherever your readers are. Links from other sites are one of Google's strongest signals.
6. **Be patient and keep posting.** A new domain usually takes a few weeks to show up, and steady posting helps.

## Good to know

- **New posts:** readers can open a post as soon as you publish it. Its search-friendly page is built within the hour. To update straight away, go to **Actions → Build and publish blog → Run workflow**.
- **Permalinks:** once a post is published, its permalink stops changing when you edit the title, because changing it would break links people have already shared. You can still change it by hand, but try not to.
- **Supabase pausing:** free projects pause after about a week with no activity. The hourly build counts as activity, so this shouldn't happen. If the blog ever stops loading, log in at supabase.com and click **Restore project**.
- **GitHub pausing the hourly build:** GitHub turns off scheduled builds in repositories with no changes for 60 days, and emails you when it does. Click **Enable workflow** on the Actions tab to switch it back on.
- **Changing the logo:** replace `logo.jpg` (square) and the two `icon-` files with new ones of the same names.
