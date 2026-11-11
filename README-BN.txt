SPL AUCTION MANAGER — ALL-IN-ONE PACKAGE

এই ZIP-এর মধ্যে চারটি ফাইল:
1) index.html
2) styles.css
3) app.js
4) README-BN.txt

ব্যবহার:
- ZIP Extract করুন।
- GitHub repository-তে Add file > Upload files দিয়ে চারটি ফাইল একসঙ্গে আপলোড করুন।
- একই নামের পুরোনো ফাইল Replace করুন এবং Commit changes দিন।
- Cloudflare Pages-এ নতুন deployment দিন।

এই সংস্করণে:
- Admin login এবং Football/Cricket নির্বাচন
- আলাদা auction_id অনুযায়ী দল ও খেলোয়াড়
- Player add/edit/delete, category, base price, photo upload
- Team name ও initial budget edit
- Player select, bid, pause, SOLD/UNSOLD
- Sales history এবং SOLD photo-card download

গুরুত্বপূর্ণ:
- Supabase project, tables, RLS policies, is_spl_admin() function এবং player-photos bucket মুছবেন না।
- app.js-এ Publishable key ব্যবহার করা হয়েছে। Service role/secret key কখনো frontend-এ বসাবেন না।
- Player photo bucket private; আপলোড করা ছবির path database-এ রাখা হয়। এই সংস্করণে photo-card-এ player photo embed করা হয়নি।
- এই সংস্করণটি উন্নয়ন/পরীক্ষার জন্য। একই সময়ে একাধিক admin bid দিলে atomic transaction/locking ছাড়া race condition হতে পারে। বাস্তব নিলামের আগে server-side atomic bidding, budget transaction, undo, realtime projector/public display এবং secure signed-photo delivery যোগ ও পরীক্ষা করতে হবে।
- বর্তমান admin-only RLS থাকলে projector display আলাদা public URL-এ data পড়তে পারবে না; public display চালুর আগে নিরাপদ read-only policy/endpoint তৈরি করতে হবে।
