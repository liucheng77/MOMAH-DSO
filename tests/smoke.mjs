// Mini render smoke test — transpiles src/App.jsx (JSX→createElement) with esbuild,
// then walks each page component with a mocked store/context to catch runtime errors.
// Run:  node tests/smoke.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let src = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
src = src
  .replace('import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";', "")
  .replace('import * as RC from "recharts";', "")
  .replace(/\nexport default App;\s*$/, "\n");
const js = esbuild.transformSync(src, { loader: "jsx", jsx: "transform", jsxFactory: "createElement", jsxFragment: "Fragment" }).code;

/* ---- mini React ---- */
const Fragment = Symbol("Fragment");
function createElement(type, props, ...kids) { return { type, props: { ...(props || {}), children: kids } }; }
const noop = () => {};
function render(el) {
  if (el == null || el === false || typeof el === "string" || typeof el === "number") return;
  if (Array.isArray(el)) { el.forEach(render); return; }
  const { type, props } = el;
  if (type == null) { render(props && props.children); return; }
  if (type._isProvider) { const prev = type._ctx._v; type._ctx._v = props.value; render(props.children); type._ctx._v = prev; return; }
  if (type === Fragment) { render(props.children); return; }
  if (typeof type === "function") { const out = type(props || {}); render(out); return; }
  render(props && props.children);
}
function createContext(def) { const ctx = { _v: def }; ctx.Provider = { _isProvider: true, _ctx: ctx }; return ctx; }
const useState = (i) => [typeof i === "function" ? i() : i, noop];
const useMemo = (fn) => fn();
const useEffect = noop;
const useRef = (i) => ({ current: i ?? null });
const useContext = (ctx) => (ctx && "_v" in ctx ? ctx._v : null);
const React = { createElement, Fragment };
const RC = new Proxy({}, { get: () => (() => null) });
const win = { location: { search: "" }, matchMedia: () => ({ matches: false, addEventListener: noop }), devicePixelRatio: 1, addEventListener: noop, removeEventListener: noop, open: noop, print: noop, innerWidth: 1280 };
const doc = { documentElement: {}, getElementById: () => ({ textContent: "", getContext: () => null, clientWidth: 600 }), addEventListener: noop, createElement: () => ({ getContext: () => null }), body: {} };

const harness = `
  function makeStore(lang, user){
    const t=(k)=>{ const d=I18N[lang]; if(d&&d[k]!==undefined) return d[k]; const e=I18N.en; return (e&&e[k]!==undefined)?e[k]:k; };
    return { t, lang, setLang:()=>{}, cov:"total", setCov:()=>{}, user, setUser:()=>{}, route:"hub", setRoute:()=>{},
      alerts:[{id:"AL-GAP",sev:"red",tk:"al_gap_t",bk:"al_gap_b",ts:"06:00",ack:false,scn:"q_gap"},{id:"AL-1",sev:"amber",tk:"al_moj_t",bk:"al_moj_b",ts:"06:10",ack:false,scn:null}],
      ackAlert:()=>{}, raiseGapAlert:()=>{}, askOrchestrator:()=>{},
      reports:[{ref:"DSO-2026-1234",nameKey:"repName_demand",cov:"total",conf:91,time:"17 Jun 10:00"}], addReport:()=>{},
      log:[{ts:"10:00:00",text:"x"}], pushLog:()=>{}, seed:null, clearSeed:()=>{}, reset:()=>{} };
  }
  const PAGES=[["Login","analyst",Login],["Hub","analyst",Hub],["ChatAnalysis","analyst",ChatAnalysis],
    ["Monitoring","analyst",Monitoring],["MacroImpact","analyst",MacroImpact],["Developers","planner",Developers],
    ["PolicySim","planner",PolicySim],["Reports","analyst",Reports],
    ["Cockpit","leader",Cockpit],["Ecosystem","leader",Ecosystem],["TopBar","analyst",TopBar],
    ["Sidebar","analyst",Sidebar],["Sidebar","planner",Sidebar],["Sidebar","leader",Sidebar],["AgentLog","analyst",AgentLog],["EngineGrid","analyst",EngineGrid]];
  const MSGS=[
    ["Msg.shock",{role:"bot",type:"answer",scn:"q_shock"}],
    ["Msg.demand",{role:"bot",type:"answer",scn:"q_demand"}],
    ["Msg.gap",{role:"bot",type:"answer",scn:"q_gap"}],
    ["Msg.escalate",{role:"bot",type:"escalate",scn:"q_vague"}],
    ["Msg.reportBrief",{role:"bot",type:"report",scn:"q_shock",ref:"DSO-2026-1234"}],
    ["Msg.think",{role:"bot",type:"think",scn:"q_demand",steps:[{eng:"demand",k:"think_run",st:"ok"}]}],
    ["Msg.user",{role:"user",text:"hi"}],
    ["Msg.plan",{role:"bot",type:"plan",states:["idle","run","done","idle","idle","idle"]}],
    ["Msg.hist",{role:"bot",type:"hist"}],
    ["Msg.summary",{role:"bot",type:"summary"}],
    ["Msg.engineLoad",{role:"bot",type:"engine",idx:0,loading:true}],
    ["Msg.engine0",{role:"bot",type:"engine",idx:0,loading:false}],
    ["Msg.engine1",{role:"bot",type:"engine",idx:1,loading:false}],
    ["Msg.engine2",{role:"bot",type:"engine",idx:2,loading:false}],
    ["Msg.engine3",{role:"bot",type:"engine",idx:3,loading:false}],
    ["Msg.engine4",{role:"bot",type:"engine",idx:4,loading:false}],
    ["Msg.engine5",{role:"bot",type:"engine",idx:5,loading:false}],
  ];
  let ok=0, fail=0;
  for(const lang of ["en","ar","zh"]){
    for(const [name,user,Comp] of PAGES){
      try{ render(createElement(Ctx.Provider,{value:makeStore(lang,user)}, createElement(Comp,null))); ok++; }
      catch(e){ fail++; console.log("FAIL "+name+" ["+lang+"]: "+(e&&e.message||e)); }
    }
    for(const [name,m] of MSGS){
      try{ render(createElement(Ctx.Provider,{value:makeStore(lang,"analyst")}, createElement(Msg,{m,onGenReport:()=>{},onRoute:()=>{},onRun:()=>{}}))); ok++; }
      catch(e){ fail++; console.log("FAIL "+name+" ["+lang+"]: "+(e&&e.message||e)); }
    }
    for(const w of ["A","B"]){
      try{ render(createElement(Ctx.Provider,{value:makeStore(lang,"planner")}, createElement(ABCard,{which:w}))); ok++; }
      catch(e){ fail++; console.log("FAIL ABCard."+w+" ["+lang+"]: "+(e&&e.message||e)); }
    }
  }
  REPORT(ok, fail);
`;

const fn = new Function("React", "useState", "useMemo", "useEffect", "useRef", "createContext", "useContext", "RC", "window", "document", "render", "createElement", "Fragment", "REPORT",
  js + "\n" + harness);
fn(React, useState, useMemo, useEffect, useRef, createContext, useContext, RC, win, doc, render, createElement, Fragment,
  (ok, fail) => { console.log("rendered OK: " + ok + " / " + (ok + fail)); process.exit(fail ? 1 : 0); });
