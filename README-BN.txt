SPL AUCTION MANAGER — FILE PACKAGE

এই ZIP-এ ৪টি ফাইল থাকার কথা:
1. index.html
2. styles.css
3. app.js
4. README-BN.txt

ব্যবহার:
- ZIP Extract করলে একই ফোল্ডারে চারটি ফাইল দেখতে পাবেন।
- GitHub repository-তে আগের চারটি ফাইলের জায়গায় এই চারটি ফাইল আপলোড/Replace করতে হবে।
- তারপর Cloudflare Pages-এ নতুন deployment দিতে হবে।

গুরুত্বপূর্ণ:
- Supabase project এবং আগের database tables/policies মুছবেন না।
- app.js-এ Supabase URL ও Publishable Key সেট করা আছে।
- Supabase-এ is_spl_admin() RPC, admin-only RLS policies এবং player-photos private bucket আগের মতো থাকতে হবে।
- এই সংস্করণটি প্রাথমিক Admin dashboard: player add/edit, team budget/name edit, player select, bid, pause, SOLD/UNSOLD।
- বাস্তব নিলামের আগে একাধিক admin/একই সময়ে bid, atomic budget deduction, undo, realtime projector display, signed photo display ও photo card generation আরও উন্নত/পরীক্ষা করা প্রয়োজন।
- কোনো Service Role/secret key কখনো browser code-এ দেবেন না।
