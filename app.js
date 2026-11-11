const SUPABASE_URL = "https://vwsodzsimnrvigrxeusr.supabase.co";
const SUPABASE_KEY = "sb_publishable_nV6AWGiuN2asXdZFjSIYBg_4BNp7DdD";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const fmt = n => "৳" + Number(n || 0).toLocaleString("en-BD");
const ids = {football:"11111111-1111-4111-8111-111111111111", cricket:"22222222-2222-4222-8222-222222222222"};
let auctionId = null, auctionTitle = "", players = [], teams = [], state = null, settings = null, currentPlayer = null, paused = false;

function show(view){["loginView","auctionView","dashboardView"].forEach(id=>$(id).classList.toggle("hidden",id!==view));$("logoutBtn").classList.toggle("hidden",view==="loginView");}
function msg(text, bad=false){$("notice").textContent=text;$("notice").style.color=bad?"#b33":"#247448";}
async function checkAdmin(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){show("loginView");return;}
  const {data,error}=await db.rpc("is_spl_admin");
  if(error||data!==true){await db.auth.signOut();$("loginMsg").textContent="This account is not authorized as an SPL admin.";show("loginView");return;}
  show("auctionView");
}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginMsg").textContent="Signing in...";const {error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error){$("loginMsg").textContent=error.message;return;}await checkAdmin();});
$("logoutBtn").onclick=async()=>{await db.auth.signOut();show("loginView");};
document.querySelectorAll(".auction-card").forEach(btn=>btn.onclick=()=>openAuction(btn.dataset.auction,btn.dataset.auction===ids.football?"Football Auction":"Cricket Auction"));
$("backBtn").onclick=()=>show("auctionView");

