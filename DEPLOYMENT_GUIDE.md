# PAB Website - Complete Deployment Guide

**Hosting Stack:** Vercel (Frontend + Backend) + TiDB Cloud (MySQL Database)  
**Cost:** Free tier available for both (scales automatically)  
**Setup Time:** ~15 minutes

---

## Part 1: Set Up Your Database (TiDB Cloud)

TiDB Cloud provides a free MySQL-compatible database—perfect for getting started.

### Step 1: Create a TiDB Cloud Account

1. Go to [https://tidbcloud.com](https://tidbcloud.com)
2. Sign up with GitHub or email
3. Create a new cluster:
   - **Plan:** Serverless (Free)
   - **Cluster name:** `pab-website`
   - **Region:** Choose closest to UK (e.g., London)
4. Wait for the cluster to initialize (~1 minute)

### Step 2: Get Your Database Connection String

1. In TiDB Cloud dashboard, click **"Connect"**
2. Create a new user and password (save these!)
3. Copy the **Connection String**. It should look like this:
   `mysql://[USER]:[PASSWORD]@[HOST]:4000/[DB_NAME]?ssl={"rejectUnauthorized":true}`
4. Save this—you'll need it for Vercel

### Step 3: Enable SSL Connection (Required for Vercel)

1. TiDB Cloud Serverless clusters have SSL enabled by default.
2. The connection string includes the necessary SSL parameters.

---

## Part 2: Deploy to Vercel

Vercel makes deployment as simple as connecting your GitHub repo.

### Step 1: Push Your Code to GitHub

1. Install GitHub CLI (if not already installed):
   ```bash
   brew install gh  # macOS
   # or use: sudo apt install gh  # Linux
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

3. Create a new repository:
   ```bash
   cd /home/ubuntu/pab-website
   git init
   git add .
   git commit -m "Initial commit: PAB website with database"
   gh repo create pab-website --source=. --remote=origin --push
   ```

4. Choose:
   - **Visibility:** Public (or Private if you prefer)
   - **Repository name:** `pab-website`

### Step 2: Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub (if not already signed up)
3. Click **"Import Project"**
4. Select your `pab-website` repository
5. Vercel will auto-detect it's a Node.js project ✓

### Step 3: Add Environment Variables

Before deploying, add your database connection string and optional email settings:

1. In the Vercel import dialog, scroll to **"Environment Variables"**
2. Add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `mysql://...` | Your TiDB Cloud connection string (from Part 1, Step 2) |
| `JWT_SECRET` | Random string | Generate a random string: `openssl rand -hex 32` |
| `SMTP_HOST` | `smtp.office365.com` | Your SMTP server (e.g., Outlook/Office365) |
| `SMTP_PORT` | `587` | Usually 587 for TLS |
| `SMTP_USER` | `your-email@...` | Your email address |
| `SMTP_PASS` | `your-password` | Your email password or app password |
| `SMTP_TO` | `recipient@...` | (Optional) Where to receive messages |

3. Click **"Deploy"**
4. Wait ~3-5 minutes for deployment to complete

### Step 4: Get Your Vercel URL

After deployment, Vercel shows your live URL:
- Example: `https://pab-website.vercel.app`
- This is your temporary domain

---

## Part 3: Connect Your GoDaddy Domain

Now point your GoDaddy domain to Vercel.

### Step 1: Add Custom Domain in Vercel

1. In Vercel dashboard, go to your project
2. Click **"Settings > Domains"**
3. Click **"Add Domain"**
4. Enter your GoDaddy domain (e.g., `pab.co.uk`)
5. Vercel will show you DNS records to add

### Step 2: Update DNS in GoDaddy

1. Log in to [https://godaddy.com](https://godaddy.com)
2. Go to **"My Products > Domains"**
3. Find your domain and click **"Manage"**
4. Click **"DNS"** (or **"Nameservers"**)
5. Add the DNS records from Vercel:
   - Usually a `CNAME` record pointing to Vercel's servers
   - Copy exactly what Vercel shows

6. Wait 24-48 hours for DNS to propagate (usually faster)
7. Once propagated, your domain will work! ✓

---

## Part 4: Manage Your Website

### Access Your Admin Dashboard

Your website now has:
- **Frontend:** `https://yourdomain.com`
- **Backend API:** `https://yourdomain.com/api/trpc`
- **Database:** Managed in TiDB Cloud

### Make Changes Locally

1. Edit files in your project directory
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update services section"
   git push origin main
   ```
3. Vercel automatically redeploys! (watch the deployment status)

### Update Database Schema

If you add new features that need database changes:

1. Edit `drizzle/schema.ts`
2. Run locally: `pnpm db:push`
3. Commit and push to GitHub

### View Database in TiDB Cloud

1. Go to [https://tidbcloud.com](https://tidbcloud.com)
2. Open your cluster
3. Click **"Chat2Query"** or use a MySQL client (like MySQL Workbench or TablePlus) to see your data.

---

## Part 5: Contact Form Setup

Your contact form sends data to your database **and** attempts to send an email notification.

### 1. View in Database
1. In TiDB Cloud, use the SQL editor to query the `contact_submissions` table.
2. All form submissions appear here automatically.

### 2. Email Notifications
To receive emails, you **must** configure the SMTP variables in Vercel (see Part 2, Step 3). If they are not set, submissions will still be saved to the database, but no email will be sent.

---

## Part 6: Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` in Vercel environment variables
- Ensure the connection string includes `ssl={"rejectUnauthorized":true}`
- Verify password is correct

### "Domain not working after 48 hours"
- Check DNS propagation: [https://dnschecker.org](https://dnschecker.org)
- Verify DNS records in GoDaddy match Vercel exactly
- Clear browser cache and try incognito mode

### "Vercel deployment failed"
- Check build logs in Vercel dashboard
- Ensure all dependencies are installed: `pnpm install`
- Run locally: `pnpm build` to test

### "Can't log in to Manus OAuth"
- This template includes OAuth, but you can skip it for a public site
- Just remove auth routes if not needed

---

## Part 7: Scaling & Upgrades

### When You Need More

| Feature | Free Tier | When to Upgrade |
|---------|-----------|-----------------|
| **Database Storage** | 5GB | >5GB data → TiDB Cloud Dedicated |
| **Bandwidth** | 100GB/month | >100GB traffic → Vercel Pro ($20/mo) |
| **Build Minutes** | 6,000/month | >6,000 min → Vercel Pro |

### Upgrade Steps

1. **TiDB Cloud:** Go to **Billing > Upgrade Plan**
2. **Vercel:** Go to **Settings > Billing > Upgrade**

---

## Part 8: Backup Your Data

### Manual Backup
```bash
# Export database using mysqldump
mysqldump -h [HOST] -u [USER] -p [DB_NAME] > backup.sql

# Restore later
mysql -h [HOST] -u [USER] -p [DB_NAME] < backup.sql
```

---

## Part 9: Security Checklist

Before going live:

- [ ] Use strong database password ✓
- [ ] Add environment variables to Vercel (not in code) ✓
- [ ] Enable HTTPS on custom domain (Vercel does this automatically) ✓
- [ ] Regular backups enabled ✓

---

## Part 10: Next Steps

1. **Update contact details** in your website code
2. **Add real portfolio projects** to showcase work
3. **Set up email notifications** for contact form submissions
4. **Monitor analytics** in Vercel dashboard
5. **Collect feedback** from users and iterate

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **TiDB Cloud Docs:** https://docs.pingcap.com/tidbcloud
- **MySQL Docs:** https://dev.mysql.com/doc/
- **tRPC Docs:** https://trpc.io/docs

---

## Quick Reference Commands

```bash
# Local development
pnpm dev

# Build for production
pnpm build

# Database migrations
pnpm db:push

# Run tests
pnpm test

# Format code
pnpm format

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

---

**You're all set!** Your website is now live, scalable, and ready for growth. 🚀
