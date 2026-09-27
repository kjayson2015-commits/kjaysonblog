# Your blog: how to put it online

Your blog is made of two free pieces:

- **GitHub Pages** shows the website to everyone (the files in this folder).
- **Supabase** stores your posts and handles your login, so the dashboard works.

It takes about 15 minutes to set up. You only do this once.

---

## 1. Create the database (Supabase)

1. Go to **supabase.com**, sign up for free and click **New project**.
2. Give it a name (for example `my-blog`), choose a database password (save it somewhere) and pick the region closest to you. Click **Create**, then wait a minute or two while it gets ready.

## 2. Set up the tables

1. In your project, open **SQL Editor** in the left menu and click **New query**.
2. Open `setup.sql` from this folder, copy everything and paste it in.
3. Find **STEP 4** near the bottom and change `you@example.com` to the email you'll log in with.
4. Click **Run**. You should see "Success".

This creates the posts, your site settings and the security rules. The rules let anyone read published posts, while only you can see drafts or change anything. It also adds three sample posts, which you can delete later.

## 3. Create your login

1. Open **Authentication → Users** and click **Add user → Create new user**.
2. Enter the **same email** as in step 2, choose a password and tick **Auto Confirm User**. Click **Create user**.
3. Stop strangers from signing up: open **Authentication → Sign In / Providers** (on some accounts it's under **Settings**) and turn **off** "Allow new users to sign up". Save.

## 4. Connect the website to the database

1. Click **Connect** at the top of your project page, or open **Project Settings → API**.
2. Copy the **Project URL** (it looks like `https://abcdefgh.supabase.co`).
3. Copy the **anon public** key (newer projects call it the **publishable** key).
4. Open `config.js` in this folder with any text editor and paste both values in place of the `PASTE_...` text. Keep the quote marks.

Only ever use the anon/publishable key. Never put the **service_role** or **secret** key in `config.js`.

## 5. Put it online (GitHub Pages)

1. On **github.com**, click **New repository**. Name it, for example `blog`, make it **Public** and create it.
2. Click **uploading an existing file** and drag in every file from this folder: `index.html`, `config.js`, `logo.jpg`, `icon-64.png` and `icon-180.png`. You don't need to upload `setup.sql` or this README. Click **Commit changes**.
3. Open **Settings → Pages**. Under "Branch" choose **main** and **/(root)**, then click **Save**.
4. After a minute your blog is live at `https://YOUR-USERNAME.github.io/blog/`.

## 6. Start writing

Open your blog and click **Log in** at the bottom of the page. Sign in with the email and password from step 3 to get the dashboard, where you can write posts, save drafts, publish, and change the title, tagline and About text.

---

### Good to know

- **Free plan pause:** Supabase pauses free projects after about a week with no activity. If your blog stops loading, log in at supabase.com and click **Restore project**. Posting regularly keeps it active.
- **Changing the logo:** replace `logo.jpg` with another square picture of the same name. Replace `icon-64.png` and `icon-180.png` too if you want a new browser-tab icon.
- **Your own web address** (like `www.yourname.com`): buy the domain anywhere, then add it under GitHub **Settings → Pages → Custom domain**.