async function openAuction(id,title){
  auctionId=id;auctionTitle=title;$("auctionTitle").textContent=title;show("dashboardView");msg("Loading auction...");
  const [t,p,s,g]=await Promise.all([
    db.from("teams").select("*").eq("auction_id",id).order("created_at"),
    db.from("players").select("*").eq("auction_id",id).order("created_at",{ascending:false}),
    db.from("auction_state").select("*").eq("auction_id",id).maybeSingle(),
    db.from("auction_settings").select("*").eq("auction_id",id).maybeSingle()
  ]);
  const err=t.error||p.error||s.error||g.error;if(err){msg(err.message,true);return;}
  teams=t.data||[];players=p.data||[];state=s.data;settings=g.data;paused=!!state?.is_paused;
  render();msg("Auction data loaded.");
}
function render(){
  $("sessionStatus").textContent=paused?"PAUSED":"READY";
  $("teamStats").innerHTML=teams.map(team=>`<div class="stat"><small>${esc(team.name)}</small><b>${fmt(team.remaining_budget)}</b><small>${players.filter(p=>p.team_id===team.id&&p.status==="sold").length} players sold</small></div>`).join("");
  $("leadingTeam").innerHTML='<option value="">Select team</option>'+teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
  renderPlayers();renderTeams();renderCurrent();
  $("pauseBtn").textContent=paused?"Resume":"Pause";
}
function renderPlayers(){
 const q=$("playerSearch").value.toLowerCase(),st=$("statusFilter").value;
 $("playersBody").innerHTML=players.filter(p=>(p.name||"").toLowerCase().includes(q)&&(st==="all"||p.status===st)).map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${p.category}</td><td>${fmt(p.base_price)}</td><td><span class="tag">${p.status}</span></td><td><button class="secondary small" data-edit="${p.id}">Edit</button> <button class="secondary small" data-select="${p.id}" ${p.status!=="available"?"disabled":""}>Select</button></td></tr>`).join("")||'<tr><td colspan="5">No players found.</td></tr>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editPlayer(b.dataset.edit));
 document.querySelectorAll("[data-select]").forEach(b=>b.onclick=()=>selectPlayer(b.dataset.select));
}
function renderTeams(){
 $("teamsEditor").innerHTML=teams.map(t=>`<div class="team-edit"><label>Team name<input data-team-name="${t.id}" value="${esc(t.name)}"></label><label>Budget (BDT)<input data-team-budget="${t.id}" type="number" min="0" value="${Number(t.initial_budget)}"></label><button class="secondary small" data-team-save="${t.id}">Save team</button></div>`).join("");
 document.querySelectorAll("[data-team-save]").forEach(b=>b.onclick=()=>saveTeam(b.dataset.teamSave));
}
function renderCurrent(){
 currentPlayer=players.find(p=>p.id===state?.current_player_id)||null;
 $("currentPlayer").innerHTML=currentPlayer?`<div class="avatar">${esc(currentPlayer.name.slice(0,2).toUpperCase())}</div><h3>${esc(currentPlayer.name)}</h3><p class="muted">Category ${currentPlayer.category} · Base ${fmt(currentPlayer.base_price)}</p>`:'<div class="avatar">SPL</div><h3>No player selected</h3><p class="muted">Select an available player from the list.</p>';
 $("currentBid").textContent=fmt(state?.current_bid||0);
 $("bidBtn").disabled=!currentPlayer||paused;$("soldBtn").disabled=!currentPlayer||paused;$("unsoldBtn").disabled=!currentPlayer||paused;
 if(state?.leading_team_id)$("leadingTeam").value=state.leading_team_id;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function selectPlayer(id){
 const p=players.find(x=>x.id===id);if(!p)return;
 const {error}=await db.from("auction_state").update({current_player_id:id,leading_team_id:null,current_bid:0,is_paused:false,updated_at:new Date().toISOString()}).eq("auction_id",auctionId);
 if(error){msg(error.message,true);return;}await openAuction(auctionId,auctionTitle);
}
$("addPlayerBtn").onclick=()=>openPlayerDialog();
$("closePlayerDialog").onclick=()=>$("playerDialog").close();
function openPlayerDialog(p=null){$("playerDialogTitle").textContent=p?"Edit player":"Add player";$("editPlayerId").value=p?.id||"";$("playerName").value=p?.name||"";$("playerCategory").value=p?.category||"A";$("playerPrice").value=p?.base_price??(settings?.category_a_base||6000000);$("playerPhoto").value="";$("playerFormMsg").textContent="";$("playerDialog").showModal();}
function editPlayer(id){const p=players.find(x=>x.id===id);if(p)openPlayerDialog(p);}
$("playerForm").addEventListener("submit",async e=>{
 e.preventDefault();const id=$("editPlayerId").value,name=$("playerName").value.trim(),category=$("playerCategory").value,base_price=Number($("playerPrice").value);
 const payload={auction_id:auctionId,name,category,base_price};
 let result;
 if(id)result=await db.from("players").update(payload).eq("id",id);
 else result=await db.from("players").insert(payload);
 if(result.error){$("playerFormMsg").textContent=result.error.message;return;}
 const newId=id||((await db.from("players").select("id").eq("auction_id",auctionId).eq("name",name).order("created_at",{ascending:false}).limit(1)).data||[])[0]?.id;
 const file=$("playerPhoto").files[0];
 if(file&&newId){const ext=file.name.split(".").pop().toLowerCase(),path=`${auctionId}/${newId}.${ext}`;const up=await db.storage.from("player-photos").upload(path,file,{upsert:true,contentType:file.type});if(up.error){$("playerFormMsg").textContent="Player saved, but photo upload failed: "+up.error.message;return;}const {data:signed}=await db.storage.from("player-photos").createSignedUrl(path,3600);if(signed?.signedUrl)await db.from("players").update({photo_url:path}).eq("id",newId);}
 $("playerDialog").close();await openAuction(auctionId,auctionTitle);
});
$("playerSearch").oninput=renderPlayers;$("statusFilter").onchange=renderPlayers;
async function saveTeam(id){
 const name=document.querySelector(`[data-team-name="${id}"]`).value.trim(),budget=Number(document.querySelector(`[data-team-budget="${id}"]`).value);
 const {error}=await db.from("teams").update({name,initial_budget:budget,remaining_budget:budget}).eq("id",id);
 if(error){msg(error.message,true);return;}await openAuction(auctionId,auctionTitle);
}
$("leadingTeam").onchange=async()=>{if(!state)return;const {error}=await db.from("auction_state").update({leading_team_id:$("leadingTeam").value||null,updated_at:new Date().toISOString()}).eq("auction_id",auctionId);if(error)msg(error.message,true);else{state.leading_team_id=$("leadingTeam").value||null;msg("Leading team updated.");}};
$("bidBtn").onclick=async()=>{
 if(!currentPlayer||paused)return;const increment=Number(settings?.bid_increment||500000),amount=Number(state?.current_bid||0)+increment,teamId=$("leadingTeam").value;
 if(!teamId){msg("Select the leading team before placing a bid.",true);return;}
 const {error:be}=await db.from("bids").insert({auction_id:auctionId,player_id:currentPlayer.id,team_id:teamId,bid_amount:amount});if(be){msg(be.message,true);return;}
 const {error}=await db.from("auction_state").update({current_bid:amount,leading_team_id:teamId,updated_at:new Date().toISOString()}).eq("auction_id",auctionId);if(error){msg(error.message,true);return;}await openAuction(auctionId,auctionTitle);
};
$("pauseBtn").onclick=async()=>{if(!state)return;const {error}=await db.from("auction_state").update({is_paused:!paused,updated_at:new Date().toISOString()}).eq("auction_id",auctionId);if(error){msg(error.message,true);return;}paused=!paused;render();};
async function finishPlayer(status){
 if(!currentPlayer)return;const teamId=$("leadingTeam").value,price=Number(state?.current_bid||0);
 if(status==="sold"&&!teamId){msg("Choose a team before marking SOLD.",true);return;}
 if(status==="sold"){
  const team=teams.find(t=>t.id===teamId);if(!team||Number(team.remaining_budget)<price){msg("Selected team does not have enough remaining budget.",true);return;}
  const {error:se}=await db.from("sales").insert({auction_id:auctionId,player_id:currentPlayer.id,team_id:teamId,player_name:currentPlayer.name,category:currentPlayer.category,sold_price:price,photo_url:currentPlayer.photo_url});
  if(se){msg(se.message,true);return;}
  const {error:te}=await db.from("teams").update({remaining_budget:Number(team.remaining_budget)-price}).eq("id",teamId);if(te){msg(te.message,true);return;}
  const {error:pe}=await db.from("players").update({status:"sold",team_id:teamId,sold_price:price}).eq("id",currentPlayer.id);if(pe){msg(pe.message,true);return;}
 }else{const {error}=await db.from("players").update({status:"unsold",team_id:null,sold_price:null}).eq("id",currentPlayer.id);if(error){msg(error.message,true);return;}}
 await db.from("auction_state").update({current_player_id:null,leading_team_id:null,current_bid:0,is_paused:false,updated_at:new Date().toISOString()}).eq("auction_id",auctionId);
 await openAuction(auctionId,auctionTitle);msg(status==="sold"?"Player marked SOLD.":"Player marked UNSOLD.");
}
$("soldBtn").onclick=()=>finishPlayer("sold");$("unsoldBtn").onclick=()=>finishPlayer("unsold");
checkAdmin();
