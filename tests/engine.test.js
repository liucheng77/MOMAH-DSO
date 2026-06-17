// Logic tests — no DOM. Run: node tests/engine.test.js
let fail = 0;
function ok(cond, msg){ if(!cond){ fail++; console.log("FAIL: "+msg); } }

/* ---- 1. push() id uniqueness under React's deferred functional-updater semantics ----
   React runs setState(updater) closures at flush time, not call time. The buggy version
   read a mutable ref inside the closure, so two pushes in one handler collided on id.
   This replicates the deferred behaviour and asserts ids stay unique. ---- */
function simulatePush(buggy){
  let arr = [];
  const idRef = { current: 0 };
  const queue = [];
  const setMsgs = (fn)=> queue.push(fn);          // defer, like React batching
  function push(m){
    idRef.current += 1;
    if(buggy){ setMsgs(prev=>[...prev,{id:idRef.current,...m}]); return idRef.current; }
    const id = idRef.current; setMsgs(prev=>[...prev,{id,...m}]); return id;
  }
  const uid = push({role:"user",text:"q"});
  const tid = push({role:"bot",type:"think",steps:[{st:"idle"}]});
  queue.forEach(fn=>{ arr = fn(arr); });           // flush after handler
  return { arr, uid, tid };
}
{
  const good = simulatePush(false);
  const ids = good.arr.map(m=>m.id);
  ok(new Set(ids).size === ids.length, "push ids must be unique (got "+ids.join(",")+")");
  ok(good.uid !== good.tid, "user id and think id must differ");
  // the think message (id===tid) is the only one with steps → guard is safe
  const matched = good.arr.filter(m=>m.id===good.tid);
  ok(matched.length === 1 && Array.isArray(matched[0].steps), "exactly one message with steps matches thinkId");
  const buggy = simulatePush(true);
  const bids = buggy.arr.map(m=>m.id);
  ok(new Set(bids).size !== bids.length, "buggy variant should collide (regression guard)");
}

/* ---- 2. computePolicy returns 3 numeric scenarios ---- */
function computePolicy(lv){
  const f=lv.financing/100,w=lv.whiteland/100,s=lv.subsidy/100;
  const base={demand:+(f*42+s*30-w*4).toFixed(1),supply:+(w*26+f*6).toFixed(1),price:+(f*9+s*5-w*7).toFixed(1)};
  base.gap=+(base.demand-base.supply).toFixed(1);
  const span=(k,d)=>({demand:+(k.demand*d).toFixed(1),supply:+(k.supply*d).toFixed(1),price:+(k.price*d).toFixed(1),gap:+((k.demand*d)-(k.supply*d)).toFixed(1)});
  return {opt:span(base,1.28),base,pess:span(base,0.72)};
}
{
  const r = computePolicy({financing:10,whiteland:0,subsidy:0});
  ["opt","base","pess"].forEach(k=> ["demand","supply","price","gap"].forEach(m=>
    ok(typeof r[k][m]==="number" && !isNaN(r[k][m]), "computePolicy."+k+"."+m+" numeric")));
  ok(r.opt.demand > r.base.demand && r.base.demand > r.pess.demand, "optimistic > base > pessimistic demand");
}

console.log(fail ? ("\n"+fail+" test(s) FAILED") : "all logic tests passed");
process.exit(fail ? 1 : 0);
