const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-this-admin-key';
const DATA = path.join(__dirname, 'scores.json');
app.use(express.json({limit:'30kb'}));
app.use(express.static(path.join(__dirname, 'public')));
function readScores(){ try { return JSON.parse(fs.readFileSync(DATA,'utf8')); } catch { return []; } }
function writeScores(rows){ fs.writeFileSync(DATA, JSON.stringify(rows,null,2)); }
const sessions = new Map();
const levels = [
 {seconds:60,target:8},{seconds:75,target:10},{seconds:90,target:12},
 {seconds:90,target:14},{seconds:120,target:16}
];
app.get('/api/config',(req,res)=>res.json({levels, title:'Thanksgiving Adventure'}));
app.post('/api/session',(req,res)=>{
  const name=String(req.body.name||'').trim().slice(0,50);
  const character=['turkey','pilgrim'].includes(req.body.character)?req.body.character:'turkey';
  if(name.length<2) return res.status(400).json({error:'Ingresa un nombre de al menos 2 caracteres.'});
  const id=crypto.randomUUID();
  const seed=crypto.randomBytes(16).toString('hex');
  sessions.set(id,{id,name,character,seed,started:Date.now(),level:1,score:0,events:[],finished:false});
  res.json({sessionId:id,seed,levels});
});
// The server validates session state, level sequence, duration and score caps.
// For production, use a persistent database and stronger game telemetry/anti-bot controls.
app.post('/api/collect',(req,res)=>{
  const s=sessions.get(String(req.body.sessionId||''));
  if(!s || s.finished) return res.status(400).json({error:'Partida no válida.'});
  const level=Number(req.body.level), points=Number(req.body.points), elapsed=Number(req.body.elapsed);
  if(level!==s.level || !Number.isInteger(points) || points<1 || points>5 || !Number.isFinite(elapsed) || elapsed<0)
    return res.status(400).json({error:'Evento de puntuación inválido.'});
  const now=Date.now();
  const last=s.events.filter(e=>e.level===level).at(-1);
  if(last && now-last.serverAt<180) return res.status(429).json({error:'Demasiado rápido.'});
  s.events.push({level,points,elapsed,serverAt:now});
  s.score += points;
  res.json({score:s.score});
});
app.post('/api/level-complete',(req,res)=>{
  const s=sessions.get(String(req.body.sessionId||''));
  if(!s || s.finished) return res.status(400).json({error:'Partida no válida.'});
  const level=Number(req.body.level);
  if(level!==s.level || level<1 || level>5) return res.status(400).json({error:'Nivel inválido.'});
  const duration=levels[level-1].seconds;
  const actual=(Date.now()-s.started)/1000;
  if(actual < level*duration*0.35 && s.events.length < level*2) return res.status(400).json({error:'La partida necesita más actividad para validar el nivel.'});
  s.level=level+1;
  res.json({ok:true,nextLevel:s.level});
});
app.post('/api/finish',(req,res)=>{
  const s=sessions.get(String(req.body.sessionId||''));
  if(!s || s.finished) return res.status(400).json({error:'Partida no válida.'});
  s.finished=true;
  const row={id:crypto.randomUUID(),name:s.name,character:s.character,score:s.score,levelsCompleted:Math.min(5,s.level-1),submittedAt:new Date().toISOString(),status:'pending',events:s.events.length};
  const rows=readScores(); rows.push(row); writeScores(rows);
  res.json({ok:true,result:row});
});
app.get('/api/leaderboard',(req,res)=>{
  const rows=readScores().filter(x=>x.status==='approved').sort((a,b)=>b.score-a.score || a.submittedAt.localeCompare(b.submittedAt));
  res.json(rows.slice(0,50).map(({name,character,score,levelsCompleted,submittedAt})=>({name,character,score,levelsCompleted,submittedAt})));
});
function admin(req,res,next){
  const key=req.get('x-admin-key') || req.query.key;
  if(!key || key!==ADMIN_KEY) return res.status(401).json({error:'Acceso de administrador no autorizado.'});
  next();
}
app.get('/api/admin/scores',admin,(req,res)=>{
  res.json(readScores().sort((a,b)=>b.score-a.score));
});
app.post('/api/admin/review',admin,(req,res)=>{
  const {id,status}=req.body;
  if(!['approved','rejected','pending'].includes(status)) return res.status(400).json({error:'Estado inválido.'});
  const rows=readScores(); const row=rows.find(x=>x.id===id);
  if(!row) return res.status(404).json({error:'Resultado no encontrado.'});
  row.status=status; row.reviewedAt=new Date().toISOString(); writeScores(rows);
  res.json({ok:true,row});
});
app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.listen(PORT,()=>console.log(`Thanksgiving Adventure running on port ${PORT}`));
