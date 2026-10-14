#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';

export const commands={
 help:'',plans:'',reps:'',accounts:'',territories:'plan',coverage:'plan',capacity:'plan',quotas:'plan',compliance:'',attention:'plan',activity:'',
 'show-plan':'plan',compare:'plan other','weekly-review':'plan',
 'add-rep':'code name capacity actor','add-account':'external-id name currency workload actor',
 'add-plan':'name starts ends currency target actor','add-territory':'plan code name rep quota actor',
 assign:'plan account territory rationale actor',quota:'plan territory amount actor',
 'review-account':'account due purpose actor','review-rep':'rep due purpose actor',
 'set-capacity':'rep capacity actor','set-workload':'account workload actor','set-target':'plan amount actor',
 log:'plan note due owner actor',resolve:'followup evidence actor',
 'clone-plan':'plan name actor','approve-plan':'plan evidence actor',
 import:'file currency actor',export:'out','draft-plan':'plan','draft-review':'plan'
};
const writes=new Set(['set-capacity','set-workload','set-target','add-rep','add-account','add-plan','add-territory','assign','quota','review-account','review-rep','log','resolve','clone-plan','approve-plan','import']);
const tables=['reps','accounts','plans','territories','assignments','followups','events'];
const today=()=>new Date().toISOString().slice(0,10);
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Expected a valid YYYY-MM-DD date');return s;}
function integer(s){if(!/^[1-9]\d*$/.test(String(s))||Number(s)>1000000)throw Error('Expected a positive whole number up to 1000000');return Number(s);}
export function cents(s){if(!/^\d+(\.\d{1,2})?$/.test(String(s)))throw Error('Expected a nonnegative amount with at most two decimal places');const [a,b='']=String(s).split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>9000000000000)throw Error('Amount too large');return n;}
function currency(s){if(!/^[A-Z]{3}$/.test(s))throw Error('Currency must be three uppercase letters');return s;}
function parse(args){
 const [cmd='help',...rest]=args;if(!(cmd in commands))throw Error('Unknown command: '+cmd);
 const flags={},pos=[];
 for(const arg of rest){if(!arg.startsWith('--')){pos.push(arg);continue;}const [key,...parts]=arg.slice(2).split('=');if(key in flags)throw Error('Duplicate flag: '+key);flags[key]=parts.length?parts.join('='):true;}
 for(const k of Object.keys(flags))if(![...commands[cmd].split(' '),'json',...(writes.has(cmd)?['dry-run']:[])].includes(k))throw Error('Unknown flag: '+k);
 for(const k of ['json','dry-run'])if(k in flags&&flags[k]!==true)throw Error('--'+k+' does not take a value');
 if(cmd==='import'){if(pos.join(' ')!=='salesforce-sales-planning')throw Error('Use import salesforce-sales-planning');}else if(pos.length)throw Error('Unexpected argument: '+pos.join(' '));
 const req=k=>{if(typeof flags[k]!=='string'||!flags[k].trim())throw Error('Required --'+k+'=value');return flags[k].trim();};
 for(const k of commands[cmd].split(' ').filter(Boolean))req(k);
 return {cmd,f:flags,req};
}
async function find(db,t,ref,scope=null){
 const allowed={plans:['name'],reps:['code','name'],accounts:['external_id','name'],territories:['code','name'],followups:['note']};
 const rows=await db.query(`select * from ${t}${scope?' where plan_id=$1':''} order by id`,scope?[scope]:[]);
 const n=ref.toLowerCase(),fields=allowed[t];
 let found=rows.filter(r=>r.id.toLowerCase()===n||fields.some(k=>String(r[k]).toLowerCase()===n));
 if(!found.length)found=rows.filter(r=>r.id.startsWith(n)||fields.some(k=>String(r[k]).toLowerCase().includes(n)));
 if(found.length!==1)throw Error((found.length?'Ambiguous':'No match')+' '+t+': '+ref+'\n'+(found.length?found:rows).map(r=>r.id+' '+fields.map(k=>r[k]).join(' | ')).join('\n'));
 return found[0];
}
async function details(db,p){
 if(p.status==='approved')return p.snapshot;
 const coverage=await db.query('select * from v_coverage where plan_id=$1 order by account',[p.id]);
 const capacity=await db.query('select * from v_capacity where plan_id=$1 order by rep',[p.id]);
 const quotas=await db.query('select * from v_quotas where plan_id=$1',[p.id]);
 const territories=await db.query('select t.*,r.name rep from territories t join reps r on r.id=t.rep_id where t.plan_id=$1 order by t.code',[p.id]);
 return {plan:{id:p.id,name:p.name,starts:p.starts,ends:p.ends,currency:p.currency,target_cents:p.target_cents},coverage,capacity,quotas,territories};
}
async function attention(db,p,d){
 return [
 ...d.coverage.filter(r=>!r.territory).map(r=>({kind:'uncovered',item:r.account,detail:'Assign a territory'})),
 ...d.capacity.filter(r=>Number(r.overload)>0).map(r=>({kind:'capacity',item:r.rep,detail:r.overload+' workload units over capacity'})),
 ...d.quotas.filter(r=>Number(r.gap_cents)!==0).map(r=>({kind:'quota',item:p.name,detail:(Number(r.gap_cents)/100).toFixed(2)+' '+p.currency+' quota unallocated'})),
 ...(await db.query('select id,note,due from followups where plan_id=$1 and resolved_at is null and due<current_date order by due,id',[p.id])).map(r=>({kind:'followup',item:r.note,detail:r.due}))
 ];
}
export async function execute(db,args){
 const {cmd,f,req}=parse(args);const mut=writes.has(cmd);let p,d;
 if(mut){await db.exec('BEGIN');await db.exec("select pg_advisory_xact_lock(729184)");}
 else await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{
 if(f.plan){p=await find(db,'plans',req('plan'));if(mut){p=(await db.query('select * from plans where id=$1 for update',[p.id]))[0];if(p.status==='approved'&&!['clone-plan','log'].includes(cmd))throw Error('Approved plan is immutable; clone it');}d=await details(db,p);}
 let result;
 if(cmd==='help')result=Object.entries(commands).map(([command,flags])=>({command,flags}));
 else if(cmd==='plans')result=await db.query('select id,name,starts,ends,currency,target_cents,status,creator,approved_by from plans order by name');
 else if(cmd==='reps')result=await db.query('select id,code,name,capacity,reviewed_on,review_due,purpose from reps order by name');
 else if(cmd==='accounts')result=await db.query('select id,external_id,name,country,segment,currency,annual_revenue_cents,workload,review_due from accounts order by name');
 else if(['coverage','capacity','quotas','territories'].includes(cmd)){
 const fields={coverage:['external_id','account','territory','rep','workload'],capacity:['code','rep','capacity','accounts','workload','overload'],quotas:['plan','currency','target_cents','allocated_cents','gap_cents'],territories:['code','name','rep','quota_cents']}[cmd];
 result=d[cmd].map(r=>Object.fromEntries(fields.map(k=>[k,r[k]])));
 }
 else if(cmd==='show-plan')result={status:p.status,approved_by:p.approved_by,approved_at:p.approved_at,evidence:p.evidence,...d};
 else if(cmd==='compliance')result=await db.query('select * from v_compliance order by kind,name,issue');
 else if(cmd==='attention')result=await attention(db,p,d);
 else if(cmd==='activity')result=await db.query('select actor,command,detail,created_at from events order by created_at,id');
 else if(cmd==='weekly-review')result={plan:p.name,status:p.status,capacity:d.capacity,quotas:d.quotas,attention:await attention(db,p,d),compliance:await db.query('select * from v_compliance order by kind,name,issue')};
 else if(cmd==='compare'){
 const other=await find(db,'plans',req('other'));if(other.currency!==p.currency)throw Error('Compare plans in the same currency');const b=await details(db,other);
 const ids=new Set([...d.coverage,...b.coverage].map(x=>x.account_id));
 result=[...ids].map(id=>{const a=d.coverage.find(x=>x.account_id===id),z=b.coverage.find(x=>x.account_id===id);return {account:a?.account||z?.account,from_territory:a?.territory??null,to_territory:z?.territory??null,from_rep:a?.rep??null,to_rep:z?.rep??null,from_workload:a?.workload??null,to_workload:z?.workload??null};}).filter(x=>x.from_territory!==x.to_territory||x.from_rep!==x.to_rep||x.from_workload!==x.to_workload);
 }
 else if(cmd==='add-rep')result=await db.query('insert into reps(code,name,capacity) values($1,$2,$3) returning id,code,name',[req('code'),req('name'),integer(req('capacity'))]);
 else if(cmd==='add-account')result=await db.query('insert into accounts(external_id,name,currency,workload) values($1,$2,$3,$4) returning id,external_id,name',[req('external-id'),req('name'),currency(req('currency')),integer(req('workload'))]);
 else if(cmd==='add-plan')result=await db.query('insert into plans(name,starts,ends,currency,target_cents,creator) values($1,$2,$3,$4,$5,$6) returning id,name',[req('name'),date(req('starts')),date(req('ends')),currency(req('currency')),cents(req('target')),req('actor')]);
 else if(cmd==='add-territory'){
 const r=await find(db,'reps',req('rep'));result=await db.query('insert into territories(plan_id,code,name,rep_id,quota_cents) values($1,$2,$3,$4,$5) returning id,code,name',[p.id,req('code'),req('name'),r.id,cents(req('quota'))]);
 }
 else if(cmd==='assign'){
 const a=await find(db,'accounts',req('account')),t=await find(db,'territories',req('territory'),p.id);
 result=await db.query('insert into assignments(plan_id,account_id,territory_id,rationale) values($1,$2,$3,$4) on conflict(plan_id,account_id) do update set territory_id=excluded.territory_id,rationale=excluded.rationale returning id,account_id,territory_id',[p.id,a.id,t.id,req('rationale')]);
 }
 else if(cmd==='quota'){
 const t=await find(db,'territories',req('territory'),p.id);result=await db.query('update territories set quota_cents=$1 where id=$2 returning code,quota_cents',[cents(req('amount')),t.id]);
 }
 else if(cmd==='review-account'||cmd==='review-rep'){
 const t=cmd==='review-account'?'accounts':'reps',r=await find(db,t,req(cmd==='review-account'?'account':'rep')),due=date(req('due'));
 if(due<today())throw Error('Next review date cannot be in the past');
 result=await db.query(`update ${t} set reviewed_on=current_date,review_due=$1,purpose=$2 where id=$3 returning id,name,review_due`,[due,req('purpose'),r.id]);
 }
 else if(cmd==='set-capacity'){const r=await find(db,'reps',req('rep'));result=await db.query('update reps set capacity=$1 where id=$2 returning id,name,capacity',[integer(req('capacity')),r.id]);}
 else if(cmd==='set-workload'){const a=await find(db,'accounts',req('account'));result=await db.query('update accounts set workload=$1 where id=$2 returning id,name,workload',[integer(req('workload')),a.id]);}
 else if(cmd==='set-target')result=await db.query('update plans set target_cents=$1 where id=$2 returning id,name,target_cents',[cents(req('amount')),p.id]);
 else if(cmd==='log')result=await db.query('insert into followups(plan_id,note,due,owner) values($1,$2,$3,$4) returning id,note,due',[p.id,req('note'),date(req('due')),req('owner')]);
 else if(cmd==='resolve'){
 const x=await find(db,'followups',req('followup'));if(x.resolved_at)throw Error('Follow-up already resolved');result=await db.query('update followups set resolved_at=now(),resolution=$1 where id=$2 returning id,resolution',[req('evidence'),x.id]);
 }
 else if(cmd==='clone-plan'){
 const [n]=await db.query('insert into plans(name,starts,ends,currency,target_cents,creator) values($1,$2,$3,$4,$5,$6) returning *',[req('name'),p.starts,p.ends,p.currency,p.target_cents,req('actor')]);
 const mapped=new Map();for(const t of d.territories){const [x]=await db.query('insert into territories(plan_id,code,name,rep_id,quota_cents) values($1,$2,$3,$4,$5) returning id',[n.id,t.code,t.name,t.rep_id,t.quota_cents]);mapped.set(t.code,x.id);}
 for(const a of d.coverage.filter(x=>x.territory))await db.query('insert into assignments(plan_id,account_id,territory_id,rationale) values($1,$2,$3,$4)',[n.id,a.account_id,mapped.get(a.territory),a.rationale||'Cloned assignment']);
 result=[{id:n.id,name:n.name,status:n.status}];
 }
 else if(cmd==='approve-plan'){
 if(req('actor').toLowerCase()===p.creator.toLowerCase())throw Error('A different reviewer must approve the plan');
 const issues=await attention(db,p,d);if(!d.coverage.length||!d.territories.length)throw Error('A plan needs accounts and territories');
 if(issues.length)throw Error('Resolve plan attention before approval: '+JSON.stringify(issues));
 const control=await db.query('select * from v_compliance');
 const used=new Set([...d.coverage.map(x=>x.account_id),...d.capacity.map(x=>x.rep_id)]);
 if(control.some(x=>used.has(x.id)))throw Error('Resolve account and rep compliance reviews before approval');
 result=await db.query("update plans set status='approved',approved_by=$1,approved_at=now(),evidence=$2,snapshot=$3 where id=$4 returning id,name,status",[req('actor'),req('evidence'),JSON.stringify(d),p.id]);
 }
 else if(cmd==='import'){
 const rows=parseCsv(fs.readFileSync(path.resolve(req('file')),'utf8'));if(!rows.length)throw Error('CSV has no records');
 const seen=new Set();let imported=0;
 for(const row of rows){
 const id=pick(row,'Id'),name=pick(row,'Name');if(!id.trim()||!name.trim())throw Error('Account export requires Id and Name on every row');if(seen.has(id))throw Error('Duplicate Id in import: '+id);seen.add(id);
 const cur=currency(pick(row,'CurrencyIsoCode')||req('currency')),rev=pick(row,'AnnualRevenue');
 const existing=(await db.query('select * from accounts where external_id=$1',[id]))[0];
 if(existing&&existing.currency!==cur)throw Error('Currency changed for '+id+'; reconcile existing assignments first');
 const source=JSON.stringify(row);
 await db.query(`insert into accounts(external_id,name,country,segment,currency,annual_revenue_cents,source)
 values($1,$2,$3,$4,$5,$6,$7) on conflict(external_id) do update set name=excluded.name,country=excluded.country,segment=excluded.segment,annual_revenue_cents=excluded.annual_revenue_cents,source=excluded.source,
 reviewed_on=case when accounts.source<>excluded.source then null else accounts.reviewed_on end,
 review_due=case when accounts.source<>excluded.source then null else accounts.review_due end`,[id,name,pick(row,'BillingCountry'),pick(row,'Industry'),cur,rev?cents(rev):null,source]);
 imported++;
 }
 result=[{imported,note:'Accounts only. Source columns retained. Workload defaults to 1 for new accounts; review before planning. No quotas or territory rules inferred.'}];
 }
 else if(cmd==='export'){
 const data={format:'sales-planning/v1',exported_at:new Date().toISOString()};for(const t of tables)data[t]=await db.query(`select * from ${t} order by id`);
 const out=path.resolve(req('out'));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx'});result=[{file:out,...Object.fromEntries(tables.map(t=>[t,data[t].length]))}];
 }
 else if(cmd==='draft-plan'||cmd==='draft-review'){
 const sections=cmd==='draft-plan'?[{title:'Plan',html:htmlTable([d.plan])},{title:'Territory quotas',html:htmlTable(d.territories,['code','name','rep','quota_cents'])},{title:'Account coverage',html:htmlTable(d.coverage,['account','territory','rep','workload'])}]:[{title:'Workload',html:htmlTable(d.capacity,['rep','capacity','workload','overload'])},{title:'Attention',html:htmlTable(await attention(db,p,d))}];
 const file=writeOut('drafts',`${cmd}-${p.id}`,page({title:cmd==='draft-plan'?'Territory and quota plan':'Weekly planning review',subtitle:p.name+' | '+p.status+' | '+p.currency+' | Review before sharing',sections}));result=[{file}];
 }
 if(mut){await db.query('insert into events(actor,command,detail) values($1,$2,$3)',[req('actor'),cmd,JSON.stringify({flags:f,result})]);await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');}
 if(!mut)await db.exec('COMMIT');
 return f['dry-run']?{dry_run:true,result}:result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function format(value){
 if(Array.isArray(value)){if(!value.length)return '  (none)';const keys=Object.keys(value[0]);return table(value,keys.map(key=>({key,label:key,width:48,format:v=>v&&typeof v==='object'?JSON.stringify(v):v})));}
 return Object.entries(value).map(([k,v])=>k+'\n'+(v&&typeof v==='object'?format(v):String(v??''))).join('\n\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
