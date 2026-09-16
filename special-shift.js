export const SPECIAL_SECONDS=240, TICKET_CAP=3, REFILL_MS=2*60*60*1000;
export function specialState(raw,now=Date.now()){
 const n=(v,d=0)=>Number.isFinite(v)?Math.max(0,Math.floor(v)):d;
 const s={tickets:Math.min(TICKET_CAP,n(raw?.tickets,TICKET_CAP)),clock:n(raw?.clock,now),shards:n(raw?.shards),completed:n(raw?.completed),wins:n(raw?.wins),retryUsed:!!raw?.retryUsed,pending:typeof raw?.pending==='string'?raw.pending:null,run:raw?.run&&typeof raw.run==='object'?raw.run:null};
 return refill(s,now);
}
export function refill(s,now=Date.now()){
 // Do not award time twice after clock rollback; this local prototype is not a purchase wallet.
 const t=Math.max(s.clock,now);
 if(s.tickets>=TICKET_CAP){s.clock=t;return s;}
 const count=Math.floor((t-s.clock)/REFILL_MS);
 if(count>0){s.tickets=Math.min(TICKET_CAP,s.tickets+count);s.clock=s.tickets===TICKET_CAP?t:s.clock+count*REFILL_MS;}
 return s;
}
export function reserve(s,id,now=Date.now()) {refill(s,now);if(s.pending||s.tickets<1)return false;if(s.tickets===TICKET_CAP)s.clock=Math.max(now,s.clock);s.tickets--;s.pending=id;s.run=null;return true;}
export function refund(s){if(!s.pending)return false;s.tickets=Math.min(TICKET_CAP,s.tickets+1);s.pending=null;s.run=null;return true;}
export function settle(s,id,{won=false,time=0,abandoned=false}={}){
 if(!id||s.pending!==id)return null;
 const shards=abandoned?0:Math.min(4,Math.floor(Math.max(0,Number.isFinite(time)?time:0)/60));
 const retry=!abandoned&&!won&&s.completed===0&&!s.retryUsed;
 s.shards+=shards;s.completed++;if(won)s.wins++;if(retry){s.retryUsed=true;s.tickets=Math.min(TICKET_CAP,s.tickets+1);}
 s.pending=null;s.run=null;return {shards,retry};
}
export function configureSpecial(g){g.mode='special';g.events=[{t:60,type:'swarm'},{t:120,type:'elite'},{t:180,type:'boss',tier:1}];g.eventIndex=0;g.relays.forEach(r=>{r.unlock=1e9;r.active=false;r.charge=0;});g.u.orbit=Math.max(1,g.u.orbit||0);g.recalculate();g.toast('특별 근무 · 4분 생존! 1분마다 꾸미기 도장 1개',false,5);}
