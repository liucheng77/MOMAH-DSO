import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import * as RC from "recharts";
import { REPORTS_B64 } from "./reports-data.js";

/* =========================================================================
   Demand & Supply Optimizer (DSO · AI_H_01) — interactive demo.
   Three connected agentic journeys, all driven by the Orchestrator Agent:
     J1  Conversational analysis  (UC-01 → UC-02/03/04)
     J2  Monitoring & early warning (UC-05 / UC-07)
     J3  Policy & scenario simulation (UC-06) → feeds CoPilot / AI H-03
   All figures are synthetic, internally consistent demo data anchored to BRD V0.3.
   ========================================================================= */

/* Build stamp — replaced by Vite (define BUILD_STAMP) or by build-standalone.mjs (@@BUILD@@). */
const BUILD_TIME = (typeof BUILD_STAMP!=="undefined" && BUILD_STAMP) ? BUILD_STAMP : "@@BUILD@@";

/* ---- Engines & data sources ---- */
const ENGINES = [
  { key:"orch",   icon:"✦", lvl:"L1" },
  { key:"demand", icon:"📈", lvl:"L2" },
  { key:"balance",icon:"⚖", lvl:"L2" },
  { key:"plan",   icon:"🏗", lvl:"L3" },
  { key:"conv",   icon:"🔁", lvl:"L2" },
  { key:"macro",  icon:"🌐", lvl:"L3" },
];
const SOURCES11 = [
  { key:"sakani", status:"ok",    sla:"daily",     fresh:98 },
  { key:"wafi",   status:"ok",    sla:"daily",     fresh:96 },
  { key:"uc1",    status:"ok",    sla:"daily",     fresh:99 },
  { key:"uc2",    status:"ok",    sla:"daily",     fresh:97 },
  { key:"uc3",    status:"ok",    sla:"daily",     fresh:95 },
  { key:"uc4",    status:"ok",    sla:"weekly",    fresh:92 },
  { key:"moj",    status:"amber", sla:"weekly",    fresh:78 },
  { key:"gastat", status:"ok",    sla:"quarterly", fresh:90 },
  { key:"sec",    status:"ok",    sla:"daily",     fresh:94 },
  { key:"private",status:"amber", sla:"weekly",    fresh:72 },
  { key:"geo",    status:"ok",    sla:"monthly",   fresh:88 },
];
const COV_ACC = { ministry:"95%", private:"80%", total:"95% / 80%" };

/* ---- J1 demand trend & gap charts (synthetic) ---- */
const DEMAND_TREND = [
  { m:"M1", v:100 }, { m:"M2", v:106 }, { m:"M3", v:111 },
  { m:"M4", v:119 }, { m:"M5", v:124 }, { m:"M6", v:131 },
];
const GAP_REGIONS = [
  { key:"riyadh", gap:34 }, { key:"makkah", gap:21 }, { key:"eastern", gap:12 },
  { key:"madinah", gap:9 }, { key:"asir", gap:6 },
];

/* ---- J3 policy simulation engine ---- */
// levers: financing (Δ financing ratio %), whiteland (Δ white-land fee %), subsidy (Δ subsidy %)
function computePolicy(lv){
  const f = lv.financing/100, w = lv.whiteland/100, s = lv.subsidy/100;
  // base sensitivities (demo): demand up with financing & subsidy; supply up with white-land fee; gap = demand-supply pressure
  const base = {
    demand: +(f*42 + s*30 - w*4).toFixed(1),
    supply: +(w*26 + f*6).toFixed(1),
    price:  +(f*9 + s*5 - w*7).toFixed(1),
  };
  base.gap = +(base.demand - base.supply).toFixed(1);
  const span = (k,d)=>({ demand:+(k.demand*d).toFixed(1), supply:+(k.supply*d).toFixed(1), price:+(k.price*d).toFixed(1), gap:+((k.demand*d)-(k.supply*d)).toFixed(1) });
  return { opt: span(base,1.28), base, pess: span(base,0.72) };
}

/* =========================================================================
   i18n  (English + Arabic, AR flips to RTL).  Chinese reachable via ?ln=zh.
   ========================================================================= */
const I18N = {
  en:{
    appName:"Demand & Supply Optimizer",
    sso_title:"MoMAH Single Sign-On", sso_sub:"Unified national access to the Ministry of Municipalities & Housing digital services.",
    brandLine:"Demand & Supply Optimizer", signInTitle:"Sign In", identity:"Identity", password:"Password",
    securityCode:"Security code", or_:"or", login_btn:"Login", forgotPwd:"Forgot password?",
    nic1:"NIC", nic2:"National Identity Card", noAccount:"Don't have an account?", createAccount:"Create New Account",
    loginHint:"Password is pre-filled for the demo (no real authentication).",
    copyright:"© 2026 — Ministry of Municipalities & Housing · Housing Support Agency", syntheticData:"Synthetic demo data — not real beneficiaries",
    logout:"Sign out", resetDemo:"Reset demo",
    // coverage
    coverage:"Coverage", cov_ministry:"Ministry", cov_private:"Private", cov_total:"Total Market", cov_acc:"target accuracy",
    // roles
    analyst:"Housing Data Analyst", planner:"Strategic Planning Manager", leader:"Senior Leadership",
    analyst_full:"Housing Data Analyst", planner_full:"Strategic Planning Manager", leader_full:"Senior Leadership",
    analyst_desc:"Asks the Orchestrator, runs analyses, handles monitoring alerts, generates reports.",
    planner_desc:"Builds supply plans, runs policy simulations, reviews recommendations.",
    leader_desc:"Reads executive dashboards; receives strategic briefs across Ministry / Private / Total.",
    // nav
    nav_hub:"Hub", nav_chat:"Conversational Analysis", nav_monitor:"Monitoring & Alerts",
    nav_policy:"Policy Simulation", nav_reports:"Reports", nav_cockpit:"Strategic Cockpit", nav_eco:"Ecosystem",
    // engines
    eng_orch:"Orchestrator Agent", eng_demand:"Demand Intelligence", eng_balance:"Supply-Demand Balancing",
    eng_plan:"Strategic Supply Planning", eng_conv:"Conversion & Absorption",
    engd_orch:"Routes inquiries, composes outputs, generates reports.",
    engd_demand:"Segment migration & demand forecasting.",
    engd_balance:"Gap computation & price-scenario simulation.",
    engd_plan:"Demand-driven supply plans & location ranking.",
    engd_conv:"Conversion forecasting & absorption monitoring.",
    online:"Online", autonomous:"autonomous",
    // sources
    src_sakani:"Sakani", src_wafi:"Wafi", src_uc1:"Segments", src_uc2:"Preferences", src_uc3:"Signing", src_uc4:"Reco",
    src_moj:"MOJ Price", src_gastat:"GASTAT", src_sec:"SEC Elec.", src_private:"Private Mkt", src_geo:"Geo/GIS",
    // hub
    hub_hello:"Welcome", hub_sub:"One agentic platform · three connected journeys",
    k_resp:"Report response time", k_resp_v:"< 2 min", k_resp_s:"was: days (manual)",
    k_alerts:"Open gap alerts", k_cov:"Regions covered", k_ready:"Data readiness",
    engines_title:"Engines & Orchestrator", sources_title:"11 data sources · live health",
    journeys_title:"Three connected journeys", open:"Open",
    j1_name:"Conversational Analysis", j1_body:"Ask in natural language → Orchestrator interprets intent, routes across engines, returns a share-ready report.",
    j2_name:"Monitoring & Early Warning", j2_body:"Agents scan 11 sources on schedule, detect deviations and raise alerts with root-cause.",
    j3_name:"Policy Simulation", j3_body:"Define a policy scenario → simulate 3 scenarios → rank recommendations → feed the assistant & support-enhancement systems.",
    latest_alerts:"Latest alerts",
    // J1 chat
    chat_sub:"Orchestrator Agent · bilingual natural-language interface",
    chat_ph:"Ask an analytical question…", send:"Send", presets:"Try:", memory:"session memory",
    intent:"Intent", routing:"Routing", confidence:"Confidence", sources:"Sources", coverageMode:"Coverage mode",
    think_intent:"Interpreting intent", think_route:"Selecting engine(s) from model registry",
    think_perm:"Checking permission scope", think_run:"Running analysis", think_compose:"Composing output",
    genReport:"Generate report", report:"Report", reportReady:"Ministry-branded PDF ready",
    refNo:"Reference", generated:"Generated", download:"Download", askPolicy:"Simulate a policy on this →",
    q_demand:"Demand trend for the Aspirers segment (Al-Mutatallibeen) in Riyadh over the next 6 months?",
    q_gap:"And how large is the matching supply-demand gap? How much supply is needed to close it?",
    q_policy:"If we raise the financing ratio by 10%, would it ease this gap?",
    q_vague:"Show me all beneficiaries' sensitive personal records.",
    a_demand:"Riyadh · Aspirers (Al-Mutatallibeen) demand is forecast to rise ~31% over 6 months (MAPE ≤ 20%), driven by income-band migration and product-preference shifts toward ready-built units.",
    a_gap:"Carrying over Riyadh · Aspirers from the previous turn: the supply-demand gap is 34% (RED). Closing it needs ≈ 18,400 units over 12 months — the Strategic Planning engine proposes a 3-scenario supply plan ranked by absorption.",
    a_vague:"I can't answer that. The request falls outside your permission scope and the platform is read-only for personal data. I can instead provide aggregated, anonymised segment analytics.",
    escalated:"Escalation", esc_perm:"Permission / data-scope guard triggered",
    cross_note:"Cross-engine orchestration: two engines were chained automatically.",
    gapRed:"Gap > 30% → strategic escalation recommended",
    chart_demandT:"Demand index (Riyadh · Aspirers)", chart_gapT:"Supply-demand gap by region (%)",
    // J2 monitoring
    mon_sub:"Data Quality Monitor & Periodic Reports agents — automatic",
    runScan:"Run scan now", scanning:"Scanning 11 sources…", lastScan:"Last scheduled scan",
    freshness:"Freshness", within:"within SLA", delayed:"delayed", srcHealth:"Source health (11)",
    kpiThresh:"KPI thresholds", alerts:"Alerts", noAlerts:"No open alerts — all KPIs within thresholds.",
    sev_red:"Critical", sev_amber:"Warning", sev_info:"Info",
    al_gap_t:"Riyadh · Aspirers supply-demand gap 34% (RED)", al_gap_b:"Gap breached the 30% red threshold. Root cause: demand up 31% vs supply pipeline flat.",
    al_moj_t:"MOJ price feed delayed", al_moj_b:"Source delayed > 50% of SLA. Using last valid data with a coverage caveat.",
    al_conv_t:"Conversion rate dip · Makkah", al_conv_b:"Qualification→signing conversion fell to 52% (< 60% intervention threshold).",
    rootCause:"Root cause", askOrch:"Ask Orchestrator to analyze", action:"Action", ack:"Acknowledge", acked:"Acknowledged",
    scanDone:"Scan complete — 11/11 sources checked", newAlert:"New alert raised by monitor agent",
    // J3 policy
    pol_sub:"Policy Simulation Agent — 3 scenarios with sensitivity, then feed the ecosystem",
    policyType:"Policy type", pt_financing:"Housing financing", pt_whiteland:"White-land fee", pt_subsidy:"Subsidy conditions",
    lever_financing:"Δ Financing ratio", lever_whiteland:"Δ White-land fee", lever_subsidy:"Δ Subsidy",
    runSim:"Run simulation", simulating:"Simulating 3 scenarios…",
    sc_opt:"Optimistic", sc_base:"Base", sc_pess:"Pessimistic",
    m_demand:"Demand", m_supply:"Supply", m_gap:"Gap", m_price:"Price",
    recos:"Ranked recommendations", feedEco:"Feed results to the assistant & support systems", feeding:"Feeding ecosystem…", fed:"Delivered to the assistant & support systems",
    reco1:"Phase the financing change over 2 quarters to avoid a price shock.",
    reco2:"Pair with white-land fee easing in Riyadh to lift supply ~8%.",
    reco3:"Monitor Aspirers conversion weekly; intervene if < 60%.",
    impactNote:"Impact vs current baseline (%). Confidence reflects data quality & prior accuracy.",
    // reports
    rep_sub:"Generated reports & agent action log — traceable, Coverage-Mode labelled",
    rep_title:"Title", rep_cov:"Coverage", rep_conf:"Confidence", rep_time:"Generated", rep_ref:"Ref",
    repName_demand:"Riyadh · Aspirers demand outlook", repName_gap:"Riyadh supply-demand gap & supply plan",
    repName_policy:"Financing policy impact — 3 scenarios", repName_weekly:"Weekly KPI performance report",
    agentLog:"Agent action log", noReports:"No reports yet — generate one from Conversational Analysis.",
    // cockpit / eco
    cockpit_sub:"Executive view across Ministry · Private · Total — read-only",
    k_market:"Total-market gap", k_supply:"Planned supply (12m)", k_conv:"Avg conversion", k_savings:"Time saved / report",
    eco_sub:"DSO is the single source of truth; outputs flow to the higher-tier assistant & support system",
    eco_dso:"DSO", eco_copilot:"Housing Assistant (CoPilot)", eco_h03:"Support Enhancement",
    eco_consumes:"consumes demand · gap · scenario analytics", manualPush:"API contract",
    redline:"The platform only recommends and is read-only — it never edits source data, executes policy, or auto-approves.",
    // generic
    running:"Running…", done:"Done", view:"View", live:"live", autoBadge:"auto",
    agentlog_h:"Agent activity", noItems:"Nothing here yet.",
    log_scan:"Data Quality Monitor scanned 11 sources — 9 green, 2 amber",
    log_route:"Orchestrator routed inquiry → Demand Intelligence",
    log_cross:"Orchestrator chained Balancing + Planning engines",
    log_alert:"Monitor raised RED gap alert · Riyadh",
    log_report:"Report generated · ref",
    log_policy:"Policy Simulation ran 3 scenarios",
    log_feed:"Results delivered to the assistant & support systems",
    log_idle:"Knowledge agent indexed inquiry into knowledge base",
  },
};

/* Arabic */
I18N.ar = {
  appName:"محسّن العرض والطلب",
  sso_title:"النفاذ الموحد", sso_sub:"النفاذ الوطني الموحد إلى الخدمات الرقمية لوزارة البلديات والإسكان.",
  brandLine:"محسّن العرض والطلب", signInTitle:"تسجيل الدخول", identity:"الهوية", password:"كلمة المرور",
  securityCode:"الرمز المرئي", or_:"أو", login_btn:"دخول", forgotPwd:"نسيت كلمة المرور؟",
  nic1:"الهوية", nic2:"بطاقة الهوية الوطنية", noAccount:"ليس لديك حساب؟", createAccount:"إنشاء حساب جديد",
  loginHint:"كلمة المرور مُعبّأة للعرض (بدون مصادقة فعلية).",
  copyright:"© ٢٠٢٦ — وزارة البلديات والإسكان · هيئة الدعم السكني", syntheticData:"بيانات تجريبية اصطناعية — ليست مستفيدين حقيقيين",
  logout:"تسجيل الخروج", resetDemo:"إعادة ضبط العرض",
  coverage:"التغطية", cov_ministry:"الوزارة", cov_private:"السوق الخاص", cov_total:"السوق الكلي", cov_acc:"الدقة المستهدفة",
  analyst:"محلل بيانات الإسكان", planner:"مدير التخطيط الاستراتيجي", leader:"القيادة العليا",
  analyst_full:"محلل بيانات الإسكان", planner_full:"مدير التخطيط الاستراتيجي", leader_full:"القيادة العليا",
  analyst_desc:"يسأل المنسّق، يشغّل التحليلات، يعالج تنبيهات المراقبة، ويولّد التقارير.",
  planner_desc:"يبني خطط العرض، ويشغّل محاكاة السياسات، ويراجع التوصيات.",
  leader_desc:"يطّلع على لوحات تنفيذية؛ يستقبل موجزات استراتيجية (وزارة / خاص / كلي).",
  nav_hub:"الرئيسية", nav_chat:"التحليل الحواري", nav_monitor:"المراقبة والتنبيهات",
  nav_policy:"محاكاة السياسات", nav_reports:"التقارير", nav_cockpit:"لوحة القيادة", nav_eco:"المنظومة",
  eng_orch:"الوكيل المنسّق", eng_demand:"ذكاء الطلب", eng_balance:"موازنة العرض والطلب",
  eng_plan:"التخطيط الاستراتيجي للعرض", eng_conv:"التحويل والاستيعاب",
  engd_orch:"يوجّه الاستفسارات ويؤلّف المخرجات ويولّد التقارير.",
  engd_demand:"هجرة الشرائح والتنبؤ بالطلب.",
  engd_balance:"حساب الفجوة ومحاكاة سيناريوهات السعر.",
  engd_plan:"خطط عرض مدفوعة بالطلب وترتيب المواقع.",
  engd_conv:"التنبؤ بالتحويل ومراقبة الاستيعاب.",
  online:"متصل", autonomous:"ذاتي",
  src_sakani:"سكني", src_wafi:"وافي", src_uc1:"الشرائح", src_uc2:"التفضيل", src_uc3:"التوقيع", src_uc4:"التوصية",
  src_moj:"أسعار العدل", src_gastat:"الإحصاء", src_sec:"كهرباء", src_private:"السوق الخاص", src_geo:"جغرافي",
  hub_hello:"مرحباً", hub_sub:"منصّة وكيلية واحدة · ثلاث رحلات مترابطة",
  k_resp:"زمن استجابة التقرير", k_resp_v:"< دقيقتين", k_resp_s:"سابقاً: أيام (يدوي)",
  k_alerts:"تنبيهات فجوة مفتوحة", k_cov:"المناطق المغطاة", k_ready:"جاهزية البيانات",
  engines_title:"المحركات والمنسّق", sources_title:"١١ مصدر بيانات · الحالة الحية",
  journeys_title:"ثلاث رحلات مترابطة", open:"فتح",
  j1_name:"التحليل الحواري", j1_body:"اسأل بلغة طبيعية → يفسّر المنسّق النية، يوجّه عبر المحركات، ويعيد تقريراً جاهزاً للمشاركة.",
  j2_name:"المراقبة والإنذار المبكر", j2_body:"تفحص الوكلاء ١١ مصدراً حسب جدول، وتكشف الانحرافات وترفع تنبيهات بالسبب الجذري.",
  j3_name:"محاكاة السياسات", j3_body:"عرّف سيناريو سياسة → حاكِ ٣ سيناريوهات → رتّب التوصيات → غذِّ مساعد الإسكان ونظام تعزيز الدعم.",
  latest_alerts:"أحدث التنبيهات",
  chat_sub:"الوكيل المنسّق · واجهة لغة طبيعية ثنائية اللغة",
  chat_ph:"اطرح سؤالاً تحليلياً…", send:"إرسال", presets:"جرّب:", memory:"ذاكرة الجلسة",
  intent:"النية", routing:"التوجيه", confidence:"الثقة", sources:"المصادر", coverageMode:"وضع التغطية",
  think_intent:"تفسير النية", think_route:"اختيار المحرك من سجل النماذج",
  think_perm:"التحقق من نطاق الصلاحية", think_run:"تشغيل التحليل", think_compose:"تأليف المخرجات",
  genReport:"توليد تقرير", report:"تقرير", reportReady:"تقرير PDF بهوية الوزارة جاهز",
  refNo:"المرجع", generated:"تاريخ التوليد", download:"تنزيل", askPolicy:"حاكِ سياسة على ذلك ←",
  q_demand:"اتجاه الطلب لشريحة المتطلّبين في الرياض خلال ٦ أشهر القادمة؟",
  q_gap:"وكم حجم فجوة العرض والطلب المقابلة؟ وكم عرضاً يلزم لسدّها؟",
  q_policy:"إذا رفعنا نسبة التمويل ١٠٪، هل تخفّف هذه الفجوة؟",
  q_vague:"أظهر لي كل السجلات الشخصية الحساسة للمستفيدين.",
  a_demand:"الرياض · المتطلّبون: يُتوقع ارتفاع الطلب ~٣١٪ خلال ٦ أشهر (MAPE ≤ ٢٠٪)، مدفوعاً بهجرة شرائح الدخل وتحوّل التفضيل نحو الوحدات الجاهزة.",
  a_gap:"بترحيل الرياض · المتطلّبون من الدور السابق: فجوة العرض والطلب ٣٤٪ (أحمر). سدّها يتطلب ≈ ١٨٬٤٠٠ وحدة خلال ١٢ شهراً — يقترح محرك التخطيط خطة عرض من ٣ سيناريوهات مرتّبة بالاستيعاب.",
  a_vague:"لا أستطيع تنفيذ ذلك. الطلب خارج نطاق صلاحيتك والمنصّة للقراءة فقط للبيانات الشخصية. يمكنني تقديم تحليلات شرائح مجمّعة ومجهّلة بدلاً من ذلك.",
  escalated:"تصعيد", esc_perm:"تفعيل حارس الصلاحية / نطاق البيانات",
  cross_note:"تنسيق متعدد المحركات: تم تسلسل محركين تلقائياً.",
  gapRed:"فجوة > ٣٠٪ ← يُوصى بتصعيد استراتيجي",
  chart_demandT:"مؤشر الطلب (الرياض · المتطلّبون)", chart_gapT:"فجوة العرض والطلب حسب المنطقة (٪)",
  mon_sub:"وكيلا مراقبة جودة البيانات والتقارير الدورية — آلي",
  runScan:"تشغيل فحص الآن", scanning:"جارٍ فحص ١١ مصدراً…", lastScan:"آخر فحص مجدول",
  freshness:"الحداثة", within:"ضمن SLA", delayed:"متأخر", srcHealth:"حالة المصادر (١١)",
  kpiThresh:"عتبات المؤشرات", alerts:"التنبيهات", noAlerts:"لا تنبيهات مفتوحة — كل المؤشرات ضمن الحدود.",
  sev_red:"حرج", sev_amber:"تحذير", sev_info:"معلومة",
  al_gap_t:"الرياض · المتطلّبون: فجوة عرض/طلب ٣٤٪ (أحمر)", al_gap_b:"تجاوزت الفجوة عتبة ٣٠٪ الحمراء. السبب: الطلب +٣١٪ مقابل خط عرض ثابت.",
  al_moj_t:"تأخّر تغذية أسعار العدل", al_moj_b:"تأخّر المصدر > ٥٠٪ من SLA. يُستخدم آخر بيانات صالحة مع تنويه تغطية.",
  al_conv_t:"انخفاض معدّل التحويل · مكة", al_conv_b:"انخفض التحويل من التأهيل إلى التوقيع إلى ٥٢٪ (< عتبة التدخل ٦٠٪).",
  rootCause:"السبب الجذري", askOrch:"اطلب من المنسّق التحليل", action:"إجراء", ack:"إقرار", acked:"تم الإقرار",
  scanDone:"اكتمل الفحص — ١١/١١ مصدراً", newAlert:"تنبيه جديد من وكيل المراقبة",
  pol_sub:"وكيل محاكاة السياسات — ٣ سيناريوهات بالحساسية، ثم تغذية المنظومة",
  policyType:"نوع السياسة", pt_financing:"التمويل السكني", pt_whiteland:"رسوم الأراضي البيضاء", pt_subsidy:"شروط الدعم",
  lever_financing:"Δ نسبة التمويل", lever_whiteland:"Δ رسوم الأراضي البيضاء", lever_subsidy:"Δ الدعم",
  runSim:"تشغيل المحاكاة", simulating:"محاكاة ٣ سيناريوهات…",
  sc_opt:"متفائل", sc_base:"أساسي", sc_pess:"متشائم",
  m_demand:"الطلب", m_supply:"العرض", m_gap:"الفجوة", m_price:"السعر",
  recos:"توصيات مرتّبة", feedEco:"تغذية مساعد الإسكان ونظام تعزيز الدعم", feeding:"جارٍ تغذية المنظومة…", fed:"سُلّم إلى مساعد الإسكان ونظام تعزيز الدعم",
  reco1:"وزّع تغيير التمويل على ربعين لتفادي صدمة سعرية.",
  reco2:"اقرنه بتخفيف رسوم الأراضي البيضاء في الرياض لرفع العرض ~٨٪.",
  reco3:"راقب تحويل المتطلّبين أسبوعياً؛ تدخّل إذا < ٦٠٪.",
  impactNote:"الأثر مقابل الأساس الحالي (٪). الثقة تعكس جودة البيانات والدقة السابقة.",
  rep_sub:"التقارير المولّدة وسجل إجراءات الوكلاء — قابلة للتتبّع وموسومة بوضع التغطية",
  rep_title:"العنوان", rep_cov:"التغطية", rep_conf:"الثقة", rep_time:"التوليد", rep_ref:"المرجع",
  repName_demand:"آفاق الطلب · الرياض · المتطلّبون", repName_gap:"فجوة العرض والطلب وخطة العرض · الرياض",
  repName_policy:"أثر سياسة التمويل — ٣ سيناريوهات", repName_weekly:"تقرير أداء المؤشرات الأسبوعي",
  agentLog:"سجل إجراءات الوكلاء", noReports:"لا تقارير بعد — ولّد واحداً من التحليل الحواري.",
  cockpit_sub:"عرض تنفيذي عبر الوزارة · الخاص · الكلي — للقراءة فقط",
  k_market:"فجوة السوق الكلي", k_supply:"العرض المخطط (١٢ش)", k_conv:"متوسط التحويل", k_savings:"الزمن الموفّر / تقرير",
  eco_sub:"DSO هو مصدر الحقيقة الموحّد؛ تتدفّق المخرجات إلى المساعد الأعلى ونظام الدعم",
  eco_dso:"DSO", eco_copilot:"مساعد الإسكان", eco_h03:"تعزيز الدعم",
  eco_consumes:"يستهلك تحليلات الطلب · الفجوة · السيناريوهات", manualPush:"عقد API",
  redline:"المنصّة توصي فقط وللقراءة فقط — لا تعدّل بيانات المصدر ولا تنفّذ سياسة ولا تعتمد آلياً.",
  running:"جارٍ…", done:"تم", view:"عرض", live:"مباشر", autoBadge:"آلي",
  agentlog_h:"نشاط الوكلاء", noItems:"لا يوجد بعد.",
  log_scan:"فحص وكيل الجودة ١١ مصدراً — ٩ أخضر، ٢ كهرماني",
  log_route:"وجّه المنسّق الاستفسار ← ذكاء الطلب",
  log_cross:"سلسل المنسّق محرّكي الموازنة والتخطيط",
  log_alert:"رفع المراقب تنبيه فجوة أحمر · الرياض",
  log_report:"تم توليد تقرير · مرجع",
  log_policy:"شغّلت محاكاة السياسات ٣ سيناريوهات",
  log_feed:"سُلّمت النتائج إلى مساعد الإسكان ونظام تعزيز الدعم",
  log_idle:"فهرس وكيل المعرفة الاستفسار في قاعدة المعرفة",
};

/* Chinese — reachable only via ?ln=zh (for the team's own reading) */
I18N.zh = {
  appName:"供需优化器",
  sso_title:"统一身份登录", sso_sub:"统一访问市政与住房部数字服务。",
  brandLine:"供需优化器", signInTitle:"登录", identity:"身份", password:"密码",
  securityCode:"验证码", or_:"或", login_btn:"登录", forgotPwd:"忘记密码？",
  nic1:"NIC", nic2:"国民身份证", noAccount:"还没有账号？", createAccount:"创建新账号",
  loginHint:"演示已预填密码（无真实认证）。",
  copyright:"© 2026 — 市政与住房部 · 住房支援署", syntheticData:"合成演示数据 — 非真实受益人",
  logout:"退出登录", resetDemo:"重置演示",
  coverage:"覆盖", cov_ministry:"部委", cov_private:"私有市场", cov_total:"全市场", cov_acc:"目标精度",
  analyst:"住房数据分析师", planner:"战略规划经理", leader:"高层领导",
  analyst_full:"住房数据分析师", planner_full:"战略规划经理", leader_full:"高层领导",
  analyst_desc:"向编排 Agent 提问、运行分析、处理监控预警、生成报告。",
  planner_desc:"制定供给计划、运行政策模拟、审阅推荐。",
  leader_desc:"查看高管看板；接收部委 / 私有 / 全市场战略简报。",
  nav_hub:"仪表盘", nav_chat:"对话分析", nav_monitor:"监控预警",
  nav_policy:"政策模拟", nav_reports:"报告中心", nav_cockpit:"战略驾驶舱", nav_eco:"生态集成",
  eng_orch:"编排 Agent", eng_demand:"需求智能引擎", eng_balance:"供需平衡引擎",
  eng_plan:"战略供给规划引擎", eng_conv:"转化与吸纳引擎",
  engd_orch:"路由问询、组合输出、生成报告。",
  engd_demand:"客群迁移与需求预测。",
  engd_balance:"缺口计算与价格情景模拟。",
  engd_plan:"需求驱动供给计划与选址排序。",
  engd_conv:"转化预测与吸纳监控。",
  online:"在线", autonomous:"自治",
  src_sakani:"Sakani", src_wafi:"Wafi", src_uc1:"分群", src_uc2:"偏好", src_uc3:"签约", src_uc4:"推荐",
  src_moj:"司法部房价", src_gastat:"统计总局", src_sec:"电力", src_private:"私有市场", src_geo:"地理/GIS",
  hub_hello:"欢迎", hub_sub:"一个智能体平台 · 三条联动旅程",
  k_resp:"报告响应时间", k_resp_v:"< 2 分钟", k_resp_s:"过去：数天（人工）",
  k_alerts:"未处理缺口预警", k_cov:"覆盖区域", k_ready:"数据就绪度",
  engines_title:"引擎与编排器", sources_title:"11 个数据源 · 实时健康",
  journeys_title:"三条联动旅程", open:"打开",
  j1_name:"对话分析", j1_body:"自然语言提问 → 编排器理解意图、跨引擎路由、返回可分享报告。",
  j2_name:"监控与早期预警", j2_body:"Agent 按计划扫描 11 个源，检测偏差并附根因发出预警。",
  j3_name:"政策模拟", j3_body:"定义政策情景 → 模拟 3 套情景 → 排序推荐 → 回灌住房助手与支持增强系统。",
  latest_alerts:"最新预警",
  chat_sub:"编排 Agent · 双语自然语言界面",
  chat_ph:"输入一个分析问题…", send:"发送", presets:"试试：", memory:"会话记忆",
  intent:"意图", routing:"路由", confidence:"置信度", sources:"数据源", coverageMode:"覆盖模式",
  think_intent:"理解意图", think_route:"从模型注册表选择引擎",
  think_perm:"校验权限范围", think_run:"运行分析", think_compose:"组合输出",
  genReport:"生成报告", report:"报告", reportReady:"部委品牌 PDF 已就绪",
  refNo:"参考号", generated:"生成时间", download:"下载", askPolicy:"对此模拟一项政策 →",
  q_demand:"利雅得改善型客群（Al-Mutatallibeen）未来 6 个月的需求趋势如何？",
  q_gap:"那对应的供需缺口有多大？需要补多少供给才能补上？",
  q_policy:"如果把融资比例上调 10%，能否缓解这个缺口？",
  q_vague:"把所有受益人的敏感个人信息明细给我看看。",
  a_demand:"利雅得 · 改善型客群需求预计 6 个月内上升约 31%（MAPE ≤ 20%），由收入档迁移与向现房产品的偏好转移驱动。",
  a_gap:"沿用上一轮的「利雅得 · 改善型客群」：供需缺口为 34%（红色）。补足需在 12 个月内约 18,400 套——战略规划引擎给出按吸纳排序的 3 情景供给方案。",
  a_vague:"无法执行。该请求超出你的权限范围，且平台对个人数据为只读。我可以改为提供聚合、脱敏的客群分析。",
  escalated:"升级", esc_perm:"触发权限 / 数据范围保护",
  cross_note:"跨引擎编排：自动串联了两个引擎。",
  gapRed:"缺口 > 30% → 建议战略级升级",
  chart_demandT:"需求指数（利雅得 · 改善型）", chart_gapT:"各区供需缺口（%）",
  mon_sub:"数据质量监控与周期报告 Agent — 自动",
  runScan:"立即扫描", scanning:"正在扫描 11 个源…", lastScan:"上次定时扫描",
  freshness:"新鲜度", within:"SLA 内", delayed:"延迟", srcHealth:"数据源健康（11）",
  kpiThresh:"KPI 阈值", alerts:"预警", noAlerts:"无未处理预警 — 所有 KPI 在阈值内。",
  sev_red:"严重", sev_amber:"警告", sev_info:"提示",
  al_gap_t:"利雅得 · 改善型客群 供需缺口 34%（红）", al_gap_b:"缺口突破 30% 红色阈值。根因：需求 +31% 而供给管线持平。",
  al_moj_t:"司法部房价数据延迟", al_moj_b:"数据源延迟超过 SLA 的 50%。沿用最近有效数据并附覆盖提示。",
  al_conv_t:"转化率下滑 · 麦加", al_conv_b:"资格→签约转化降至 52%（低于 60% 干预阈值）。",
  rootCause:"根因", askOrch:"让编排器分析", action:"操作", ack:"确认", acked:"已确认",
  scanDone:"扫描完成 — 已检查 11/11 个源", newAlert:"监控 Agent 触发新预警",
  pol_sub:"政策模拟 Agent — 带敏感度的 3 情景，随后回灌生态",
  policyType:"政策类型", pt_financing:"住房融资", pt_whiteland:"白地费", pt_subsidy:"补贴条件",
  lever_financing:"Δ 融资比例", lever_whiteland:"Δ 白地费", lever_subsidy:"Δ 补贴",
  runSim:"运行模拟", simulating:"正在模拟 3 套情景…",
  sc_opt:"乐观", sc_base:"基准", sc_pess:"悲观",
  m_demand:"需求", m_supply:"供给", m_gap:"缺口", m_price:"价格",
  recos:"排序推荐", feedEco:"回灌住房助手与支持增强系统", feeding:"正在回灌生态…", fed:"已交付住房助手与支持增强系统",
  reco1:"将融资调整分两个季度推进，避免价格冲击。",
  reco2:"在利雅得配合白地费减免，可抬升供给约 8%。",
  reco3:"每周监控改善型客群转化；低于 60% 即干预。",
  impactNote:"相对当前基线的影响（%）。置信度反映数据质量与历史准确率。",
  rep_sub:"已生成报告与 Agent 操作日志 — 可溯源、带覆盖模式标注",
  rep_title:"标题", rep_cov:"覆盖", rep_conf:"置信度", rep_time:"生成时间", rep_ref:"参考号",
  repName_demand:"利雅得 · 改善型客群需求展望", repName_gap:"利雅得供需缺口与供给方案",
  repName_policy:"融资政策影响 — 3 情景", repName_weekly:"每周 KPI 绩效报告",
  agentLog:"Agent 操作日志", noReports:"暂无报告 — 在对话分析中生成一份。",
  cockpit_sub:"跨部委 · 私有 · 全市场的高管视图 — 只读",
  k_market:"全市场缺口", k_supply:"规划供给（12月）", k_conv:"平均转化", k_savings:"每报告节省时间",
  eco_sub:"DSO 是单一事实来源；输出流向上层助手与支持系统",
  eco_dso:"DSO", eco_copilot:"住房助手 (CoPilot)", eco_h03:"支持增强",
  eco_consumes:"消费需求 · 缺口 · 情景分析", manualPush:"API 契约",
  redline:"平台只做推荐且只读 — 永不修改源数据、永不执行政策、永不自动审批。",
  running:"运行中…", done:"完成", view:"查看", live:"实时", autoBadge:"自动",
  agentlog_h:"Agent 活动", noItems:"暂无内容。",
  log_scan:"数据质量监控扫描 11 个源 — 9 绿 2 黄",
  log_route:"编排器路由问询 → 需求智能引擎",
  log_cross:"编排器串联 平衡 + 规划 引擎",
  log_alert:"监控触发红色缺口预警 · 利雅得",
  log_report:"已生成报告 · 参考号",
  log_policy:"政策模拟运行 3 套情景",
  log_feed:"结果已交付住房助手与支持增强系统",
  log_idle:"知识 Agent 将问询编入知识库",
};

/* =========================================================================
   Ministerial-briefing storyline data (interest-rate +50bps shock)
   ========================================================================= */
const MACRO_CORR = [   // 6 indicators × R² vs demand/supply/price (Figure 1)
  { key:"int",   demand:0.73, supply:0.58, price:0.81 },
  { key:"pop",   demand:0.85, supply:0.22, price:0.69 },
  { key:"gdp",   demand:0.66, supply:0.51, price:0.71 },
  { key:"inf",   demand:0.61, supply:0.42, price:0.66 },
  { key:"unemp", demand:0.49, supply:0.31, price:0.44 },
  { key:"oil",   demand:0.39, supply:0.35, price:0.41 },
];
const ECON_SCN = [
  { k:"opt",  prob:20, rate:"6.50%", inf:"2.5%", unemp:"4.0%", gdp:"3.5%" },
  { k:"base", prob:55, rate:"7.25%", inf:"3.2%", unemp:"4.8%", gdp:"2.1%" },
  { k:"pess", prob:25, rate:"7.50%", inf:"4.5%", unemp:"6.2%", gdp:"0.8%" },
];
const VULN = [
  { key:"riyadh",v:92 },{ key:"eastern",v:78 },{ key:"makkah",v:65 },{ key:"madinah",v:48 },
  { key:"qassim",v:35 },{ key:"asir",v:28 },{ key:"tabuk",v:22 },{ key:"hail",v:18 },
  { key:"najran",v:15 },{ key:"jazan",v:12 },{ key:"bahah",v:10 },{ key:"jawf",v:8 },{ key:"northern",v:5 },
];
const SEG_FORECAST = [   // Riyadh demand by segment A–E, 5-year (Figure 2)
  { y:"2026", A:14200, B:11800, C:18900, D:15300, E:7400 },
  { y:"2027", A:16800, B:10200, C:17800, D:14800, E:7500 },
  { y:"2028", A:18900, B:9400,  C:17200, D:14500, E:7600 },
  { y:"2029", A:20400, B:9000,  C:16900, D:14200, E:7700 },
  { y:"2030", A:21600, B:8900,  C:17000, D:14100, E:7800 },
];
const MIGRATION = [ {k:"B→A",v:2100},{k:"C→A",v:800},{k:"C→B",v:500},{k:"D→C",v:300} ];
const GAP_HEAT = {   // region × segment gap, units (Figure 4)
  rows:["riyadh","eastern","makkah","madinah","qassim","asir"],
  cols:["A","B","C","D","E"],
  data:{
    riyadh:[-12400,-6100,-5200,1800,3200], eastern:[-5300,-8700,-2100,400,1100],
    makkah:[-4800,-3200,2500,1200,900], madinah:[-2100,-1500,800,-400,600],
    qassim:[-900,-600,400,300,200], asir:[-500,-300,200,100,100],
  },
};
const DEVS = [   // developer scorecard (Figure 6 + table)
  { name:"Al-Majd",        grade:"A", score:92, quality:90, completion:88, concentration:84, timeliness:91, signing:89 },
  { name:"Riyadh Housing", grade:"A", score:88, quality:92, completion:85, concentration:80, timeliness:86, signing:84 },
  { name:"Watan Builders", grade:"A", score:86, quality:84, completion:91, concentration:82, timeliness:85, signing:83 },
  { name:"Dar Al-Maskan",  grade:"B", score:78, quality:76, completion:80, concentration:72, timeliness:74, signing:79 },
  { name:"Shamal Dev",     grade:"B", score:75, quality:73, completion:77, concentration:70, timeliness:71, signing:72 },
];
const DEV_DIMS = ["quality","completion","concentration","timeliness","signing"];
const POLICY_AB = {   // Figure 7
  A:{ demand:0,  supply:3100, gapClose:85, cost:2.4, risk:"low"  },
  B:{ demand:18, supply:0,    gapClose:38, cost:1.6, risk:"high" },
};
const RECS = [   // Section 10 — ranked, role-owned
  { pri:"immediate", owner:"planner", deadline:"30 Jun 2026", k:"rec_dev" },
  { pri:"immediate", owner:"leader",  deadline:"31 Jul 2026", k:"rec_subsidy" },
  { pri:"high",      owner:"leader",  deadline:"now",         k:"rec_nodown" },
  { pri:"high",      owner:"datamgr", deadline:"23 Jun 2026", k:"rec_moj" },
  { pri:"medium",    owner:"analyst", deadline:"quarterly",   k:"rec_refresh" },
];

/* ---- i18n additions for the briefing storyline (EN / AR / ZH) ---- */
Object.assign(I18N.en, {
  eng_macro:"Macro-Economic", engd_macro:"Macro shocks → housing impact & scenarios.",
  nav_macro:"Macro Impact", nav_dev:"Developers",
  shock_banner:"SAMA announced an unexpected +50bps interest-rate hike — assess the housing-market impact.",
  runAssessment:"Run impact assessment",
  q_shock:"SAMA just raised rates +50bps — assess the impact on Riyadh & Eastern housing.",
  a_shock:"Urgent multi-engine assessment complete. A +50bps shock drives Riyadh demand −7% (base) to −14% (pessimistic, Y1) and forces an 18% Segment B→A migration. The Riyadh Segment A gap widens to 12,400 units (Y3); current pipeline covers only 35%. Generated autonomously in minutes — historically 3–4 days.",
  view_macro:"View macro analysis", view_gap:"View gap heatmap", view_dev:"Developer scorecard",
  view_policy:"Policy A vs B simulation", gen_brief:"Generate ministerial briefing",
  repName_brief:"Macro-Economic Impact — Interest Rate Hike (+50bps)",
  brief_urgent:"URGENT · Ministerial Briefing", autonomous_note:"Autonomous · human-reviewed",
  // macro page
  macro_sub:"Macro-Economic engine — indicator correlation, economic scenarios, regional vulnerability",
  corr_title:"Macro indicators → housing-market correlation (R²)", corr_thresh:"R² = 0.6 threshold",
  ind_int:"Interest rate", ind_pop:"Population", ind_gdp:"GDP growth", ind_inf:"Inflation (CPI)", ind_unemp:"Unemployment", ind_oil:"Oil price",
  m_demandR:"Demand R²", m_supplyR:"Supply R²", m_priceR:"Price R²",
  econ_title:"Three economic scenarios (2026–2029)", prob:"probability",
  p_rate:"Interest rate", p_inf:"Inflation", p_unemp:"Unemployment", p_gdp:"GDP growth",
  vuln_title:"Regional economic vulnerability to the rate shock", vuln_axis:"Vulnerability index (0–100)",
  // 5-seg demand + migration
  chart_segT:"Riyadh demand forecast by Sakani segment (5-year)",
  seg_a:"Seg A (≤5K)", seg_b:"Seg B (5–8K)", seg_c:"Seg C (8–14K)", seg_d:"Seg D (14–25K)", seg_e:"Seg E (>25K)",
  mig_title:"Net segment downgrades (3-year cumulative)", mig_note:"18% Segment B→A — a one-way structural shift, +22% subsidy burden (SAR 1.8B).",
  households:"households",
  a_demand5:"Across the five Sakani segments, Segment A grows +11% CAGR while B–D contract — forced migration, not organic growth. 2,100 households shift B→A (the largest structural change in 5 years).",
  // gap heatmap
  heat_title:"Supply-demand gap by region × segment (Y3, units)", surplus:"surplus", shortage:"shortage",
  a_gapHeat:"Product-market mismatch: shortages concentrate in affordable Seg A–B (Riyadh A −12,400, Eastern B −8,700) while Seg D–E show surplus. Not a quantity problem — the pipeline is building the wrong mix.",
  // developers
  dev_sub:"Developer value-chain engine — 5-dimension scorecard, grades & engagement tiers",
  dev_score:"5-dimension scorecard (Segment A-active)", d_quality:"Quality", d_completion:"Completion", d_concentration:"Concentration", d_timeliness:"Timeliness", d_signing:"Signing",
  grade:"Grade", score:"Score", capacity_note:"3 A-grade developers offer 4,200 units/yr — ~50% of the gap-closure need.",
  tiers_title:"Engagement plan", tier:"Tier", tier_dev:"Developers", tier_action:"Action", tier_out:"Output", tier_when:"Timeline",
  t1:"Immediate", t1d:"Al-Majd · Riyadh Housing · Watan", t1a:"Direct negotiation", t1o:"4,200 units/yr", t1w:"Q3 2026",
  t2:"Incentivized", t2d:"6 B-grade developers", t2a:"+15% subsidy (Policy A)", t2o:"+3,100 units/yr", t2w:"Q4 2026–Q1 2027",
  t3:"Monitor", t3d:"20 C/D-grade", t3a:"No engagement; reassess", t3o:"—", t3w:"Q1 2027",
  // policy A vs B
  polAB_sub:"Policy Simulation — developer subsidy vs. reduce down payment (counter-intuitive)",
  runAB:"Run Policy A vs B", policyA:"Policy A · Developer subsidy +15%", policyB:"Policy B · Reduce down payment",
  pa_kind:"Supply-side", pb_kind:"Demand-side",
  m_gapclose:"Gap closure", m_cost:"Fiscal cost", m_risk:"Risk", m_demandImp:"Demand impact", m_supplyImp:"Supply impact",
  risk_low:"Low", risk_high:"High", recommended:"Recommended", counter:"Counter-indicated",
  warnB_t:"Counter-indication", warnB:"Reducing down payment is politically attractive but backfires in a supply-constrained market: +18% demand (2,600 households) with zero new supply → wider gap and higher prices. If relief is needed, use rental assistance instead.",
  recs_title:"Strategic recommendations (ranked)", pri_immediate:"IMMEDIATE", pri_high:"HIGH", pri_medium:"MEDIUM",
  owner:"Owner", deadline:"Deadline",
  rec_dev:"Engage Tier-1 developers for accelerated Segment A delivery (4,200 units/yr).",
  rec_subsidy:"Implement Policy A: +15% developer subsidy (+3,100 units/yr) → gap closure 85%.",
  rec_nodown:"Do NOT reduce beneficiary down payment — simulation shows it widens the gap.",
  rec_moj:"Resolve DS-07 (MOJ price) pipeline delay — escalate ticket #DQ-2407.",
  rec_refresh:"Schedule quarterly macro-economic scenario refresh; ad-hoc on any rate change.",
  // data-quality enrichment
  dq_score:"Data quality score", dq_ticket:"Auto-notified Data Manager", dq_impact:"Confidence impact",
  dq_degraded:"DS-07 (MOJ price) degraded · 3-day delay → price confidence 95% → 88%. Proceeding on last valid snapshot.",
});
Object.assign(I18N.ar, {
  eng_macro:"الاقتصاد الكلي", engd_macro:"الصدمات الكلية ← أثر السكن والسيناريوهات.",
  nav_macro:"الأثر الكلي", nav_dev:"المطوّرون",
  shock_banner:"أعلن البنك المركزي رفعاً غير متوقع للفائدة +٥٠ نقطة — قيّم الأثر على سوق السكن.",
  runAssessment:"تشغيل تقييم الأثر",
  q_shock:"رفع البنك المركزي الفائدة +٥٠ نقطة — قيّم الأثر على سكن الرياض والشرقية.",
  a_shock:"اكتمل التقييم العاجل متعدد المحركات. صدمة +٥٠ نقطة تخفض طلب الرياض −٧٪ (أساسي) إلى −١٤٪ (متشائم، السنة ١) وتدفع هجرة ١٨٪ من الشريحة B إلى A. تتسع فجوة الشريحة A في الرياض إلى ١٢٬٤٠٠ وحدة (السنة ٣)؛ يغطي الخط الحالي ٣٥٪ فقط. وُلّد ذاتياً خلال دقائق — تاريخياً ٣–٤ أيام.",
  view_macro:"عرض التحليل الكلي", view_gap:"خريطة حرارة الفجوة", view_dev:"بطاقة المطوّرين",
  view_policy:"محاكاة السياسة A مقابل B", gen_brief:"توليد الموجز الوزاري",
  repName_brief:"الأثر الاقتصادي الكلي — رفع الفائدة (+٥٠ نقطة)",
  brief_urgent:"عاجل · موجز وزاري", autonomous_note:"ذاتي · مُراجَع بشرياً",
  macro_sub:"محرك الاقتصاد الكلي — ارتباط المؤشرات، السيناريوهات الاقتصادية، الهشاشة الإقليمية",
  corr_title:"ارتباط المؤشرات الكلية بسوق السكن (R²)", corr_thresh:"عتبة R² = ٠٫٦",
  ind_int:"سعر الفائدة", ind_pop:"السكان", ind_gdp:"نمو الناتج", ind_inf:"التضخم", ind_unemp:"البطالة", ind_oil:"سعر النفط",
  m_demandR:"R² الطلب", m_supplyR:"R² العرض", m_priceR:"R² السعر",
  econ_title:"ثلاثة سيناريوهات اقتصادية (٢٠٢٦–٢٠٢٩)", prob:"الاحتمال",
  p_rate:"سعر الفائدة", p_inf:"التضخم", p_unemp:"البطالة", p_gdp:"نمو الناتج",
  vuln_title:"الهشاشة الاقتصادية الإقليمية تجاه صدمة الفائدة", vuln_axis:"مؤشر الهشاشة (٠–١٠٠)",
  chart_segT:"تنبؤ طلب الرياض حسب شريحة سكني (٥ سنوات)",
  seg_a:"الشريحة A", seg_b:"الشريحة B", seg_c:"الشريحة C", seg_d:"الشريحة D", seg_e:"الشريحة E",
  mig_title:"صافي تنزّل الشرائح (تراكمي ٣ سنوات)", mig_note:"١٨٪ هجرة B←A — تحوّل بنيوي أحادي الاتجاه، +٢٢٪ عبء دعم (١٫٨ مليار).",
  households:"أسرة",
  a_demand5:"عبر الشرائح الخمس، تنمو الشريحة A بـ +١١٪ سنوياً بينما تنكمش B–D — هجرة قسرية لا نمو عضوي. ٢٬١٠٠ أسرة تتحول B←A (أكبر تغيّر بنيوي منذ ٥ سنوات).",
  heat_title:"فجوة العرض والطلب حسب المنطقة × الشريحة (السنة ٣، وحدات)", surplus:"فائض", shortage:"عجز",
  a_gapHeat:"عدم تطابق المنتج والسوق: يتركّز العجز في الشرائح الميسورة A–B (الرياض A −١٢٬٤٠٠، الشرقية B −٨٬٧٠٠) بينما يظهر فائض في D–E. ليست مشكلة كمية — الخط ينتج المزيج الخاطئ.",
  dev_sub:"محرك سلسلة قيمة المطوّرين — بطاقة بخمسة أبعاد، التصنيف ومستويات التعامل",
  dev_score:"بطاقة بخمسة أبعاد (نشِط في الشريحة A)", d_quality:"الجودة", d_completion:"الإنجاز", d_concentration:"التركّز", d_timeliness:"الالتزام", d_signing:"التوقيع",
  grade:"الفئة", score:"الدرجة", capacity_note:"٣ مطوّرين فئة A يوفّرون ٤٬٢٠٠ وحدة/سنة — نحو ٥٠٪ من الحاجة لسدّ الفجوة.",
  tiers_title:"خطة التعامل", tier:"المستوى", tier_dev:"المطوّرون", tier_action:"الإجراء", tier_out:"المخرجات", tier_when:"التوقيت",
  t1:"فوري", t1d:"المجد · الرياض للإسكان · وطن", t1a:"تفاوض مباشر", t1o:"٤٬٢٠٠ وحدة/سنة", t1w:"ربع ٣ ٢٠٢٦",
  t2:"محفّز", t2d:"٦ مطوّرين فئة B", t2a:"+١٥٪ دعم (سياسة A)", t2o:"+٣٬١٠٠ وحدة/سنة", t2w:"ربع ٤ ٢٠٢٦–ربع ١ ٢٠٢٧",
  t3:"مراقبة", t3d:"٢٠ من فئة C/D", t3a:"بلا تعامل؛ إعادة تقييم", t3o:"—", t3w:"ربع ١ ٢٠٢٧",
  polAB_sub:"محاكاة السياسات — دعم المطوّرين مقابل خفض الدفعة الأولى (نتيجة معاكسة للحدس)",
  runAB:"تشغيل السياسة A مقابل B", policyA:"السياسة A · دعم المطوّرين +١٥٪", policyB:"السياسة B · خفض الدفعة الأولى",
  pa_kind:"جانب العرض", pb_kind:"جانب الطلب",
  m_gapclose:"سدّ الفجوة", m_cost:"الكلفة المالية", m_risk:"المخاطرة", m_demandImp:"أثر الطلب", m_supplyImp:"أثر العرض",
  risk_low:"منخفضة", risk_high:"عالية", recommended:"موصى به", counter:"غير موصى به",
  warnB_t:"تحذير معاكس", warnB:"خفض الدفعة الأولى جذّاب سياسياً لكنه يأتي بنتائج عكسية في سوق محدود العرض: +١٨٪ طلب (٢٬٦٠٠ أسرة) دون أي عرض جديد ← فجوة أوسع وأسعار أعلى. إن لزم الدعم فاستخدم مساعدة الإيجار.",
  recs_title:"التوصيات الاستراتيجية (مرتّبة)", pri_immediate:"فوري", pri_high:"مرتفع", pri_medium:"متوسط",
  owner:"المسؤول", deadline:"الموعد",
  rec_dev:"إشراك مطوّري المستوى ١ لتسريع تسليم الشريحة A (٤٬٢٠٠ وحدة/سنة).",
  rec_subsidy:"تطبيق السياسة A: دعم مطوّرين +١٥٪ (+٣٬١٠٠ وحدة/سنة) ← سدّ الفجوة ٨٥٪.",
  rec_nodown:"لا تُخفّض الدفعة الأولى للمستفيد — المحاكاة تُظهر اتساع الفجوة.",
  rec_moj:"معالجة تأخّر مصدر أسعار العدل — تصعيد التذكرة #DQ-2407.",
  rec_refresh:"جدولة تحديث ربع سنوي للسيناريوهات الكلية؛ فوري عند أي تغيّر للفائدة.",
  dq_score:"درجة جودة البيانات", dq_ticket:"إبلاغ تلقائي لمدير البيانات", dq_impact:"أثر الثقة",
  dq_degraded:"تدهور DS-07 (أسعار العدل) · تأخّر ٣ أيام ← ثقة السعر ٩٥٪ ← ٨٨٪. المتابعة على آخر لقطة صالحة.",
});
Object.assign(I18N.zh, {
  eng_macro:"宏观经济", engd_macro:"宏观冲击 → 住房影响与情景。",
  nav_macro:"宏观影响", nav_dev:"开发商",
  shock_banner:"SAMA 意外宣布加息 +50 个基点 —— 评估对住房市场的影响。",
  runAssessment:"运行影响评估",
  q_shock:"SAMA 刚加息 +50bps —— 评估对利雅得与东部省住房的影响。",
  a_shock:"紧急多引擎评估完成。+50bps 冲击使利雅得需求下降 −7%(基准)至 −14%(悲观,第1年),并迫使 18% 的 B 段向 A 段迁移。利雅得 A 段缺口扩大至 12,400 套(第3年),现有管线仅覆盖 35%。本次自主生成仅用几分钟 —— 过去需 3–4 天。",
  view_macro:"查看宏观分析", view_gap:"查看缺口热力图", view_dev:"开发商评分",
  view_policy:"政策 A vs B 模拟", gen_brief:"生成部长简报",
  repName_brief:"宏观经济影响 —— 利率上调(+50bps)",
  brief_urgent:"紧急 · 部长简报", autonomous_note:"自主 · 人工复核",
  macro_sub:"宏观经济引擎 —— 指标相关性、经济情景、区域脆弱性",
  corr_title:"宏观指标 → 住房市场相关性(R²)", corr_thresh:"R² = 0.6 阈值",
  ind_int:"利率", ind_pop:"人口", ind_gdp:"GDP 增长", ind_inf:"通胀(CPI)", ind_unemp:"失业率", ind_oil:"油价",
  m_demandR:"需求 R²", m_supplyR:"供给 R²", m_priceR:"价格 R²",
  econ_title:"三套经济情景(2026–2029)", prob:"概率",
  p_rate:"利率", p_inf:"通胀", p_unemp:"失业率", p_gdp:"GDP 增长",
  vuln_title:"各区域对加息冲击的经济脆弱性", vuln_axis:"脆弱性指数(0–100)",
  chart_segT:"利雅得各 Sakani 收入段需求预测(5 年)",
  seg_a:"A 段(≤5千)", seg_b:"B 段(5–8千)", seg_c:"C 段(8–14千)", seg_d:"D 段(14–25千)", seg_e:"E 段(>25千)",
  mig_title:"客群净下迁(3 年累计)", mig_note:"18% 的 B→A 迁移 —— 单向结构性转移,补贴负担 +22%(SAR 18 亿)。",
  households:"户",
  a_demand5:"在五个 Sakani 段中,A 段以 +11% 年复合增长,而 B–D 收缩 —— 是被迫迁移而非自然增长。2,100 户从 B 迁往 A(5 年来最大的结构变化)。",
  heat_title:"按区域 × 客群的供需缺口(第3年,套)", surplus:"盈余", shortage:"短缺",
  a_gapHeat:"产品-市场错配:短缺集中在可负担的 A–B 段(利雅得 A −12,400、东部 B −8,700),而 D–E 段出现盈余。不是数量问题 —— 管线在造错误的产品组合。",
  dev_sub:"开发商价值链引擎 —— 五维评分卡、评级与对接分层",
  dev_score:"五维评分卡(A 段活跃)", d_quality:"质量", d_completion:"完工", d_concentration:"集中度", d_timeliness:"准时", d_signing:"签约",
  grade:"评级", score:"得分", capacity_note:"3 家 A 级开发商提供 4,200 套/年 —— 约占补缺口需求的 50%。",
  tiers_title:"对接计划", tier:"层级", tier_dev:"开发商", tier_action:"动作", tier_out:"产出", tier_when:"时间",
  t1:"立即", t1d:"Al-Majd · 利雅得住房 · Watan", t1a:"直接谈判", t1o:"4,200 套/年", t1w:"2026 Q3",
  t2:"激励", t2d:"6 家 B 级开发商", t2a:"+15% 补贴(政策 A)", t2o:"+3,100 套/年", t2w:"2026 Q4–2027 Q1",
  t3:"观察", t3d:"20 家 C/D 级", t3a:"暂不对接;重评", t3o:"—", t3w:"2027 Q1",
  polAB_sub:"政策模拟 —— 开发商补贴 vs 降低首付(反直觉结论)",
  runAB:"运行 政策 A vs B", policyA:"政策 A · 开发商补贴 +15%", policyB:"政策 B · 降低首付",
  pa_kind:"供给侧", pb_kind:"需求侧",
  m_gapclose:"缺口补足", m_cost:"财政成本", m_risk:"风险", m_demandImp:"需求影响", m_supplyImp:"供给影响",
  risk_low:"低", risk_high:"高", recommended:"推荐", counter:"不推荐",
  warnB_t:"反向警告", warnB:"降低首付在政治上讨好,但在供给受限的市场会适得其反:需求 +18%(2,600 户)却零新增供给 → 缺口更大、价格更高。若确需纾困,应改用租赁补贴。",
  recs_title:"战略建议(排序)", pri_immediate:"立即", pri_high:"高", pri_medium:"中",
  owner:"负责人", deadline:"截止",
  rec_dev:"对接一级开发商,加速 A 段交付(4,200 套/年)。",
  rec_subsidy:"实施政策 A:开发商补贴 +15%(+3,100 套/年)→ 缺口补足 85%。",
  rec_nodown:"不要降低受益人首付 —— 模拟显示会扩大缺口。",
  rec_moj:"解决 DS-07(司法部房价)管线延迟 —— 升级工单 #DQ-2407。",
  rec_refresh:"安排季度宏观情景刷新;利率一有变动即临时刷新。",
  dq_score:"数据质量分", dq_ticket:"已自动通知数据经理", dq_impact:"置信度影响",
  dq_degraded:"DS-07(司法部房价)降级 · 延迟 3 天 → 价格置信度 95% → 88%。沿用最近有效快照继续。",
  // role label for Data Manager (used by recommendations owner)
  datamgr_full:"数据经理", datamgr:"数据经理",
});
Object.assign(I18N.en, { datamgr_full:"Data Manager", datamgr:"Data Manager",
  rg_riyadh:"Riyadh", rg_eastern:"Eastern", rg_makkah:"Makkah", rg_madinah:"Madinah", rg_asir:"Asir", rg_qassim:"Qassim",
  rg_tabuk:"Tabuk", rg_hail:"Hail", rg_najran:"Najran", rg_jazan:"Jazan", rg_bahah:"Al-Bahah", rg_jawf:"Al-Jawf", rg_northern:"Northern" });
Object.assign(I18N.ar, { datamgr_full:"مدير البيانات", datamgr:"مدير البيانات",
  rg_riyadh:"الرياض", rg_eastern:"الشرقية", rg_makkah:"مكة", rg_madinah:"المدينة", rg_asir:"عسير", rg_qassim:"القصيم",
  rg_tabuk:"تبوك", rg_hail:"حائل", rg_najran:"نجران", rg_jazan:"جازان", rg_bahah:"الباحة", rg_jawf:"الجوف", rg_northern:"الشمالية" });
Object.assign(I18N.zh, {
  rg_riyadh:"利雅得", rg_eastern:"东部省", rg_makkah:"麦加", rg_madinah:"麦地那", rg_asir:"阿西尔", rg_qassim:"卡西姆",
  rg_tabuk:"塔布克", rg_hail:"哈伊勒", rg_najran:"纳季兰", rg_jazan:"吉赞", rg_bahah:"巴哈", rg_jawf:"焦夫", rg_northern:"北部边境" });
Object.assign(I18N.en, { build:"Build" });
Object.assign(I18N.ar, { build:"الإصدار" });
Object.assign(I18N.zh, { build:"发版" });

/* ---- storyline (progressive multi-agent narrative) ---- */
Object.assign(I18N.en, {
  q_history:"Show the last 5 years of quarterly history: SAMA rate + Riyadh & Eastern demand and supply.",
  hist_title:"5-year quarterly history (2022 Q1 – 2026 Q2)",
  hist_insight:"Demand is rate-sensitive but rebounded from 2025 Q1; supply lags (Riyadh +2.3% vs demand +10.6%). The +50bps jump may break the rebound.",
  hist_rate:"SAMA rate", hist_rd:"Riyadh demand", hist_rs:"Riyadh supply",
  plan_title:"Orchestration plan", story_intro:"Routing across six engines — each agent streams its result as it completes.",
  eng_dev:"Developer Value-Chain", eng_policy:"Policy Simulation",
  engd_dev:"Developer scorecard & engagement tiers.", engd_policy:"Causal-chain policy comparison.",
  agent_running:"running…", agent_done:"done",
  f_macro:"Interest rate is the dominant driver (price R²=0.81, demand R²=0.73). Base case: Riyadh demand −7.2% in Y1.",
  f_demand:"Segment A grows +11% CAGR while B–D contract — 18% forced B→A migration (2,100 households), +22% subsidy burden.",
  f_gap:"Product-market mismatch: Riyadh Seg A −12,400, Eastern Seg B −8,700; Seg D–E in surplus.",
  f_plan:"Segment A pipeline converts at just 52% → 35% gap coverage. Only ‘A-grade devs + subsidy’ reaches 85%.",
  f_dev:"3 A-grade developers (Al-Majd 92, Riyadh Housing 88, Watan 86) ≈ 4,200 units/yr — about half the gap.",
  f_policy:"Policy A (developer subsidy) closes the gap to 85%; Policy B (cut down payment) WORSENS it to 38%.",
  sum_title:"Orchestrator summary", sum_intro:"Six engines complete in minutes (historically 3–4 days). Consolidated findings below — the full ministerial briefing is ready to generate.",
  core_findings:"Core findings", effi_title:"Days → minutes",
  effi_check:"Data check", effi_full:"Full analysis", effi_report:"Report generation", effi_team:"Headcount",
  effi_old:"Old process", effi_new:"DSO platform",
  cf_crit:"Critical", cf_high:"High", cf_pos:"Positive",
  cf1:"Riyadh demand −14% (pessimistic) / −7% (base) in Y1.",
  cf2:"18% of Segment B households shift to A — +22% subsidy burden (SAR 1.8B).",
  cf3:"Riyadh Segment A gap 12,400 units; pipeline covers only 35%.",
  cf4:"Segment A conversion 52% vs 78% for Segment E.",
  cf5:"3 A-grade developers can close ~50% of the gap.",
  cf6:"Recommend +15% developer subsidy; cutting down payment worsens the gap.",
  pl_seg:"Segment", pl_proj:"Projects", pl_planned:"Planned", pl_conv:"Conversion", pl_deliver:"Expected (3Y)", pl_cover:"Coverage",
  closure_title:"Gap-closure scenarios (Riyadh Seg A)",
  cl1:"Status quo", cl2:"+A-grade devs", cl3:"+100% conv. (unreal.)", cl4:"+devs + Policy A",
  dev_top:"A-grade developers (Segment A)", tiers_short:"Tier-1 negotiate now · Tier-2 +15% subsidy · Tier-3 monitor",
  downloadBrief:"Download briefing (HTML)", genBrief2:"Generate ministerial briefing",
  y1impact:"Base-case Y1 impact", dominant:"dominant driver",
});
Object.assign(I18N.zh, {
  q_history:"调出过去 5 年季度历史:SAMA 利率 + 利雅得与东部省的需求和供给。",
  hist_title:"5 年季度历史(2022 Q1 – 2026 Q2)",
  hist_insight:"需求对利率敏感,但自 2025 Q1 起反弹;供给滞后(利雅得 +2.3% vs 需求 +10.6%)。本次 +50bps 跳升可能打破反弹。",
  hist_rate:"SAMA 利率", hist_rd:"利雅得需求", hist_rs:"利雅得供给",
  plan_title:"编排计划", story_intro:"跨六个引擎路由 —— 每个智能体完成后即刻流式给出结果。",
  eng_dev:"开发商价值链", eng_policy:"政策模拟",
  engd_dev:"开发商评分卡与对接分层。", engd_policy:"因果链政策对比。",
  agent_running:"运行中…", agent_done:"完成",
  f_macro:"利率是主导驱动(价格 R²=0.81、需求 R²=0.73)。基准:利雅得需求 Y1 −7.2%。",
  f_demand:"A 段 +11% 年复合增长,B–D 收缩 —— 18% 的 B→A 被迫迁移(2,100 户),补贴负担 +22%。",
  f_gap:"产品-市场错配:利雅得 A 段 −12,400、东部 B 段 −8,700;D–E 段盈余。",
  f_plan:"A 段管线转化仅 52% → 缺口覆盖 35%。只有「A 级开发商 + 补贴」能到 85%。",
  f_dev:"3 家 A 级开发商(Al-Majd 92、Riyadh Housing 88、Watan 86)≈ 4,200 套/年 —— 约占缺口一半。",
  f_policy:"政策 A(开发商补贴)将缺口补到 85%;政策 B(降首付)反而恶化到 38%。",
  sum_title:"编排器汇总", sum_intro:"六个引擎数分钟内完成(过去需 3–4 天)。核心发现见下,完整部长简报已可生成。",
  core_findings:"核心发现", effi_title:"天级 → 分钟级",
  effi_check:"数据校验", effi_full:"全部分析", effi_report:"报告生成", effi_team:"人力投入",
  effi_old:"旧流程", effi_new:"DSO 平台",
  cf_crit:"危急", cf_high:"高", cf_pos:"积极",
  cf1:"利雅得需求 Y1 −14%(悲观)/ −7%(基准)。",
  cf2:"18% 的 B 段家庭降至 A 段 —— 补贴负担 +22%(SAR 18 亿)。",
  cf3:"利雅得 A 段缺口 12,400 套;管线仅覆盖 35%。",
  cf4:"A 段转化率 52%,而 E 段 78%。",
  cf5:"3 家 A 级开发商可补足约 50% 的缺口。",
  cf6:"建议开发商补贴 +15%;降低首付会恶化缺口。",
  pl_seg:"收入段", pl_proj:"项目数", pl_planned:"规划套数", pl_conv:"转化率", pl_deliver:"预期交付(3Y)", pl_cover:"缺口覆盖",
  closure_title:"缺口闭合情景(利雅得 A 段)",
  cl1:"维持现状", cl2:"+A 级开发商", cl3:"+100% 转化(不现实)", cl4:"+开发商 + 政策 A",
  dev_top:"A 级开发商(A 段)", tiers_short:"一级立即谈判 · 二级 +15% 补贴 · 三级观察",
  downloadBrief:"下载简报(HTML)", genBrief2:"生成部长简报",
  y1impact:"基准情景 Y1 影响", dominant:"主导驱动",
});
Object.assign(I18N.ar, {
  q_history:"اعرض تاريخ ٥ سنوات ربعي: فائدة ساما + طلب وعرض الرياض والشرقية.",
  hist_title:"تاريخ ربعي لخمس سنوات (٢٠٢٢ر١ – ٢٠٢٦ر٢)",
  hist_insight:"الطلب حسّاس للفائدة لكنه ارتدّ منذ ٢٠٢٥ر١؛ العرض متأخّر. قفزة +٥٠ نقطة قد تكسر الارتداد.",
  hist_rate:"فائدة ساما", hist_rd:"طلب الرياض", hist_rs:"عرض الرياض",
  plan_title:"خطة التنسيق", story_intro:"توجيه عبر ستة محركات — كل وكيل يعرض نتيجته فور اكتماله.",
  eng_dev:"سلسلة قيمة المطوّرين", eng_policy:"محاكاة السياسات",
  engd_dev:"بطاقة المطوّرين ومستويات التعامل.", engd_policy:"مقارنة سياسات بسلسلة سببية.",
  agent_running:"جارٍ…", agent_done:"تم",
  sum_title:"ملخّص المنسّق", sum_intro:"اكتملت ستة محركات خلال دقائق (تاريخياً ٣–٤ أيام). النتائج أدناه، والموجز الوزاري جاهز للتوليد.",
  core_findings:"النتائج الأساسية", effi_title:"أيام → دقائق",
  effi_check:"فحص البيانات", effi_full:"التحليل الكامل", effi_report:"توليد التقرير", effi_team:"عدد الأفراد",
  effi_old:"العملية القديمة", effi_new:"منصة DSO",
  cf_crit:"حرج", cf_high:"مرتفع", cf_pos:"إيجابي",
  pl_seg:"الشريحة", pl_proj:"المشاريع", pl_planned:"المخطط", pl_conv:"التحويل", pl_deliver:"المتوقع (٣س)", pl_cover:"التغطية",
  closure_title:"سيناريوهات سدّ الفجوة (الرياض، الشريحة A)",
  cl1:"الوضع الراهن", cl2:"+مطوّرو A", cl3:"+تحويل ١٠٠٪", cl4:"+مطوّرون + سياسة A",
  dev_top:"مطوّرو الفئة A", tiers_short:"المستوى ١ تفاوض الآن · ٢ دعم +١٥٪ · ٣ مراقبة",
  downloadBrief:"تنزيل الموجز (HTML)", genBrief2:"توليد الموجز الوزاري",
  y1impact:"أثر السنة ١ (الأساس)", dominant:"المحرّك المهيمن",
});

/* i18n for the data-quality card + extra figures */
Object.assign(I18N.en, {
  eng_dq:"Data Quality Monitor", engd_dq:"Verifies 11 sources before analysis.",
  f_dq:"All 11 sources verified in 12s. DS-07 (MOJ price) degraded (3-day delay) → price confidence 95%→88%; Data Manager auto-notified.",
  ws1:"pulling data sources…", ws2:"running the model…", ws3:"composing results…",
  y1_title:"Base-case Y1 impact", y1_demand:"Demand Δ", y1_price:"Price Δ", y1_conv:"Conversion",
  prepost_title:"Demand by segment — pre vs post shock", pre_label:"Pre-shock (2026)", post_label:"Post-shock (2028)",
  rootcause_title:"Root-cause decomposition · Riyadh Seg A",
  rc_demand:"Demand surge (B→A)", rc_pipeline:"Pipeline mismatch", rc_conv:"Low conversion", rc_dev:"Developer deprioritization",
  conv_title:"Conversion rate by segment", convTarget:"target 70%", rg_national:"National avg", region:"Region",
});
Object.assign(I18N.zh, {
  eng_dq:"数据质量监控", engd_dq:"分析前校验 11 个数据源。",
  f_dq:"11 个源 12 秒内全部校验。DS-07(司法部房价)降级(延迟 3 天)→ 价格置信度 95%→88%;已自动通知数据经理。",
  ws1:"拉取数据源…", ws2:"运行模型…", ws3:"组合结果…",
  y1_title:"基准情景 Y1 影响", y1_demand:"需求 Δ", y1_price:"价格 Δ", y1_conv:"转化率",
  prepost_title:"各段需求 —— 冲击前 vs 冲击后", pre_label:"冲击前(2026)", post_label:"冲击后(2028)",
  rootcause_title:"根因分解 · 利雅得 A 段",
  rc_demand:"需求激增(B→A)", rc_pipeline:"管道错配", rc_conv:"低转化率", rc_dev:"开发商优先级低",
  conv_title:"各段转化率", convTarget:"目标 70%", rg_national:"全国平均", region:"地区",
});
Object.assign(I18N.ar, {
  eng_dq:"مراقبة جودة البيانات", engd_dq:"تتحقق من ١١ مصدراً قبل التحليل.",
  f_dq:"تم التحقق من ١١ مصدراً خلال ١٢ث. تدهور DS-07 (تأخّر ٣ أيام) ← ثقة السعر ٩٥٪←٨٨٪؛ أُبلغ مدير البيانات آلياً.",
  ws1:"سحب المصادر…", ws2:"تشغيل النموذج…", ws3:"تجميع النتائج…",
  y1_title:"أثر السنة ١ (الأساس)", y1_demand:"تغيّر الطلب", y1_price:"تغيّر السعر", y1_conv:"التحويل",
  prepost_title:"الطلب حسب الشريحة — قبل وبعد الصدمة", pre_label:"قبل (٢٠٢٦)", post_label:"بعد (٢٠٢٨)",
  rootcause_title:"تحليل السبب الجذري · الرياض الشريحة A",
  rc_demand:"تضخّم الطلب (B←A)", rc_pipeline:"عدم تطابق الخط", rc_conv:"تحويل منخفض", rc_dev:"تدنّي أولوية المطوّر",
  conv_title:"معدّل التحويل حسب الشريحة", convTarget:"المستهدف ٧٠٪", rg_national:"المتوسط الوطني", region:"المنطقة",
});

/* reports center + agent-log health events */
Object.assign(I18N.en, {
  rp_weekly:"Weekly Housing Market Snapshot", rp_monthly:"Monthly Housing Market Performance", rp_quarterly:"Quarterly Strategic Report",
  periodic_title:"Periodic reports", generated_title:"Generated reports", preview:"Preview", close:"Close", viewDetail:"View detail",
  he_moj:"DS-07 price feed degraded · 3-day delay",
  he_moj_d:"The MOJ real-estate price feed (DS-07) is delayed beyond 50% of its SLA (3 days). Analysis proceeded on the last valid snapshot; price-trend confidence dropped 95% → 88%. The Data Manager was auto-notified (ticket #DQ-2407). Resolve the source pipeline before the next quarterly refresh.",
  he_anom:"Anomaly · Eastern demand +3.2σ",
  he_anom_d:"Eastern-Region demand deviated +3.2 standard deviations from the 12-week moving average — beyond the 3σ threshold. The engine flagged the value and requested expert review instead of feeding it downstream. Likely cause: an oil-sector employment cycle; verify before using in forecasts.",
  he_conv:"Conversion dip · Makkah 52%",
  he_conv_d:"Qualification → signing conversion in Makkah fell to 52%, below the 60% intervention threshold. Driver: developer-margin disincentives on affordable units. Recommended: weekly monitoring + targeted incentive; escalate to the Planning Manager if it persists two more weeks.",
  he_timeout:"Macro engine retry · SAMA feed timeout",
  he_timeout_d:"The macro-economic engine hit a timeout fetching the SAMA rate feed and retried automatically (succeeded on attempt 2). No data loss; the cached prior value was used for under 2 minutes. If timeouts recur, check the SAMA API gateway.",
  he_stale:"Private-market feed stale · 3 days",
  he_stale_d:"The private-market data source (DS-10) has not refreshed within its weekly SLA (3 days late). Private-coverage outputs carry a reduced-confidence caveat (80% maintained). The monitor uses the last valid snapshot and notified the Data Manager; total-market figures are unaffected.",
});
Object.assign(I18N.zh, {
  rp_weekly:"每周住房市场快照", rp_monthly:"月度住房市场绩效报告", rp_quarterly:"季度住房市场战略报告",
  periodic_title:"周期报告", generated_title:"已生成报告", preview:"预览", close:"关闭", viewDetail:"查看详情",
  he_moj:"DS-07 房价源降级 · 延迟 3 天",
  he_moj_d:"司法部房价源(DS-07)延迟超过 SLA 的 50%(3 天)。分析沿用最近有效快照;价格趋势置信度由 95% 降至 88%。已自动通知数据经理(工单 #DQ-2407)。请在下次季度刷新前修复该数据管线。",
  he_anom:"异常 · 东部省需求 +3.2σ",
  he_anom_d:"东部省需求较 12 周移动平均偏离 +3.2 个标准差,超过 3σ 阈值。引擎已标记该值并请求专家复核,未直接向下游传递。可能原因:石油行业就业周期;在用于预测前请先核实。",
  he_conv:"转化率下滑 · 麦加 52%",
  he_conv_d:"麦加的资格→签约转化率降至 52%,低于 60% 干预阈值。驱动因素:可负担房型上开发商利润偏低的负向激励。建议:每周监控 + 定向激励;若再持续两周则上报规划经理。",
  he_timeout:"宏观引擎重试 · SAMA 源超时",
  he_timeout_d:"宏观经济引擎在拉取 SAMA 利率源时超时并自动重试(第 2 次成功)。无数据丢失;在不到 2 分钟内沿用了缓存的上一值。若超时反复出现,请检查 SAMA API 网关。",
  he_stale:"私有市场源陈旧 · 3 天",
  he_stale_d:"私有市场数据源(DS-10)未在每周 SLA 内刷新(已迟 3 天)。私有覆盖的输出附带降置信度提示(维持 80%)。监控沿用最近有效快照并已通知数据经理;全市场数据不受影响。",
});
Object.assign(I18N.ar, {
  rp_weekly:"لقطة سوق السكن الأسبوعية", rp_monthly:"أداء سوق السكن الشهري", rp_quarterly:"التقرير الاستراتيجي الفصلي",
  periodic_title:"التقارير الدورية", generated_title:"التقارير المولّدة", preview:"معاينة", close:"إغلاق", viewDetail:"عرض التفاصيل",
  he_moj:"تدهور مصدر أسعار DS-07 · تأخّر ٣ أيام",
  he_moj_d:"تأخّر مصدر أسعار العقار (DS-07) بأكثر من ٥٠٪ من SLA (٣ أيام). تابع التحليل على آخر لقطة صالحة؛ انخفضت ثقة اتجاه السعر من ٩٥٪ إلى ٨٨٪. أُبلغ مدير البيانات آلياً (تذكرة #DQ-2407). يُرجى معالجة المصدر قبل التحديث الفصلي القادم.",
  he_anom:"شذوذ · طلب الشرقية +٣٫٢σ",
  he_anom_d:"انحرف طلب المنطقة الشرقية +٣٫٢ انحراف معياري عن متوسط ١٢ أسبوعاً — تجاوز عتبة ٣σ. وسم المحرك القيمة وطلب مراجعة خبير بدل تمريرها. السبب المرجّح: دورة توظيف قطاع النفط؛ تحقّق قبل الاستخدام في التنبؤ.",
  he_conv:"انخفاض التحويل · مكة ٥٢٪",
  he_conv_d:"انخفض التحويل من التأهيل إلى التوقيع في مكة إلى ٥٢٪، دون عتبة التدخل ٦٠٪. السبب: ضعف هامش المطوّر على الوحدات الميسورة. يُوصى بمراقبة أسبوعية وحافز موجّه؛ ويُرفع لمدير التخطيط إذا استمر أسبوعين آخرين.",
  he_timeout:"إعادة محاولة المحرك الكلي · مهلة مصدر ساما",
  he_timeout_d:"واجه المحرك الاقتصادي الكلي مهلة عند جلب مصدر فائدة ساما وأعاد المحاولة آلياً (نجح في المحاولة ٢). لا فقد للبيانات؛ استُخدمت القيمة المخزّنة لأقل من دقيقتين. إذا تكررت المهلات فافحص بوابة واجهة ساما.",
  he_stale:"قِدَم مصدر السوق الخاص · ٣ أيام",
  he_stale_d:"لم يُحدّث مصدر السوق الخاص (DS-10) ضمن SLA الأسبوعي (متأخر ٣ أيام). تحمل مخرجات التغطية الخاصة تنويه ثقة مخفّضة (٨٠٪ محفوظة). يستخدم المراقب آخر لقطة صالحة وأبلغ مدير البيانات؛ أرقام السوق الكلي غير متأثرة.",
});

/* historical series (storyline step 2) */
const HIST = [
  {q:"22Q1",r:1.00,rd:15800,rs:14200},{q:"22Q2",r:1.25,rd:16100,rs:14300},{q:"22Q3",r:1.50,rd:16300,rs:14500},{q:"22Q4",r:1.75,rd:16200,rs:14700},
  {q:"23Q1",r:2.50,rd:15900,rs:15000},{q:"23Q2",r:3.00,rd:15500,rs:15200},{q:"23Q3",r:3.75,rd:14800,rs:14800},{q:"23Q4",r:4.50,rd:14200,rs:14300},
  {q:"24Q1",r:5.25,rd:13800,rs:13900},{q:"24Q2",r:5.50,rd:13500,rs:13600},{q:"24Q3",r:5.50,rd:13300,rs:13400},{q:"24Q4",r:5.50,rd:13200,rs:13300},
  {q:"25Q1",r:5.75,rd:13400,rs:13200},{q:"25Q2",r:6.00,rd:13700,rs:13300},{q:"25Q3",r:6.25,rd:14000,rs:13400},{q:"25Q4",r:6.75,rd:14300,rs:13500},
  {q:"26Q1",r:7.00,rd:14600,rs:13600},{q:"26Q2",r:7.25,rd:14400,rs:13700},
];
const PIPELINE = [
  {seg:"A",proj:23,planned:12900,conv:52,deliver:6700,cover:"35%"},
  {seg:"B",proj:31,planned:18400,conv:61,deliver:11200,cover:"65%"},
  {seg:"C",proj:42,planned:26100,conv:68,deliver:17700,cover:"77%"},
  {seg:"D",proj:27,planned:19800,conv:74,deliver:14700,cover:"surplus"},
  {seg:"E",proj:20,planned:15600,conv:78,deliver:12200,cover:"surplus"},
];
const CLOSURE = [ {k:"cl1",v:35},{k:"cl2",v:57},{k:"cl3",v:68},{k:"cl4",v:85} ];
const CORE = [
  {sev:"crit",k:"cf1"},{sev:"crit",k:"cf2"},{sev:"crit",k:"cf3"},
  {sev:"high",k:"cf4"},{sev:"pos",k:"cf5"},{sev:"high",k:"cf6"},
];
// progressive agent sequence (data quality first, then the six engines, in order)
const STORY = [
  {key:"dq",     name:"eng_dq",     icon:"◉", time:"12s", dur:1400, viz:"dq",      f:"f_dq",     conf:94},
  {key:"macro",  name:"eng_macro",  icon:"🌐", time:"47s", dur:2400, viz:"macro",   f:"f_macro",  conf:88},
  {key:"demand", name:"eng_demand", icon:"📈", time:"31s", dur:2000, viz:"segments",f:"f_demand", conf:91},
  {key:"balance",name:"eng_balance",icon:"⚖", time:"28s", dur:1900, viz:"heatmap", f:"f_gap",    conf:86},
  {key:"plan",   name:"eng_plan",   icon:"🏗", time:"35s", dur:2100, viz:"pipeline",f:"f_plan",   conf:85},
  {key:"dev",    name:"eng_dev",    icon:"👷", time:"22s", dur:1800, viz:"dev",     f:"f_dev",    conf:87},
  {key:"policy", name:"eng_policy", icon:"⚖", time:"41s", dur:2200, viz:"policy",  f:"f_policy", conf:85},
];
// extra figures from the PDF
const Y1_IMPACT=[
  {region:"riyadh",  demand:-7.2, price:-4.1, conv:"61% (−8pp)"},
  {region:"eastern", demand:-5.8, price:-3.2, conv:"65% (−5pp)"},
  {region:"national",demand:-4.3, price:-2.8, conv:"68% (−4pp)"},
];
const PREPOST=[
  {seg:"A",pre:14200,delta:4900},{seg:"B",pre:11800,delta:-2400},{seg:"C",pre:18900,delta:-1300},
  {seg:"D",pre:15300,delta:-700},{seg:"E",pre:7400,delta:200},
];
const ROOTCAUSE=[ {k:"rc_demand",pct:48},{k:"rc_pipeline",pct:32},{k:"rc_conv",pct:14},{k:"rc_dev",pct:6} ];

/* =========================================================================
   Store / helpers
   ========================================================================= */
const Ctx = createContext(null);
const useStore = () => useContext(Ctx);
const n0 = v => Math.round(v).toLocaleString("en-US");
function nowStr(lang){ return new Date().toLocaleString(lang==="ar"?"ar-SA":lang==="zh"?"zh-CN":"en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }
function timeStr(lang){ return new Date().toLocaleTimeString(lang==="ar"?"ar-SA":lang==="zh"?"zh-CN":"en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
function refNo(){ return "DSO-2026-"+String(1000+Math.floor(Math.random()*9000)); }

/* =========================================================================
   UI atoms
   ========================================================================= */
const GlobeIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"/></svg>);
const ArrowIcon = (<svg className="ic-svg ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>);
const UserIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/></svg>);
const GearIcon = (<img className="ic-gear" src="/assets/gear2.svg" alt="" onError={e=>{const im=e.currentTarget,f=im.dataset.f||"0"; if(f==="0"){im.dataset.f="1";im.src="public/assets/gear2.svg";} else if(f==="1"){im.dataset.f="2";im.src="assets/gear2.svg";} else im.style.display="none";}}/>);
function AgentBadge({name}){ const {t}=useStore(); return (<span className="agent-badge">{GearIcon}<span>{name} · {t("autoBadge")}</span></span>); }
function KPI({label,value,sub,tone}){
  const color = tone==="good"?"var(--green)":tone==="bad"?"var(--danger)":tone==="warn"?"var(--amber)":"var(--ink)";
  return (<div className={"kpi"+(tone?" kpi-"+tone:"")}><div className="label">{label}</div>
    <div className="value" style={{color}}>{value}</div>{sub&&<div className="sub">{sub}</div>}</div>);
}
function Section({title,sub,right,children,className}){
  return (<div className={"card pad acc"+(className?" "+className:"")} style={{marginBottom:16}}>
    <div className="page-h" style={{marginBottom:sub?12:8}}>
      <div><h2 style={{fontSize:16}}>{title}</h2>{sub&&<div className="sub muted">{sub}</div>}</div>{right}</div>
    {children}</div>);
}
function Progress({v,color}){ return (<div className="progress"><span style={{width:Math.min(100,v*100)+"%",background:color||"var(--green)"}}/></div>); }
function PageHeader({title,sub,right,cls}){ return (<div className={"page-h"+(cls?" "+cls:"")}><div><h1>{title}</h1>{sub&&<div className="sub">{sub}</div>}</div>{right}</div>); }

/* =========================================================================
   Login (Balady SSO style)
   ========================================================================= */
const ROLE_KEYS = ["analyst","planner","leader"];
const Skyline = (
  <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="bldsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13796a"/><stop offset="0.55" stopColor="#0d5a4f"/><stop offset="1" stopColor="#093b35"/></linearGradient></defs>
    <rect width="1440" height="700" fill="url(#bldsky)"/>
    <circle cx="1180" cy="150" r="60" fill="#1aa07f" opacity="0.25"/>
    <g fill="#0c4a40"><rect x="40" y="420" width="120" height="280"/><rect x="200" y="360" width="90" height="340"/><rect x="330" y="300" width="70" height="400"/><rect x="430" y="440" width="110" height="260"/><rect x="580" y="250" width="60" height="450"/><rect x="660" y="330" width="100" height="370"/><rect x="800" y="280" width="80" height="420"/><rect x="900" y="420" width="120" height="280"/><rect x="1060" y="320" width="80" height="380"/><rect x="1170" y="380" width="100" height="320"/><rect x="1300" y="300" width="90" height="400"/></g>
    <g fill="#0f5a4c"><rect x="150" y="470" width="70" height="230"/><rect x="290" y="410" width="50" height="290"/><rect x="520" y="380" width="70" height="320"/><rect x="760" y="440" width="60" height="260"/><rect x="1010" y="470" width="60" height="230"/><rect x="1250" y="440" width="60" height="260"/></g>
  </svg>
);
function genCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<6;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function Login(){
  const {t,setUser,lang,setLang}=useStore();
  const [role,setRole]=useState("analyst");
  const [code,setCode]=useState(genCode);
  const [showPwd,setShowPwd]=useState(false);
  return (<div className="bld-login">
    <div className="bld-bg">{Skyline}</div>
    <img className="bld-photo" src="/assets/building.jpg" alt="" data-i="0"
      onError={e=>{const im=e.currentTarget; const c=["public/assets/building.jpg","assets/building.jpg"]; const i=+(im.dataset.i||0); if(i<c.length){im.dataset.i=i+1; im.src=c[i];} else im.style.display="none";}}/>
    <div className="bld-overlay"/>
    <div className="bld-center"><div className="bld-wrap"><div className="bld-row2">
      <div className="bld-brand-area">
        <div className="bld-logo">
          <img className="bld-logo-img" src="/assets/logo.png" alt="MoMAH" onError={e=>{const im=e.currentTarget,f=im.dataset.f||"0"; if(f==="0"){im.dataset.f="1";im.src="public/assets/logo.png";} else if(f==="1"){im.dataset.f="2";im.src="assets/logo.png";} else im.style.display="none";}}/>
          <span className="bld-logo-cap">{t("brandLine")}</span>
        </div>
        <h3 style={{color:"#fff"}}>{t("sso_title")}</h3>
        <p>{t("sso_sub")}</p>
      </div>
      <div className="bld-card-col"><div className="bld-card fade">
        <h2>{t("signInTitle")}</h2>
        <div className="bld-fg"><label>{t("identity")}</label>
          <div className="bld-inp"><span className="ic">👤</span>
            <select value={role} onChange={e=>setRole(e.target.value)}>{ROLE_KEYS.map(rk=><option key={rk} value={rk}>{t(rk+"_full")}</option>)}</select>
            <span className="caret">▾</span></div>
        </div>
        <div className="bld-fg"><label>{t("password")}</label>
          <div className="bld-inp has-eye"><span className="ic">🔒</span>
            <input type={showPwd?"text":"password"} value="********" readOnly/>
            <span className="eye" onClick={()=>setShowPwd(s=>!s)} title="Show/Hide">👁</span></div>
        </div>
        <div className="bld-hint">{t("loginHint")}</div>
        <div className="bld-captcha"><div className="bld-code"><span>{code}</span></div>
          <button className="bld-refresh" onClick={()=>setCode(genCode())} title="Refresh">⟳</button>
          <input placeholder={t("securityCode")} maxLength={6}/></div>
        <button className="bld-btn" onClick={()=>setUser(role)}>{t("login_btn")}</button>
        <div className="bld-or">{t("or_")}</div>
        <button className="bld-nic" onClick={()=>setUser(role)}>
          <div className="bld-nic-grid"><i className="g"/><i className="k"/><i className="o"/><i className="k"/><i className="g"/><i className="k"/><i className="o"/><i className="k"/><i className="g"/></div>
          <div><div className="l1">{t("nic1")}</div><div className="l2">{t("nic2")}</div></div></button>
        <div className="bld-create">{t("noAccount")} <button>{t("createAccount")}</button></div>
        <div className="bld-langrow"><button className="bld-lang2" onClick={()=>setLang(lang==="ar"?"en":"ar")}>{GlobeIcon} {lang==="ar"?"العربية / EN":"EN / العربية"}</button></div>
      </div></div>
    </div></div></div>
    <div className="bld-copy">{t("copyright")} · {t("syntheticData")}</div>
  </div>);
}

/* =========================================================================
   Top bar + sidebar + agent log
   ========================================================================= */
function CoverageSwitch(){
  const {t,cov,setCov}=useStore();
  return (<span style={{display:"inline-flex",alignItems:"center",gap:7}}>
    <span className="muted" style={{fontSize:12,fontWeight:600}}>{t("coverage")}:</span>
    <span className="cov">
      {["ministry","private","total"].map(c=>(
        <button key={c} className={cov===c?"on":""} onClick={()=>setCov(c)}>{t("cov_"+c)}</button>))}
    </span>
  </span>);
}
function TopBar(){
  const {t,lang,setLang,user,setUser,reset}=useStore();
  const [open,setOpen]=useState(false);
  return (<div className="topbar">
    <div className="brand">
      <img className="topbar-logo" src="/assets/logo.png" alt="MoMAH" onError={e=>{const im=e.currentTarget,f=im.dataset.f||"0"; if(f==="0"){im.dataset.f="1";im.src="public/assets/logo.png";} else if(f==="1"){im.dataset.f="2";im.src="assets/logo.png";} else im.style.display="none";}}/>
      <span className="topbar-sep"/>
      <span className="topbar-app">{t("appName")}</span>
    </div>
    <div className="right">
      <CoverageSwitch/>
      <button className="tbtn" onClick={()=>setLang(lang==="ar"?"en":"ar")}><img className="ic-lang" src="/assets/icon-language.svg" alt="" onError={e=>{const im=e.currentTarget,f=im.dataset.f||"0"; if(f==="0"){im.dataset.f="1";im.src="public/assets/icon-language.svg";} else if(f==="1"){im.dataset.f="2";im.src="assets/icon-language.svg";} else im.style.display="none";}}/> {lang==="ar"?"English":"العربية"}</button>
      <div className="usermenu">
        <button className="tbtn" onClick={()=>setOpen(o=>!o)}>{UserIcon} {t(user)} ▾</button>
        {open&&<div className="panel" onMouseLeave={()=>setOpen(false)}>
          <div style={{padding:"6px 8px",fontWeight:700}}>{t(user+"_full")}</div>
          <div style={{padding:"2px 8px 10px",fontSize:12}} className="muted">{t(user+"_desc")}</div>
          <div className="divider" style={{margin:"6px 0"}}/>
          <button className="btn ghost sm" style={{width:"100%",marginBottom:6}} onClick={()=>{reset();setOpen(false);}}>↺ {t("resetDemo")}</button>
          <button className="btn danger sm" style={{width:"100%"}} onClick={()=>setUser(null)}>⎋ {t("logout")}</button>
        </div>}
      </div>
    </div>
  </div>);
}
const NAV = {
  analyst:[["nav_hub","◧","hub"],["nav_chat","✦","chat"],["nav_monitor","◉","monitor"],["nav_macro","🌐","macro"],["nav_dev","🏗","dev"],["nav_policy","⚖","policy"],["nav_reports","📄","reports"]],
  planner:[["nav_hub","◧","hub"],["nav_chat","✦","chat"],["nav_macro","🌐","macro"],["nav_dev","🏗","dev"],["nav_policy","⚖","policy"],["nav_reports","📄","reports"]],
  leader:[["nav_cockpit","◧","cockpit"],["nav_macro","🌐","macro"],["nav_policy","⚖","policy"],["nav_eco","🤝","eco"],["nav_reports","📄","reports"]],
};
function Sidebar(){
  const {t,user,route,setRoute,alerts}=useStore();
  const openAlerts = alerts.filter(a=>!a.ack).length;
  return (<div className="sidebar">
    <div className="role"><div className="nm">{t(user+"_full")}</div><div className="rl">{t(user+"_desc").slice(0,42)}…</div></div>
    {NAV[user].map(([k,ic,r])=>{
      const badge = k==="nav_monitor"&&openAlerts;
      return (<div key={k} className={"navitem"+(route===r?" active":"")} onClick={()=>setRoute(r)}>
        <span className="ico">{ic}</span><span style={{flex:1}}>{t(k)}</span>
        {badge?<span className="badge-count">{badge}</span>:null}</div>);
    })}
  </div>);
}
function AgentLog(){
  const {t,log}=useStore();
  const last=log[0];
  return (<div className="agentlog">
    <span className="alh"><span className="live-dot"/>{t("agentlog_h")}</span>
    <span className="alline">{last? (<><b>{last.ts}</b> · {last.text}</>) : "—"}</span>
  </div>);
}

/* =========================================================================
   Orchestration chain (reused animation)
   ========================================================================= */
function OrchestrationChain({states,nodes}){
  const {t}=useStore();
  return (<div className="chain">
    {nodes.map((nd,i)=>{ const s=states[i]||"idle";
      const col=s==="done"?"var(--green)":s==="run"?"#6d5ae6":null;
      return (<div key={i} className={"node "+(s==="run"?"run":s==="done"?"done":"")}>
        <span className="node-dot" style={{background:col||"#cbd5d0"}}/>
        <span style={{flex:1,fontSize:13,fontWeight:600,color:col||"inherit",transition:"color .3s ease"}}>{nd.icon} {t(nd.k)}</span>
        <span className="st" style={{color:col||"var(--muted)"}}>{s==="run"?t("running"):s==="done"?("✓ "+t("done")):"—"}</span>
      </div>); })}
  </div>);
}

/* =========================================================================
   HUB
   ========================================================================= */
function EngineGrid(){
  const {t}=useStore();
  return (<div className="eng-grid">
    {ENGINES.map(e=>(<div key={e.key} className={"eng"+(e.key==="orch"?" orch":"")}>
      <div className="et">{e.icon} {t("eng_"+e.key)}</div>
      <div className="ed">{t("engd_"+e.key)}</div>
      <div className="es"><span className="pulse"/>{t("online")} · {e.lvl} · {t("autonomous")}</div>
    </div>))}
  </div>);
}
function SourceStrip(){
  const {t}=useStore();
  return (<div className="src11">
    {SOURCES11.map(s=>{ const col=s.status==="ok"?"var(--green)":s.status==="amber"?"var(--amber)":"var(--danger)";
      return (<div key={s.key} className="s" title={s.sla+" · "+s.fresh+"%"}>
        <div className="sk">{t("src_"+s.key)}</div><div className="sd" style={{background:col}}/></div>); })}
  </div>);
}
function Hub(){
  const {t,user,setRoute,cov,alerts,askOrchestrator}=useStore();
  const journeys=[
    {ic:"✦",col:"#2563eb",name:"j1_name",body:"j1_body",route:"chat"},
    {ic:"◉",col:"#e29700",name:"j2_name",body:"j2_body",route:"monitor"},
    {ic:"⚖",col:"#6d5ae6",name:"j3_name",body:"j3_body",route:"policy"},
  ];
  const open=alerts.filter(a=>!a.ack);
  return (<div className="fade">
    <PageHeader title={t("hub_hello")+" · "+t(user+"_full")} sub={t("hub_sub")}/>
    <div className="shock">
      <span className="si">⚡</span>
      <span className="stxt">{t("shock_banner")}</span>
      <button className="btn" onClick={()=>askOrchestrator("q_shock")}>✦ {t("runAssessment")}</button>
      <span className="spill">{t("brief_urgent")}</span>
    </div>
    <div className="cols-4" style={{marginBottom:16}}>
      <KPI label={t("k_resp")} value={t("k_resp_v")} sub={t("k_resp_s")} tone="good"/>
      <KPI label={t("k_alerts")} value={open.length} tone={open.length?"bad":"good"}/>
      <KPI label={t("k_cov")} value="13 / 13" sub={t("cov_"+cov)+" · "+COV_ACC[cov]+" "+t("cov_acc")}/>
      <KPI label={t("k_ready")} value="94%" tone="good"/>
    </div>
    <Section title={t("engines_title")}><EngineGrid/></Section>
    <Section title={t("sources_title")} right={<span className="chip">● 11 {t("live")}</span>}><SourceStrip/></Section>
    <Section title={t("journeys_title")}>
      <div className="cols-3">
        {journeys.map(j=>(<div key={j.route} className="card pad jcard" onClick={()=>setRoute(j.route)}>
          <div className="jh"><span className="jn" style={{background:j.col}}>{j.ic}</span><strong>{t(j.name)}</strong></div>
          <div className="jbody">{t(j.body)}</div>
          <div className="jgo">{t("open")} {ArrowIcon}</div>
        </div>))}
      </div>
    </Section>
    <Section title={t("latest_alerts")} right={<button className="btn secondary sm" onClick={()=>setRoute("monitor")}>{t("view")} {ArrowIcon}</button>}>
      {open.length===0? <div className="muted">{t("noAlerts")}</div> :
        open.slice(0,3).map(a=>(<div key={a.id} className="todo-row">
          <span className={"chip "+(a.sev==="red"?"danger":a.sev==="amber"?"amber":"info")}>{t("sev_"+a.sev)}</span>
          <div style={{flex:1,fontWeight:600,fontSize:13}}>{t(a.tk)}</div>
          {a.scn&&<button className="btn sm" onClick={()=>askOrchestrator(a.scn)}>✦ {t("askOrch")}</button>}
        </div>))}
    </Section>
  </div>);
}

/* =========================================================================
   J1 — Conversational analysis (centerpiece)
   ========================================================================= */
const SCN = {
  q_shock:{ type:"cross", engines:["orch","macro","demand","balance","plan","conv"],
    steps:[["orch","think_intent"],["macro","think_run"],["demand","think_run"],["balance","think_run"],["plan","think_run"],["orch","think_compose"]],
    answer:"a_shock", conf:88, srcs:["src_sakani","src_wafi","src_moj","src_gastat","src_sec","src_private","src_geo"],
    viz:"shock", report:"repName_brief", reportLabel:"gen_brief", brief:true, red:true,
    actions:[{lk:"view_macro",kind:"route",to:"macro"},{lk:"view_gap",kind:"run",to:"q_gap"},{lk:"view_dev",kind:"route",to:"dev"},{lk:"view_policy",kind:"route",to:"policy"}] },
  q_demand:{ type:"single", engines:["orch","demand"],
    steps:[["orch","think_intent"],["demand","think_route"],["demand","think_run"],["orch","think_compose"]],
    answer:"a_demand5", conf:91, srcs:["src_sakani","src_uc1","src_uc2","src_gastat"],
    viz:"segments", report:"repName_demand",
    actions:[{lk:"view_gap",kind:"run",to:"q_gap"}] },
  q_gap:{ type:"cross", engines:["orch","balance","plan"],
    steps:[["orch","think_intent"],["balance","think_route"],["balance","think_run"],["plan","think_run"],["orch","think_compose"]],
    answer:"a_gapHeat", conf:86, srcs:["src_wafi","src_private","src_moj","src_sec","src_geo"],
    viz:"heatmap", report:"repName_gap", red:true, mem:true,
    actions:[{lk:"view_dev",kind:"route",to:"dev"},{lk:"view_policy",kind:"route",to:"policy"}] },
  q_policy:{ type:"handoff", answer:null, actions:[] },
  q_vague:{ type:"escalate", engines:["orch"],
    steps:[["orch","think_intent"],["orch","think_perm"]], answer:"a_vague", actions:[] },
};
const SEG_COLORS={A:"#e32700",B:"#e29700",C:"#2563eb",D:"#6d5ae6",E:"#1B8354"};
function SegChart(){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  return (<div style={{width:"100%",height:220,marginTop:6}}><C.ResponsiveContainer>
    <C.LineChart data={SEG_FORECAST} margin={{top:6,right:12,left:-6,bottom:0}}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="y" tick={{fontSize:10}}/>
      <C.YAxis tick={{fontSize:10}} tickFormatter={v=>(v/1000)+"K"}/><C.Tooltip/>
      <C.Legend wrapperStyle={{fontSize:11}}/>
      {["A","B","C","D","E"].map(s=><C.Line key={s} type="monotone" dataKey={s} name={t("seg_"+s.toLowerCase())} stroke={SEG_COLORS[s]} strokeWidth={s==="A"||s==="B"?2.6:1.6} dot={false}/>)}
    </C.LineChart></C.ResponsiveContainer></div>);
}
function MigrationBars(){
  const {t}=useStore(); const max=Math.max(...MIGRATION.map(m=>m.v));
  return (<div style={{marginTop:8}}>
    <div style={{fontSize:12,fontWeight:700,color:"var(--muted)",marginBottom:6}}>{t("mig_title")}</div>
    {MIGRATION.map(m=>(<div key={m.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span className="mono" style={{width:44,fontSize:12,fontWeight:700}}>{m.k}</span>
      <div className="bar-mini" style={{flex:1}}><span style={{width:(m.v/max*100)+"%",background:m.k==="B→A"?"#e32700":"#e29700"}}/></div>
      <span className="mono" style={{fontSize:11.5,color:"var(--muted)",width:96,textAlign:"end"}}>{n0(m.v)} {t("households")}</span>
    </div>))}
  </div>);
}
function heatColor(v){ if(v<=-8000)return"#b42318"; if(v<=-3000)return"#e0683f"; if(v<0)return"#e6a23c"; if(v<=1000)return"#73b355"; return"#1B8354"; }
function GapHeatmap(){
  const {t}=useStore();
  return (<div style={{marginTop:8}}>
    <div className="scrollx"><table className="heat">
      <thead><tr><th></th>{GAP_HEAT.cols.map(c=><th key={c}>{t("seg_"+c.toLowerCase()).split(" ")[0]+" "+c}</th>)}</tr></thead>
      <tbody>{GAP_HEAT.rows.map(r=>(<tr key={r}>
        <td className="rh">{t("rg_"+r)||r}</td>
        {GAP_HEAT.data[r].map((v,i)=><td key={i} className="cell" style={{background:heatColor(v)}}>{v>0?"+":""}{n0(v)}</td>)}
      </tr>))}</tbody>
    </table></div>
    <div className="heat-legend"><span>{t("shortage")}</span><span className="heat-scale"/><span>{t("surplus")}</span></div>
  </div>);
}
function ShockFindings(){
  const {t}=useStore();
  const items=["−7% / −14% demand","18% B→A migration","Riyadh Seg A gap 12,400","pipeline covers 35%"];
  return (<div className="meta" style={{marginTop:4}}>{items.map((x,i)=><span key={i} className="chip danger">⚠ {x}</span>)}</div>);
}
function Viz({kind}){
  const {t}=useStore();
  if(kind==="segments") return (<><div style={{fontSize:12,fontWeight:700,marginTop:10,color:"var(--muted)"}}>{t("chart_segT")}</div><SegChart/><MigrationBars/></>);
  if(kind==="heatmap") return (<><div style={{fontSize:12,fontWeight:700,marginTop:10,color:"var(--muted)"}}>{t("heat_title")}</div><GapHeatmap/></>);
  if(kind==="shock") return <ShockFindings/>;
  return null;
}
/* ---- storyline compact visuals ---- */
function HistChart(){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  return (<div style={{width:"100%",height:200,marginTop:6}}><C.ResponsiveContainer>
    <C.LineChart data={HIST} margin={{top:6,right:8,left:-8,bottom:0}}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="q" tick={{fontSize:9}} interval={2}/>
      <C.YAxis yAxisId="u" tick={{fontSize:9}} tickFormatter={v=>(v/1000)+"K"} domain={[12000,17000]}/>
      <C.YAxis yAxisId="r" orientation="right" tick={{fontSize:9}} domain={[0,8]} tickFormatter={v=>v+"%"}/>
      <C.Tooltip/><C.Legend wrapperStyle={{fontSize:10}}/>
      <C.Line yAxisId="u" type="monotone" dataKey="rd" name={t("hist_rd")} stroke="#1B8354" strokeWidth={2.2} dot={false}/>
      <C.Line yAxisId="u" type="monotone" dataKey="rs" name={t("hist_rs")} stroke="#2563eb" strokeWidth={1.8} dot={false}/>
      <C.Line yAxisId="r" type="monotone" dataKey="r" name={t("hist_rate")} stroke="#e32700" strokeWidth={1.6} strokeDasharray="4 3" dot={false}/>
    </C.LineChart></C.ResponsiveContainer></div>);
}
function DataQualityMini(){
  const {t}=useStore();
  return (<div style={{marginTop:8}}>
    <SourceStrip/>
    <div className="meta" style={{marginTop:10}}>
      <span className="chip">{t("dq_score")}: 94.2/100</span>
      <span className="chip amber">DS-07 ⚠ 95% → 88%</span>
      <span className="chip gray">{t("dq_ticket")} · #DQ-2407</span>
    </div>
  </div>);
}
function MacroMini(){
  const {t}=useStore(); const C=RC;
  const corr=MACRO_CORR.map(m=>({name:t("ind_"+m.key),demand:m.demand,supply:m.supply,price:m.price}));
  return (<div style={{marginTop:8}}>
    <div className="mini-t">{t("corr_title")}</div>
    {C.ResponsiveContainer&&<div style={{width:"100%",height:175}}><C.ResponsiveContainer>
      <C.BarChart data={corr} margin={{top:4,right:8,left:-14,bottom:0}}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:8.5}} interval={0} angle={-18} textAnchor="end" height={44}/><C.YAxis domain={[0,1]} tick={{fontSize:9}}/>
        <C.Tooltip/><C.Legend wrapperStyle={{fontSize:9}}/><C.ReferenceLine y={0.6} stroke="#e32700" strokeDasharray="4 4"/>
        <C.Bar dataKey="demand" name={t("m_demandR")} fill="#2563eb" radius={[2,2,0,0]}/>
        <C.Bar dataKey="supply" name={t("m_supplyR")} fill="#e29700" radius={[2,2,0,0]}/>
        <C.Bar dataKey="price" name={t("m_priceR")} fill="#1B8354" radius={[2,2,0,0]}/>
      </C.BarChart></C.ResponsiveContainer></div>}
    <div className="mini-t">{t("econ_title")}</div>
    <div className="scrollx"><table className="tbl">
      <thead><tr><th></th>{ECON_SCN.map(s=><th key={s.k} className="right-num">{t("sc_"+s.k)} {s.prob}%</th>)}</tr></thead>
      <tbody>{[["p_rate","rate"],["p_inf","inf"],["p_unemp","unemp"],["p_gdp","gdp"]].map(([lk,f])=>(
        <tr key={f}><td>{t(lk)}</td>{ECON_SCN.map(s=><td key={s.k} className="right-num mono">{s[f]}</td>)}</tr>))}</tbody>
    </table></div>
    <div className="mini-t">{t("y1_title")}</div>
    <div className="scrollx"><table className="tbl">
      <thead><tr><th>{t("region")}</th><th className="right-num">{t("y1_demand")}</th><th className="right-num">{t("y1_price")}</th><th className="right-num">{t("y1_conv")}</th></tr></thead>
      <tbody>{Y1_IMPACT.map(r=>(<tr key={r.region}><td>{t("rg_"+r.region)}</td>
        <td className="right-num mono" style={{color:"var(--danger)",fontWeight:700}}>{r.demand}%</td>
        <td className="right-num mono" style={{color:"var(--danger)"}}>{r.price}%</td>
        <td className="right-num mono">{r.conv}</td></tr>))}</tbody>
    </table></div>
    <div className="mini-t">{t("vuln_title")}</div>
    <VulnChart h={300}/>
  </div>);
}
function PrePostBars(){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  const data=PREPOST.map(p=>({name:"Seg "+p.seg,pre:p.pre,post:p.pre+p.delta}));
  return (<div style={{marginTop:8}}>
    <div className="mini-t">{t("prepost_title")}</div>
    <div style={{width:"100%",height:165}}><C.ResponsiveContainer>
      <C.BarChart data={data} margin={{top:4,right:8,left:-12,bottom:0}}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:9}}/><C.YAxis tick={{fontSize:9}} tickFormatter={v=>(v/1000)+"K"}/><C.Tooltip/><C.Legend wrapperStyle={{fontSize:9}}/>
        <C.Bar dataKey="pre" name={t("pre_label")} fill="#9aa3ab" radius={[2,2,0,0]}/>
        <C.Bar dataKey="post" name={t("post_label")} fill="#e32700" radius={[2,2,0,0]}/>
      </C.BarChart></C.ResponsiveContainer></div>
  </div>);
}
function RootCauseBars(){
  const {t}=useStore();
  return (<div style={{marginTop:8}}>
    <div className="mini-t">{t("rootcause_title")}</div>
    {ROOTCAUSE.map(r=>(<div key={r.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
      <span style={{width:170,fontSize:11.5}}>{t(r.k)}</span>
      <div className="bar-mini" style={{flex:1}}><span style={{width:r.pct+"%",background:r.pct>=40?"#e32700":r.pct>=20?"#e29700":"#1B8354"}}/></div>
      <span className="mono" style={{fontSize:11.5,width:34,textAlign:"end",fontWeight:700}}>{r.pct}%</span>
    </div>))}
  </div>);
}
function ConvBars(){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  const data=PIPELINE.map(p=>({name:"Seg "+p.seg,conv:p.conv}));
  return (<div style={{marginTop:8}}>
    <div className="mini-t">{t("conv_title")} · {t("convTarget")}</div>
    <div style={{width:"100%",height:150}}><C.ResponsiveContainer>
      <C.BarChart data={data} margin={{top:4,right:8,left:-16,bottom:0}}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:9}}/><C.YAxis domain={[0,100]} tick={{fontSize:9}}/><C.Tooltip/>
        <C.ReferenceLine y={70} stroke="#1763a6" strokeDasharray="4 4"/>
        <C.Bar dataKey="conv" radius={[2,2,0,0]}>{PIPELINE.map((p,i)=><C.Cell key={i} fill={p.conv<60?"#e32700":p.conv>=75?"#1B8354":"#e29700"}/>)}</C.Bar>
      </C.BarChart></C.ResponsiveContainer></div>
  </div>);
}
function PipelineMini(){
  const {t}=useStore();
  return (<div style={{marginTop:8}}>
    <div className="scrollx"><table className="tbl">
      <thead><tr><th>{t("pl_seg")}</th><th className="right-num">{t("pl_proj")}</th><th className="right-num">{t("pl_conv")}</th><th className="right-num">{t("pl_deliver")}</th><th className="right-num">{t("pl_cover")}</th></tr></thead>
      <tbody>{PIPELINE.map(p=>(<tr key={p.seg}>
        <td><b>{t("seg_"+p.seg.toLowerCase()).split(" ")[0]} {p.seg}</b></td>
        <td className="right-num mono">{p.proj}</td>
        <td className="right-num mono" style={{color:p.conv<60?"var(--danger)":p.conv>=75?"var(--green-dark)":"var(--amber)",fontWeight:700}}>{p.conv}%</td>
        <td className="right-num mono">{n0(p.deliver)}</td>
        <td className="right-num">{p.cover==="surplus"?<span className="chip">{t("surplus")}</span>:<b style={{color:p.seg==="A"?"var(--danger)":"inherit"}}>{p.cover}</b>}</td>
      </tr>))}</tbody>
    </table></div>
    <div className="mini-t">{t("closure_title")}</div>
    {CLOSURE.map(c=>(<div key={c.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
      <span style={{width:150,fontSize:11.5}}>{t(c.k)}</span>
      <div className="bar-mini" style={{flex:1}}><span style={{width:c.v+"%",background:c.v>=80?"#1B8354":c.v>=55?"#e29700":"#e32700"}}/></div>
      <span className="mono" style={{fontSize:11.5,width:38,textAlign:"end",fontWeight:700}}>{c.v}%</span>
    </div>))}
  </div>);
}
function DevMini(){
  const {t}=useStore();
  const tiers=[["t1","immediate"],["t2","high"],["t3","medium"]];
  return (<div style={{marginTop:8}}>
    <div className="mini-t">{t("dev_score")}</div>
    <DevRadar h={260}/>
    <div className="scrollx" style={{marginTop:6}}><table className="tbl">
      <thead><tr><th>{t("tier_dev")}</th><th>{t("grade")}</th><th className="right-num">{t("score")}</th><th>{t("d_quality")}</th><th>{t("d_completion")}</th><th>{t("d_signing")}</th></tr></thead>
      <tbody>{DEVS.map(d=>(<tr key={d.name}>
        <td><b>{d.name}</b></td><td><span className={"dev-grade "+d.grade}>{d.grade}</span></td>
        <td className="right-num mono" style={{fontWeight:700}}>{d.score}</td>
        {["quality","completion","signing"].map(k=><td key={k}><div className="bar-mini"><span style={{width:d[k]+"%"}}/></div></td>)}
      </tr>))}</tbody>
    </table></div>
    <div className="mini-t">{t("tiers_title")}</div>
    {tiers.map(([tk,pri])=>(<div key={tk} className="rec" style={{padding:"8px 10px",marginBottom:6}}>
      <span className={"rp "+pri}>{t(tk)}</span>
      <div className="rbody" style={{fontSize:12}}>{t(tk+"d")} · {t(tk+"a")}{t(tk+"o")!=="—"?<b> → {t(tk+"o")}</b>:""}</div>
    </div>))}
  </div>);
}
function PolicyMini(){
  const {t}=useStore();
  return (<div style={{marginTop:8}}>
    <div className="ab-grid"><ABCard which="A"/><ABCard which="B"/></div>
    <div className="banner" style={{marginTop:10,background:"var(--danger-50)",borderColor:"#f0b4ad",color:"#7a241d"}}>⚠ {t("warnB")}</div>
  </div>);
}
function EngViz({kind}){
  const {t}=useStore();
  if(kind==="dq") return <DataQualityMini/>;
  if(kind==="macro") return <MacroMini/>;
  if(kind==="segments") return (<><div className="mini-t">{t("chart_segT")}</div><SegChart/><MigrationBars/><PrePostBars/></>);
  if(kind==="heatmap") return (<><div className="mini-t">{t("heat_title")}</div><GapHeatmap/><RootCauseBars/></>);
  if(kind==="pipeline") return (<><PipelineMini/><ConvBars/></>);
  if(kind==="dev") return <DevMini/>;
  if(kind==="policy") return <PolicyMini/>;
  return null;
}
function EngineCard({idx,loading}){
  const {t}=useStore(); const st=STORY[idx];
  const [sub,setSub]=useState(0);
  useEffect(()=>{ if(!loading){ setSub(0); return; } const id=setInterval(()=>setSub(s=>(s+1)%3),720); return ()=>clearInterval(id); },[loading]);
  return (<div className="msg bot"><div className="av">{st.icon}</div>
    <div className="bubble" style={{maxWidth:"100%",width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:loading?0:6}}>
        <b style={{fontSize:13.5}}>{st.icon} {t(st.name)}</b>
        <span className={"chip "+(loading?"info":"")}>{loading?("⟳ "+t("agent_running")):("✓ "+st.time)}</span>
      </div>
      {loading? <div className="ai-working" style={{margin:"4px 0 0"}}>✦ {t(st.name)} · {t("ws"+(sub+1))}</div> :
      <>
        <EngViz kind={st.viz}/>
        <div className="banner" style={{marginTop:10}}>💡 {t(st.f)}</div>
        <div className="meta"><span className="chip gray">{t("confidence")}: <b style={{marginInlineStart:4,color:"var(--green-dark)"}}>{st.conf}%</b></span></div>
      </>}
    </div></div>);
}

/* ---- downloadable ministerial briefing (mirrors the PDF) ---- */
function downloadBriefing(t, cov){
  const ref="DSO-2026-0619-URG-001";
  const row=(cells,h)=>"<tr>"+cells.map(c=>"<"+(h?"th":"td")+">"+c+"</"+(h?"th":"td")+">").join("")+"</tr>";
  const macroRows=MACRO_CORR.map(m=>row([t("ind_"+m.key),m.demand,m.supply,m.price])).join("");
  const segRows=SEG_FORECAST.map(r=>row([r.y,n0(r.A),n0(r.B),n0(r.C),n0(r.D),n0(r.E)])).join("");
  const heatRows=GAP_HEAT.rows.map(r=>row([t("rg_"+r),...GAP_HEAT.data[r].map(v=>(v>0?"+":"")+n0(v))])).join("");
  const pipeRows=PIPELINE.map(p=>row(["Seg "+p.seg,p.proj,n0(p.planned),p.conv+"%",n0(p.deliver),p.cover])).join("");
  const devRows=DEVS.map(d=>row([d.name,d.grade,d.score,d.quality,d.completion,d.timeliness,d.signing])).join("");
  const recRows=RECS.map((r,i)=>row([(i+1),t("pri_"+r.pri),t(r.k),t(r.owner+"_full"),r.deadline])).join("");
  const coreRows=CORE.map(c=>row([t("cf_"+c.sev),t(c.k)])).join("");
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${ref} — DSO Ministerial Briefing</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#16211c;max-width:900px;margin:0 auto;padding:32px;line-height:1.5}
.cover{background:linear-gradient(160deg,#0b3b34,#13796a);color:#fff;padding:48px 36px;border-radius:14px;text-align:center;margin-bottom:28px}
.cover h1{font-size:26px;margin:14px 0}.cover .meta{opacity:.85;font-size:13px;margin-top:18px}
.tag{display:inline-block;background:#e32700;color:#fff;font-size:11px;font-weight:800;border-radius:6px;padding:3px 10px;letter-spacing:.05em}
h2{color:#1B8354;border-bottom:2px solid #1B8354;padding-bottom:6px;margin-top:32px;font-size:18px}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin:12px 0}
th,td{border:1px solid #d7e2dc;padding:7px 9px;text-align:left}th{background:#eaf3ee;color:#0b3b34}
.warn{background:#fdf2f0;border:1px solid #f0b4ad;border-left:5px solid #e32700;color:#7a241d;padding:12px 14px;border-radius:8px;margin:14px 0}
.k{background:#f3f7f4;border-left:5px solid #1B8354;padding:12px 14px;border-radius:8px;margin:12px 0}
.muted{color:#5c6b63;font-size:12px}@media print{.noprint{display:none}}
.btn{background:#1B8354;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer}
</style></head><body>
<div class="cover"><div class="muted" style="color:#bfe3cf">Ministry of Municipalities &amp; Housing · Housing Support Agency</div>
<h1>Macro-Economic Impact Assessment<br>Interest Rate Hike (+50bps) · Riyadh &amp; Eastern Region</h1>
<span class="tag">URGENT · MINISTERIAL BRIEFING</span>
<div class="meta">Report ID: ${ref} · 19 June 2026 · Coverage: ${t("cov_"+cov)} · Confidence 88–95%<br>Analyst: Ahmed Al-Qahtani · Autonomous · human-reviewed</div></div>
<button class="btn noprint" onclick="window.print()">🖨 Print / Save as PDF</button>
<h2>1 · Executive Summary &amp; Key Findings</h2>
<p>An unexpected +50bps SAMA rate hike triggered this autonomous multi-engine assessment across Riyadh &amp; the Eastern Region over a 3-year horizon — generated in minutes versus 3–4 days historically.</p>
<table>${row([t("cf_crit").replace(t("cf_crit"),"Severity"),"Finding"],true)}${coreRows}</table>
<h2>2 · Macro-Economic Impact</h2>
<table>${row(["Indicator","R² Demand","R² Supply","R² Price"],true)}${macroRows}</table>
<p class="muted">Base-case Y1: Riyadh demand −7.2%, price/m² −4.1%, conversion 61% (−8pp).</p>
<h2>3 · Demand Forecast by Segment (Riyadh, 5-year)</h2>
<table>${row(["Year","Seg A","Seg B","Seg C","Seg D","Seg E"],true)}${segRows}</table>
<div class="k">18% Segment B→A migration (2,100 households) — a one-way structural shift; subsidy burden +22% (SAR 1.8B).</div>
<h2>4 · Supply-Demand Gap (region × segment, Y3 units)</h2>
<table>${row(["Region","Seg A","Seg B","Seg C","Seg D","Seg E"],true)}${heatRows}</table>
<h2>5 · Supply Pipeline &amp; Conversion (Riyadh)</h2>
<table>${row(["Segment","Projects","Planned","Conversion","Expected 3Y","Coverage"],true)}${pipeRows}</table>
<h2>6 · Developer Scorecard</h2>
<table>${row(["Developer","Grade","Score","Quality","Completion","Timeliness","Signing"],true)}${devRows}</table>
<p class="muted">Engagement: Tier-1 (Al-Majd, Riyadh Housing, Watan) negotiate now → 4,200 units/yr · Tier-2 +15% subsidy → +3,100 units/yr.</p>
<h2>7 · Policy Simulation — A vs B</h2>
<table>${row(["Metric","Policy A · Developer subsidy +15%","Policy B · Reduce down payment"],true)}
${row(["Supply impact","+3,100 units/yr","0"])}${row(["Demand impact","0","+18% (2,600 households)"])}
${row(["Gap closure (Y3)","49% → 85%","49% → 38%"])}${row(["Fiscal cost","SAR 2.4B/yr","SAR 1.6B/yr"])}
${row(["Risk","Low","High"])}${row(["Recommendation","✅ Execute","❌ Do not execute"])}</table>
<div class="warn"><b>Counter-indication — Policy B:</b> cutting the down payment adds +18% demand with zero new supply, widening the gap from 49% to 38%. Use rental assistance instead if relief is needed.</div>
<h2>8 · Strategic Recommendations (ranked)</h2>
<table>${row(["#","Priority","Action","Owner","Deadline"],true)}${recRows}</table>
<h2>9 · Efficiency</h2>
<table>${row(["Step","Old process","DSO platform"],true)}
${row(["Data check","4–6 hours","12 seconds"])}${row(["Full analysis","3–4 working days","1h 50m"])}
${row(["Report generation","Half day","38 seconds"])}${row(["Headcount","5 cross-dept","1 + AI"])}</table>
<p class="muted" style="margin-top:24px">Generated by the DSO Agentic AI Platform · synthetic demo data · ${new Date().toLocaleString("en-GB")}</p>
</body></html>`;
  try{
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="DSO_Ministerial_Briefing.html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){ window.print(); }
}
// Orchestrator status — fixed-width element in the chat header. Idle: badge + grey nodes + "auto";
// running: same footprint with nodes lighting up + "x/7 · <engine>". Width stays constant.
function StoryStepper({states}){
  const {t}=useStore();
  const st = states || STORY.map(()=>"idle");
  const done=st.filter(s=>s==="done").length;
  const cur=st.findIndex(s=>s==="run");
  const cap = !states ? t("autonomous")
            : cur>=0 ? (done+"/"+STORY.length+" · "+t(STORY[cur].name))
            : (done>=STORY.length ? ("✓ "+t("agent_done")) : (done+"/"+STORY.length));
  return (<div className="stepper">
    <span className="stepper-badge">{GearIcon}{t("eng_orch")}</span>
    <div className="stepper-nodes">
      {STORY.map((eng,i)=>(<React.Fragment key={i}>
        {i>0&&<span className={"stepper-line"+(st[i-1]==="done"?" on":"")}/>}
        <span className={"stepper-node "+(st[i]||"idle")} title={t(eng.name)}>{st[i]==="done"?"✓":eng.icon}</span>
      </React.Fragment>))}
    </div>
    <span className="stepper-cap" title={cap}>{cap}</span>
  </div>);
}
function ChatAnalysis(){
  const {t,cov,setRoute,pushLog,addReport,seed,clearSeed}=useStore();
  const [msgs,setMsgs]=useState([]);
  const [busy,setBusy]=useState(false);
  const [input,setInput]=useState("");
  const [storyStates,setStoryStates]=useState(null);
  const scrollRef=useRef(null);
  const idRef=useRef(0);
  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs,busy]);

  function push(m){ idRef.current+=1; const id=idRef.current; setMsgs(prev=>[...prev,{id,...m}]); return id; }
  function run(scnId){
    if(busy) return;
    const scn=SCN[scnId]; if(!scn) return;
    setStoryStates(null);
    push({role:"user",text:t(scnId)});
    if(scn.type==="handoff"){ pushLog("log_policy"); setTimeout(()=>setRoute("policy"),500);
      push({role:"bot",type:"text",text:t("a_demand")? "↪ "+t("nav_policy") : ""}); return; }
    setBusy(true);
    pushLog(scn.type==="cross"?"log_cross":scn.type==="escalate"?"log_route":"log_route");
    const thinkId=push({role:"bot",type:"think",scn:scnId,steps:scn.steps.map(s=>({eng:s[0],k:s[1],st:"idle"})),i:0});
    let i=0;
    const tick=()=>{
      setMsgs(prev=>prev.map(m=>{ if(m.id!==thinkId) return m;
        const steps=m.steps.map((s,idx)=> idx<i?{...s,st:"ok"}: idx===i?{...s,st:"run"}:s ); return {...m,steps}; }));
      i+=1;
      if(i<=scn.steps.length){ setTimeout(tick,640); }
      else {
        setMsgs(prev=>prev.map(m=> m.id===thinkId?{...m,steps:m.steps.map(s=>({...s,st:"ok"}))}:m));
        setBusy(false);
        if(scn.type==="escalate"){ push({role:"bot",type:"escalate",scn:scnId}); }
        else { push({role:"bot",type:"answer",scn:scnId}); if(scn.report){ pushLog("log_route"); } }
      }
    };
    setTimeout(tick,500);
  }
  function genReport(scnId){
    const scn=SCN[scnId]; const ref=scn.brief?"DSO-2026-0619-URG-001":refNo();
    addReport({ ref, nameKey:scn.report, cov, conf:scn.conf });
    push({role:"bot",type:"report",scn:scnId,ref});
    pushLog("log_report",ref);
  }
  // progressive multi-agent storyline: question → agents stream in one-by-one → summary
  function runStory(){
    if(busy) return;
    setStoryStates(STORY.map(()=>"idle"));
    push({role:"user",text:t("q_shock")});
    setBusy(true); pushLog("log_cross");
    push({role:"bot",type:"text",text:"✦ "+t("plan_title")+" — "+t("story_intro")});
    const setSt=(i,v)=>setStoryStates(prev=>{ const n=[...(prev||STORY.map(()=>"idle"))]; n[i]=v; return n; });
    const step=(i)=>{
      if(i>=STORY.length){ setTimeout(()=>{ push({role:"bot",type:"summary"}); setBusy(false); pushLog("log_report"); },900); return; }
      setSt(i,"run"); pushLog("log_route");
      const eid=push({role:"bot",type:"engine",idx:i,loading:true});
      setTimeout(()=>{ setMsgs(prev=>prev.map(m=>m.id===eid?{...m,loading:false}:m)); setSt(i,"done"); setTimeout(()=>step(i+1),900); }, STORY[i].dur);
    };
    setTimeout(()=>step(0),650);
  }
  function runHistory(){
    if(busy) return;
    setStoryStates(null);
    push({role:"user",text:t("q_history")});
    setBusy(true); pushLog("log_route");
    setTimeout(()=>{ push({role:"bot",type:"hist"}); setBusy(false); },900);
  }
  function go(id){ if(id==="q_shock") runStory(); else if(id==="q_history") runHistory(); else run(id); }
  function freeSend(){
    const q=input.trim().toLowerCase(); setInput("");
    if(!q) return;
    let id="q_vague";
    if(/rate|interest|bps|利率|加息|فائدة|shock|冲击/.test(q)) id="q_shock";
    else if(/histor|历史|تاريخ|5 ?year|五年/.test(q)) id="q_history";
    else if(/gap|缺口|فجوة|supply|供给|عرض/.test(q)) id="q_gap";
    else if(/demand|趋势|需求|طلب|trend|segment|客群|段/.test(q)) id="q_demand";
    else if(/financ|融资|政策|policy|تمويل|سياسة/.test(q)) id="q_policy";
    else { push({role:"user",text:input||q}); push({role:"bot",type:"text",text:t("a_vague")}); return; }
    go(id);
  }
  useEffect(()=>{ if(seed){ go(seed); clearSeed(); } /* eslint-disable-next-line */ },[seed]);

  const presets=["q_shock","q_history","q_demand","q_gap","q_vague"];
  return (<div className="fade">
    <PageHeader title={t("nav_chat")} sub={t("chat_sub")} cls="ph-end" right={<StoryStepper states={storyStates}/>}/>
    <div className="card pad" style={{display:"flex",flexDirection:"column"}}>
      <div className="preset-row">
        <span className="muted" style={{fontSize:12,fontWeight:700,alignSelf:"center"}}>{t("presets")}</span>
        {presets.map(p=><button key={p} className={"preset"+(p==="q_vague"?" alt":p==="q_shock"?"":"")} onClick={()=>go(p)} disabled={busy}>{p==="q_shock"?"⚡ ":""}{t(p).length>40?t(p).slice(0,38)+"…":t(p)}</button>)}
      </div>
      <div className="chat-wrap">
        <div className="chat-scroll" ref={scrollRef}>
          {msgs.length===0&&<div className="muted" style={{textAlign:"center",margin:"30px 0",fontSize:13}}>✦ {t("chat_sub")}</div>}
          {msgs.map(m=><Msg key={m.id} m={m} onGenReport={genReport} onRoute={setRoute} onRun={run}/>)}
        </div>
        <div className="chat-input">
          <input className="input" placeholder={t("chat_ph")} value={input} disabled={busy}
            onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")freeSend();}}/>
          <button className="btn" onClick={freeSend} disabled={busy}>{busy?t("running"):t("send")}</button>
        </div>
      </div>
    </div>
  </div>);
}
function Msg({m,onGenReport,onRoute,onRun}){
  const {t,cov}=useStore();
  if(m.role==="user") return (<div className="msg user"><div className="av">{UserIcon}</div><div className="bubble">{m.text}</div></div>);
  // bot variants
  if(m.type==="text") return (<div className="msg bot"><div className="av">✦</div><div className="bubble">{m.text}</div></div>);
  if(m.type==="plan"){
    return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{maxWidth:"100%",width:"100%"}}>
      <b style={{fontSize:13}}>{t("plan_title")}</b>
      <div className="muted" style={{fontSize:12,margin:"4px 0 10px"}}>{t("story_intro")}</div>
      <OrchestrationChain states={m.states} nodes={STORY.map(s=>({k:s.name,icon:s.icon}))}/>
    </div></div>);
  }
  if(m.type==="engine") return <EngineCard idx={m.idx} loading={m.loading}/>;
  if(m.type==="hist"){
    return (<div className="msg bot"><div className="av">📊</div><div className="bubble" style={{maxWidth:"100%",width:"100%"}}>
      <b style={{fontSize:13}}>{t("hist_title")}</b><HistChart/>
      <div className="banner" style={{marginTop:8}}>💡 {t("hist_insight")}</div>
    </div></div>);
  }
  if(m.type==="summary"){
    return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{maxWidth:"100%",width:"100%"}}>
      <span className="brief-tag">⚡ {t("brief_urgent")}</span>
      <b style={{fontSize:13.5}}>{t("sum_title")}</b>
      <div className="muted" style={{fontSize:12.5,margin:"4px 0 10px"}}>{t("sum_intro")}</div>
      <div style={{fontWeight:700,fontSize:12,color:"var(--muted)",marginBottom:6}}>{t("core_findings")}</div>
      {CORE.map((c,i)=>(<div key={i} className="todo-row" style={{padding:"8px 6px"}}>
        <span className={"chip "+(c.sev==="crit"?"danger":c.sev==="high"?"amber":"")}>{t("cf_"+c.sev)}</span>
        <div style={{flex:1,fontSize:12.5}}>{t(c.k)}</div></div>))}
      <button className="btn" style={{marginTop:12}} onClick={()=>onGenReport("q_shock")}>📄 {t("genBrief2")}</button>
    </div></div>);
  }
  if(m.type==="think"){
    return (<div className="msg bot"><div className="av">✦</div><div className="bubble"><div className="think">
      {m.steps.map((s,i)=>(<div key={i} className={"tl"+(s.st==="run"?" act":s.st==="ok"?" ok":"")}>
        <span className="ti">{s.st==="ok"?"✓":s.st==="run"?"⟳":"○"}</span>
        <span>{t(s.k)}{s.eng&&s.eng!=="orch"?(" · "+t("eng_"+s.eng)):""}</span></div>))}
    </div></div></div>);
  }
  if(m.type==="escalate"){
    const scn=SCN[m.scn];
    return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{borderColor:"#ecdcae",background:"var(--amber-50)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span className="chip amber">⚖ {t("escalated")}</span><b style={{fontSize:12.5}}>{t("esc_perm")}</b></div>
      <div>{t(scn.answer)}</div>
    </div></div>);
  }
  if(m.type==="report"){
    const scn=SCN[m.scn];
    return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{padding:0,border:"none",boxShadow:"none",background:"transparent",maxWidth:"100%"}}>
      <div className={"report-card"+(scn.brief?" brief":"")}>
        <div className="rch"><span className="rt">📄 {t(scn.report)}</span><span className="chip" style={{background:"rgba(255,255,255,.2)",color:"#fff"}}>{scn.brief?t("brief_urgent"):t("cov_"+cov)}</span></div>
        <div className="rcb">
          <div className="report-row"><span className="muted">{t("refNo")}</span><b className="mono">{m.ref}</b></div>
          <div className="report-row"><span className="muted">{t("coverageMode")}</span><span>{t("cov_"+cov)} · {COV_ACC[cov]}</span></div>
          <div className="report-row"><span className="muted">{t("confidence")}</span><span style={{color:"var(--green-dark)",fontWeight:700}}>{scn.conf}%</span></div>
          <div className="report-row"><span className="muted">{t("generated")}</span><span>{nowStr("en")} · {t("autonomous_note")}</span></div>
          <button className="btn sm" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={()=>scn.brief?downloadBriefing(t,cov):window.print()}>⬇ {scn.brief?t("downloadBrief"):t("download")}</button>
        </div>
      </div>
    </div></div>);
  }
  // answer
  const scn=SCN[m.scn];
  function doAction(a){ if(a.kind==="run") onRun(a.to); else onRoute(a.to); }
  return (<div className="msg bot"><div className="av">✦</div><div className="bubble">
    {scn.brief&&<span className="brief-tag">⚡ {t("brief_urgent")}</span>}
    {scn.mem&&<span className="chip info" style={{marginBottom:6}}>🧠 {t("memory")}</span>}
    {scn.type==="cross"&&!scn.brief&&<div className="banner" style={{marginBottom:8}}>✦ {t("cross_note")}</div>}
    <div>{t(scn.answer)}</div>
    {scn.viz&&<Viz kind={scn.viz}/>}
    {scn.red&&scn.viz==="heatmap"&&<div className="banner" style={{marginTop:8,background:"var(--danger-50)",borderColor:"#f0b4ad",color:"#7a241d"}}>⚠ {t("gapRed")}</div>}
    <div className="meta">
      <span className="chip gray">{t("confidence")}: <b style={{marginInlineStart:4,color:"var(--green-dark)"}}>{scn.conf}%</b></span>
      {scn.engines.filter(e=>e!=="orch").map(e=><span key={e} className="chip">{t("eng_"+e)}</span>)}
      <span className="chip gray">{t("sources")}: {scn.srcs.length}</span>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
      {scn.report&&<button className="btn sm" onClick={()=>onGenReport(m.scn)}>📄 {t(scn.reportLabel||"genReport")}</button>}
      {(scn.actions||[]).map((a,i)=><button key={i} className="btn secondary sm" onClick={()=>doAction(a)}>{t(a.lk)} {ArrowIcon}</button>)}
    </div>
  </div></div>);
}

/* =========================================================================
   J2 — Monitoring & early warning
   ========================================================================= */
function Monitoring(){
  const {t,alerts,ackAlert,raiseGapAlert,askOrchestrator,pushLog,lang}=useStore();
  const [scanning,setScanning]=useState(false);
  const [lastScan,setLastScan]=useState(nowStr(lang));
  function scan(){ if(scanning) return; setScanning(true); pushLog("log_scan");
    setTimeout(()=>{ setScanning(false); setLastScan(nowStr(lang)); raiseGapAlert(); pushLog("log_alert"); },1900);
  }
  const open=alerts.filter(a=>!a.ack);
  return (<div className="fade">
    <PageHeader title={t("nav_monitor")} sub={t("mon_sub")} right={<span className="sect-right">
      <AgentBadge name={t("eng_demand")}/>
      <button className="btn" onClick={scan} disabled={scanning}>{scanning?t("scanning"):("◉ "+t("runScan"))}</button>
    </span>}/>
    {scanning&&<div className="scan-bar" style={{marginBottom:14}}><span/></div>}
    <div className="banner" style={{marginBottom:14}}>⚠ {t("dq_degraded")} · {t("dq_ticket")} (#DQ-2407)</div>
    <Section title={t("srcHealth")} sub={t("lastScan")+": "+lastScan} right={<span className="sect-right"><span className="chip">{t("dq_score")}: 94.2/100</span><span className="chip">9 / 11 ●</span></span>}>
      <div className="mon-grid">
        {SOURCES11.map(s=>{ const tone=s.status==="ok"?"":s.status==="amber"?"amber":"red";
          const col=s.status==="ok"?"var(--green)":s.status==="amber"?"var(--amber)":"var(--danger)";
          return (<div key={s.key} className={"mon "+tone}>
            <div className="mh"><span className="mname">{t("src_"+s.key)}</span><span className="dot" style={{background:col}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:4}}><span className="muted">{t("freshness")}</span><span className="mono">{s.fresh}%</span></div>
            <Progress v={s.fresh/100} color={col}/>
            <div className="muted" style={{fontSize:11,marginTop:6}}>{s.sla} · {s.status==="ok"?t("within"):t("delayed")}</div>
          </div>); })}
      </div>
    </Section>
    <Section title={t("alerts")} right={<span className={"chip "+(open.length?"danger":"")}>{open.length} {t("live")}</span>}>
      {alerts.length===0? <div className="muted">{t("noAlerts")}</div> :
        alerts.map(a=>(<div key={a.id} className={"mon "+(a.sev==="red"?"red":a.sev==="amber"?"amber":"")} style={{marginBottom:10}}>
          <div className="mh">
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span className={"chip "+(a.sev==="red"?"danger":a.sev==="amber"?"amber":"info")}>{t("sev_"+a.sev)}</span>
              <strong style={{fontSize:13}}>{t(a.tk)}</strong>
            </span>
            <span className="muted" style={{fontSize:11}}>{a.ts}</span>
          </div>
          <div style={{fontSize:12.5,marginBottom:8}}><b>{t("rootCause")}:</b> {t(a.bk)}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {a.scn&&<button className="btn sm" onClick={()=>askOrchestrator(a.scn)}>✦ {t("askOrch")}</button>}
            {!a.ack? <button className="btn secondary sm" onClick={()=>ackAlert(a.id)}>✓ {t("ack")}</button> : <span className="chip">✓ {t("acked")}</span>}
          </div>
        </div>))}
    </Section>
  </div>);
}

/* =========================================================================
   J3 — Policy simulation (Policy A vs Policy B + ranked recommendations)
   ========================================================================= */
const POL_NODES=[{k:"think_intent",icon:"✦"},{k:"eng_demand",icon:"📈"},{k:"eng_plan",icon:"🏗"},{k:"runAB",icon:"⚖"}];
function ABCard({which}){
  const {t}=useStore(); const d=POLICY_AB[which]; const good=which==="A";
  const rows=[
    ["m_gapclose", d.gapClose+"%", good?"var(--green-dark)":"var(--danger)"],
    ["m_demandImp", (d.demand>0?"+":"")+d.demand+"%", d.demand>0?"var(--danger)":"var(--muted)"],
    ["m_supplyImp", d.supply>0?("+"+n0(d.supply)):"0", d.supply>0?"var(--green-dark)":"var(--danger)"],
    ["m_cost", "SAR "+d.cost+"B", "var(--ink)"],
    ["m_risk", t("risk_"+d.risk), d.risk==="low"?"var(--green-dark)":"var(--danger)"],
  ];
  return (<div className={"ab "+(good?"good":"bad")}>
    <div className="abh"><span className="abt">{t(good?"policyA":"policyB")}</span>
      <span className={"chip "+(good?"":"danger")}>{t(good?"recommended":"counter")}</span></div>
    <div className="muted" style={{fontSize:11.5,marginBottom:6}}>{t(good?"pa_kind":"pb_kind")}</div>
    {rows.map(([lk,val,col])=>(<div key={lk} className="abrow"><span className="muted">{t(lk)}</span><span className="abv" style={{color:col}}>{val}</span></div>))}
  </div>);
}
function PolicySim(){
  const {t,pushLog,addReport,cov,user,setRoute}=useStore();
  const [chain,setChain]=useState(["idle","idle","idle","idle"]);
  const [busy,setBusy]=useState(false);
  const [ran,setRan]=useState(false);
  const [fed,setFed]=useState(false);
  const [feeding,setFeeding]=useState(false);
  function runSim(){ if(busy) return; setBusy(true); setFed(false); setRan(false); pushLog("log_policy");
    [0,1,2,3].forEach(i=>{
      setTimeout(()=>setChain(c=>{const n=[...c];n[i]="run";return n;}),i*430);
      setTimeout(()=>{ setChain(c=>{const n=[...c];n[i]="done";return n;}); if(i===3){ setBusy(false); setRan(true); } },i*430+360);
    });
  }
  function feed(){ if(feeding||!ran) return; setFeeding(true);
    setTimeout(()=>{ setFeeding(false); setFed(true); pushLog("log_feed");
      addReport({ ref:refNo(), nameKey:"repName_policy", cov, conf:85 });
    },1500);
  }
  return (<div className="fade">
    <PageHeader title={t("nav_policy")} sub={t("polAB_sub")} right={<AgentBadge name={t("eng_balance")}/>}/>
    <Section title={t("nav_policy")} right={<button className="btn" onClick={runSim} disabled={busy}>{busy?t("simulating"):("⚖ "+t("runAB"))}</button>}>
      {busy&&<div className="ai-working" style={{marginBottom:8}}>✦ {t("simulating")}</div>}
      <OrchestrationChain states={chain} nodes={POL_NODES}/>
    </Section>
    {!ran? <div className="card pad muted" style={{minHeight:120,display:"grid",placeItems:"center"}}>⚖ {t("runAB")}</div> :
    <>
      <Section title={t("polAB_sub")} sub={t("impactNote")}>
        <div className="ab-grid"><ABCard which="A"/><ABCard which="B"/></div>
        <div className="alert-strong" style={{marginTop:14}}>
          <span className="alert-ico">⚠</span>
          <div style={{flex:1}}><div className="alert-title">{t("warnB_t")} · {t("policyB")}</div><div className="alert-body">{t("warnB")}</div></div>
        </div>
      </Section>
      <Section title={t("recs_title")} right={<span className="chip gray">{t("confidence")}: 85%</span>}>
        {RECS.map((r,i)=>(<div key={i} className="rec">
          <span className={"rp "+r.pri}>{t("pri_"+r.pri)}</span>
          <div className="rbody">{t(r.k)}
            <div className="rmeta"><span>{t("owner")}: <b>{t(r.owner+"_full")}</b></span><span>{t("deadline")}: {r.deadline}</span></div>
          </div>
        </div>))}
        <button className="btn btn-ai" style={{marginTop:8,width:"100%",justifyContent:"center"}} onClick={feed} disabled={feeding||fed}>
          {fed?("✓ "+t("fed")):feeding?("… "+t("feeding")):("🤝 "+t("feedEco"))}</button>
        {fed&&<div className="eco" style={{marginTop:14}}>
          <div className="node-box dso flash"><b>{t("eco_dso")}</b></div><span className="arrow">→</span>
          <div className="node-box flash">{t("eco_copilot")}</div><span className="arrow">→</span>
          <div className="node-box flash">{t("eco_h03")}</div>
        </div>}
      </Section>
    </>}
  </div>);
}

/* =========================================================================
   Reports
   ========================================================================= */
function Modal({title,onClose,children,wide}){
  return (<div className="modal-ov" onClick={onClose}>
    <div className={"modal-box fade"+(wide?" wide":"")} onClick={e=>e.stopPropagation()}>
      <div className="modal-head"><h3>{title}</h3><button className="modal-x" onClick={onClose} aria-label="close">✕</button></div>
      <div className="modal-body">{children}</div>
    </div></div>);
}
const REPORTS_META=[
  {id:"weekly",   icon:"⚡", color:"#2563eb", nameKey:"rp_weekly",   ref:"DSO-WR-2026-W25", date:"22 Jun 2026 · 06:00", cov:"ministry"},
  {id:"monthly",  icon:"📊", color:"#059669", nameKey:"rp_monthly",  ref:"DSO-MR-2026-06",  date:"01 Jul 2026 · 06:00", cov:"total"},
  {id:"quarterly",icon:"🏛", color:"#7c3aed", nameKey:"rp_quarterly",ref:"DSO-QR-2026-Q2",  date:"30 Jun 2026 · 09:35", cov:"total"},
];
const HEALTH_EVENTS=[
  {sev:"error", k:"he_moj",     dk:"he_moj_d"},
  {sev:"warn",  k:"he_anom",    dk:"he_anom_d"},
  {sev:"warn",  k:"he_conv",    dk:"he_conv_d"},
  {sev:"error", k:"he_timeout", dk:"he_timeout_d"},
  {sev:"warn",  k:"he_stale",   dk:"he_stale_d"},
];
// seed a rich real-time log: mostly healthy info ticks, with the occasional clickable unhealthy event
const LOG_NORMAL=["log_scan","log_route","log_cross","log_idle","log_idle","log_feed","log_policy",
  ["log_report","DSO-WR-2026-W25"],["log_report","DSO-MR-2026-06"],["log_route"]];
function seedLog(t){
  const out=[]; const base=Date.now(); let off=0;
  for(let i=0;i<34;i++){
    const ts=new Date(base-off*1000).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    off += 4+Math.floor(Math.random()*9);
    if(i>0 && i%5===0){ const ev=HEALTH_EVENTS[((i/5)-1)%HEALTH_EVENTS.length]; out.push({ts,text:t(ev.k),health:ev}); }
    else { const n=LOG_NORMAL[Math.floor(Math.random()*LOG_NORMAL.length)];
      out.push({ts, text: Array.isArray(n)? (t(n[0])+" "+n[1]) : t(n)}); }
  }
  return out;
}
function decodeReport(id){ try{ return decodeURIComponent(escape(window.atob(REPORTS_B64[id]||""))); }catch(e){ try{ return window.atob(REPORTS_B64[id]||""); }catch(e2){ return ""; } } }
function downloadReport(id){
  try{ const html=decodeReport(id); const blob=new Blob([html],{type:"text/html;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="DSO_"+id+"_report.html"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){ window.print(); }
}
function Reports(){
  const {t,reports,log,cov}=useStore();
  const [preview,setPreview]=useState(null);
  const [health,setHealth]=useState(null);
  const pr=preview?REPORTS_META.find(x=>x.id===preview):null;
  return (<div className="fade reports-page">
    <PageHeader title={t("nav_reports")} sub={t("rep_sub")} right={<AgentBadge name={t("eng_orch")}/>}/>
    <Section title={t("periodic_title")} right={<span className="chip">{REPORTS_META.length} {t("live")}</span>}>
      <div className="scrollx"><table className="tbl">
        <thead><tr><th>{t("rep_title")}</th><th>{t("rep_ref")}</th><th>{t("rep_cov")}</th><th>{t("rep_time")}</th><th></th></tr></thead>
        <tbody>{REPORTS_META.map(r=>(<tr key={r.id} style={{cursor:"pointer"}} onClick={()=>setPreview(r.id)}>
          <td><span style={{color:r.color,fontWeight:700}}>{r.icon} {t(r.nameKey)}</span></td>
          <td className="mono"><span className="wo">{r.ref}</span></td>
          <td><span className="chip gray">{t("cov_"+r.cov)}</span></td>
          <td className="muted" style={{whiteSpace:"nowrap"}}>{r.date}</td>
          <td className="right-num" style={{whiteSpace:"nowrap"}}>
            <button className="btn secondary sm" onClick={e=>{e.stopPropagation();setPreview(r.id);}}>👁 {t("preview")}</button>
            <button className="btn sm" style={{marginInlineStart:6}} onClick={e=>{e.stopPropagation();downloadReport(r.id);}}>⬇</button>
          </td>
        </tr>))}</tbody>
      </table></div>
    </Section>
    {reports.length>0&&<Section title={t("generated_title")}>
      <div className="scrollx"><table className="tbl">
        <thead><tr><th>{t("rep_ref")}</th><th>{t("rep_title")}</th><th>{t("rep_cov")}</th><th className="right-num">{t("rep_conf")}</th><th>{t("rep_time")}</th><th></th></tr></thead>
        <tbody>{reports.map((r,i)=>(<tr key={i}>
          <td className="mono"><span className="wo">{r.ref}</span></td><td>{t(r.nameKey)}</td>
          <td><span className="chip gray">{t("cov_"+r.cov)}</span></td>
          <td className="right-num mono" style={{color:"var(--green-dark)",fontWeight:700}}>{r.conf}%</td>
          <td className="muted" style={{whiteSpace:"nowrap"}}>{r.time}</td>
          <td className="right-num"><button className="btn sm" onClick={()=>window.print()}>⬇</button></td>
        </tr>))}</tbody>
      </table></div>
    </Section>}
    <Section className="logsection" title={t("agentLog")} right={<span className="chip"><span className="live-dot" style={{marginInlineEnd:4}}/>{t("live")}</span>}>
      <div className="loglist">
        {log.slice(0,40).map((l,i)=> l.health
          ? (<div key={i} className={"logrow "+l.health.sev} onClick={()=>setHealth(l.health)} title={t("viewDetail")}>
              <span className={"chip logchip "+(l.health.sev==="error"?"danger":"amber")}>{l.health.sev==="error"?"✕":"⚠"} {t("sev_"+(l.health.sev==="error"?"red":"amber"))}</span>
              <span className="logtext" style={{fontWeight:600}}>{l.text}</span>
              <span className="muted logts">{l.ts}</span>
              <span className="logmore">{t("viewDetail")} →</span>
            </div>)
          : (<div key={i} className="logrow info">
              <span className="dot logdot" style={{background:"var(--green)"}}/>
              <span className="logtext muted">{l.text}</span>
              <span className="muted logts">{l.ts}</span>
              <span className="logmore" aria-hidden="true"/>
            </div>)
        )}
        {log.length===0&&<div className="muted">{t("noItems")}</div>}
      </div>
    </Section>
    {pr&&<Modal wide title={<span style={{color:pr.color}}>{pr.icon} {t(pr.nameKey)}</span>} onClose={()=>setPreview(null)}>
      <iframe title="report" srcDoc={decodeReport(preview)} style={{width:"100%",height:"66vh",border:"1px solid var(--line)",borderRadius:8,background:"#fff"}}/>
      <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
        <button className="btn secondary" onClick={()=>setPreview(null)}>{t("close")}</button>
        <button className="btn" onClick={()=>downloadReport(preview)}>⬇ {t("download")}</button>
      </div>
    </Modal>}
    {health&&<Modal title={<span className="sect-right"><span className={"chip "+(health.sev==="error"?"danger":"amber")}>{health.sev==="error"?"✕":"⚠"}</span> {t(health.k)}</span>} onClose={()=>setHealth(null)}>
      <div style={{fontSize:13.5,lineHeight:1.75}}>{t(health.dk)}</div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><button className="btn secondary" onClick={()=>setHealth(null)}>{t("close")}</button></div>
    </Modal>}
  </div>);
}

/* =========================================================================
   Cockpit (leader) + Ecosystem
   ========================================================================= */
function Cockpit(){
  const {t,cov,setRoute,alerts}=useStore();
  return (<div className="fade">
    <PageHeader title={t("nav_cockpit")+" · "+t("leader_full")} sub={t("cockpit_sub")}/>
    <div className="cols-4" style={{marginBottom:16}}>
      <KPI label={t("k_market")} value={cov==="ministry"?"21%":cov==="private"?"27%":"24%"} tone="warn" sub={t("cov_"+cov)+" · "+COV_ACC[cov]}/>
      <KPI label={t("k_supply")} value="62,400" sub="units"/>
      <KPI label={t("k_conv")} value="58%" tone="warn" sub="target 60%+"/>
      <KPI label={t("k_savings")} value={t("k_resp_v")} tone="good" sub={t("k_resp_s")}/>
    </div>
    <Section title={t("engines_title")}><EngineGrid/></Section>
    <EcosystemBlock/>
    <Section title={t("latest_alerts")} right={<button className="btn secondary sm" onClick={()=>setRoute("policy")}>{t("nav_policy")} {ArrowIcon}</button>}>
      {alerts.filter(a=>!a.ack).slice(0,3).map(a=>(<div key={a.id} className="todo-row">
        <span className={"chip "+(a.sev==="red"?"danger":"amber")}>{t("sev_"+a.sev)}</span>
        <div style={{flex:1,fontWeight:600,fontSize:13}}>{t(a.tk)}</div></div>))}
      {alerts.filter(a=>!a.ack).length===0&&<div className="muted">{t("noAlerts")}</div>}
    </Section>
  </div>);
}
function EcosystemBlock(){
  const {t}=useStore();
  return (<Section title={t("nav_eco")} sub={t("eco_sub")} right={<span className="chip">🤝 {t("manualPush")}</span>}>
    <div className="eco">
      <div className="node-box dso"><b>{t("eco_dso")}</b><div className="muted" style={{fontSize:11,marginTop:3}}>SSOT</div></div>
      <span className="arrow">→</span>
      <div className="node-box">{t("eco_copilot")}<div className="muted" style={{fontSize:11,marginTop:3}}>{t("eco_consumes")}</div></div>
      <span className="arrow">→</span>
      <div className="node-box">{t("eco_h03")}</div>
    </div>
    <div className="banner" style={{marginTop:12}}>● {t("redline")}</div>
  </Section>);
}
function Ecosystem(){
  const {t}=useStore();
  return (<div className="fade"><PageHeader title={t("nav_eco")} sub={t("eco_sub")}/><EcosystemBlock/></div>);
}

/* shared charts (used by pages and chat engine cards) */
function VulnChart({h}){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  return (<div style={{width:"100%",height:h||300}}><C.ResponsiveContainer>
    <C.BarChart layout="vertical" data={VULN.map(r=>({name:t("rg_"+r.key),v:r.v}))} margin={{top:4,right:24,left:30,bottom:4}}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/>
      <C.YAxis type="category" dataKey="name" tick={{fontSize:10}} width={70}/><C.Tooltip/>
      <C.Bar dataKey="v" radius={[0,3,3,0]}>{VULN.map((r,i)=><C.Cell key={i} fill={r.v>=70?"#b42318":r.v>=40?"#e29700":"#1B8354"}/>)}</C.Bar>
    </C.BarChart></C.ResponsiveContainer></div>);
}
const DEV_RADC=["#1B8354","#2563eb","#6d5ae6","#e29700","#9aa3ab"];
function DevRadar({h}){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  const radar=DEV_DIMS.map(d=>{ const row={dim:t("d_"+d)}; DEVS.slice(0,5).forEach(dv=>row[dv.name]=dv[d]); return row; });
  return (<div style={{width:"100%",height:h||300}}><C.ResponsiveContainer>
    <C.RadarChart data={radar} margin={{top:8,right:18,left:18,bottom:8}}>
      <C.PolarGrid/><C.PolarAngleAxis dataKey="dim" tick={{fontSize:10}}/><C.PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
      {DEVS.slice(0,5).map((dv,i)=><C.Radar key={dv.name} name={dv.name+" ("+dv.score+"/"+dv.grade+")"} dataKey={dv.name} stroke={DEV_RADC[i]} fill={DEV_RADC[i]} fillOpacity={0.06} strokeWidth={i<3?2:1}/>)}
      <C.Legend wrapperStyle={{fontSize:10}}/>
    </C.RadarChart></C.ResponsiveContainer></div>);
}

/* =========================================================================
   Macro-Economic Impact (the briefing's UC-09 spine)
   ========================================================================= */
function MacroImpact(){
  const {t,cov}=useStore(); const C=RC; const ok=!!C.ResponsiveContainer;
  const corr=MACRO_CORR.map(m=>({name:t("ind_"+m.key),demand:m.demand,supply:m.supply,price:m.price}));
  return (<div className="fade">
    <PageHeader title={t("nav_macro")} sub={t("macro_sub")} right={<AgentBadge name={t("eng_macro")}/>}/>
    <div className="shock" style={{marginBottom:16}}><span className="si">⚡</span><span className="stxt">{t("shock_banner")}</span><span className="spill">{t("brief_urgent")}</span></div>
    <Section title={t("corr_title")} right={<span className="chip gray">{t("confidence")}: 88%</span>}>
      <div style={{width:"100%",height:280}}>{ok&&
        <C.ResponsiveContainer><C.BarChart data={corr} margin={{top:6,right:10,left:-6,bottom:4}}>
          <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:10}} interval={0} angle={-20} textAnchor="end" height={56}/>
          <C.YAxis domain={[0,1]} tick={{fontSize:10}}/><C.Tooltip/><C.Legend wrapperStyle={{fontSize:11}}/>
          <C.ReferenceLine y={0.6} stroke="#e32700" strokeDasharray="4 4" label={{value:t("corr_thresh"),fontSize:10,fill:"#e32700",position:"insideTopRight"}}/>
          <C.Bar dataKey="demand" name={t("m_demandR")} fill="#2563eb" radius={[3,3,0,0]}/>
          <C.Bar dataKey="supply" name={t("m_supplyR")} fill="#e29700" radius={[3,3,0,0]}/>
          <C.Bar dataKey="price" name={t("m_priceR")} fill="#1B8354" radius={[3,3,0,0]}/>
        </C.BarChart></C.ResponsiveContainer>}
      </div>
    </Section>
    <Section title={t("econ_title")}>
      <div className="scrollx"><table className="tbl">
        <thead><tr><th></th>{ECON_SCN.map(s=><th key={s.k} className="right-num">{t("sc_"+s.k)} · {s.prob}% {t("prob")}</th>)}</tr></thead>
        <tbody>
          {[["p_rate","rate"],["p_inf","inf"],["p_unemp","unemp"],["p_gdp","gdp"]].map(([lk,f])=>(
            <tr key={f}><td>{t(lk)}</td>{ECON_SCN.map(s=><td key={s.k} className="right-num mono econ-cell">{s[f]}</td>)}</tr>))}
        </tbody>
      </table></div>
    </Section>
    <Section title={t("vuln_title")} sub={t("vuln_axis")} right={<AgentBadge name={t("eng_macro")}/>}>
      <VulnChart h={360}/>
    </Section>
  </div>);
}

/* =========================================================================
   Developer Value-Chain scorecard (the briefing's UC-08 spine)
   ========================================================================= */
function Developers(){
  const {t}=useStore(); const C=RC; const ok=!!C.ResponsiveContainer;
  const radar=DEV_DIMS.map(d=>{ const row={dim:t("d_"+d)}; DEVS.slice(0,5).forEach(dv=>row[dv.name]=dv[d]); return row; });
  const RADC=["#1B8354","#2563eb","#6d5ae6","#e29700","#9aa3ab"];
  const tiers=[["t1","immediate"],["t2","high"],["t3","medium"]];
  return (<div className="fade">
    <PageHeader title={t("nav_dev")} sub={t("dev_sub")} right={<AgentBadge name={t("eng_demand")}/>}/>
    <div className="cols-2">
      <Section title={t("dev_score")} sub={t("capacity_note")}>
        <div className="scrollx"><table className="tbl">
          <thead><tr><th>{t("tier_dev")}</th><th>{t("grade")}</th><th className="right-num">{t("score")}</th><th>{t("d_quality")}</th><th>{t("d_completion")}</th><th>{t("d_signing")}</th></tr></thead>
          <tbody>{DEVS.map(d=>(<tr key={d.name}>
            <td><b>{d.name}</b></td>
            <td><span className={"dev-grade "+d.grade}>{d.grade}</span></td>
            <td className="right-num mono" style={{fontWeight:700}}>{d.score}</td>
            {["quality","completion","signing"].map(k=>(<td key={k}><div className="bar-mini"><span style={{width:d[k]+"%"}}/></div></td>))}
          </tr>))}</tbody>
        </table></div>
      </Section>
      <Section title={t("dev_score")}>
        <DevRadar h={300}/>
      </Section>
    </div>
    <Section title={t("tiers_title")}>
      <div className="scrollx"><table className="tbl">
        <thead><tr><th>{t("tier")}</th><th>{t("tier_dev")}</th><th>{t("tier_action")}</th><th>{t("tier_out")}</th><th>{t("tier_when")}</th></tr></thead>
        <tbody>{tiers.map(([tk,pri])=>(<tr key={tk}>
          <td><span className={"rp "+pri} style={{fontSize:10,fontWeight:800,color:"#fff",borderRadius:6,padding:"3px 8px",background:pri==="immediate"?"var(--danger)":pri==="high"?"var(--amber)":"#1763a6"}}>{t(tk)}</span></td>
          <td>{t(tk+"d")}</td><td>{t(tk+"a")}</td><td className="mono">{t(tk+"o")}</td><td className="muted">{t(tk+"w")}</td>
        </tr>))}</tbody>
      </table></div>
    </Section>
  </div>);
}

/* =========================================================================
   App
   ========================================================================= */
const SEED_ALERTS=[
  { id:"AL-1", sev:"amber", tk:"al_moj_t", bk:"al_moj_b", ts:"06:10", ack:false, scn:null },
  { id:"AL-2", sev:"amber", tk:"al_conv_t", bk:"al_conv_b", ts:"05:40", ack:false, scn:null },
];
function App(){
  const [user,setUserState]=useState(null);
  const [lang,setLang]=useState(()=>{ try{ const q=new URLSearchParams(window.location.search).get("ln"); if(q==="zh"||q==="ar"||q==="en") return q; }catch(e){} return "en"; });
  const [cov,setCov]=useState("total");
  const [route,setRoute]=useState("hub");
  const [alerts,setAlerts]=useState(SEED_ALERTS);
  const [reports,setReports]=useState([]);
  const [log,setLog]=useState([]);
  const [seed,setSeed]=useState(null);
  const t=(k)=>{ const d=I18N[lang]; if(d&&d[k]!==undefined) return d[k]; const e=I18N.en; return (e&&e[k]!==undefined)?e[k]:k; };

  useEffect(()=>{ const html=document.documentElement; html.lang=lang; html.dir=lang==="ar"?"rtl":"ltr"; },[lang]);

  function pushLog(key,extra){ const txt = extra? (t(key)+" "+extra) : t(key);
    setLog(prev=>[{ts:timeStr(lang),text:txt},...prev].slice(0,40)); }
  // ambient real-time log: mostly healthy info ticks, with the occasional unhealthy (clickable) event
  useEffect(()=>{ if(!user) return; let n=0; const id=setInterval(()=>{
      n++;
      if(n%3===0){ const ev=HEALTH_EVENTS[Math.floor(Math.random()*HEALTH_EVENTS.length)];
        setLog(prev=>[{ts:timeStr(lang),text:t(ev.k),health:ev},...prev].slice(0,40)); }
      else { const keys=["log_idle","log_scan","log_route","log_feed"]; pushLog(keys[Math.floor(Math.random()*keys.length)]); }
    },6500); return ()=>clearInterval(id); /* eslint-disable-next-line */ },[user,lang]);

  function setUser(r){ setUserState(r); setRoute(r==="leader"?"cockpit":"hub"); if(r) setLog(seedLog(t)); }
  function ackAlert(id){ setAlerts(prev=>prev.map(a=>a.id===id?{...a,ack:true}:a)); }
  function raiseGapAlert(){ setAlerts(prev=> prev.some(a=>a.id==="AL-GAP")? prev : [{id:"AL-GAP",sev:"red",tk:"al_gap_t",bk:"al_gap_b",ts:nowStr(lang).split(" ").slice(-1)[0],ack:false,scn:"q_gap"},...prev]); }
  function askOrchestrator(scn){ setSeed(scn); setRoute("chat"); }
  function clearSeed(){ setSeed(null); }
  function addReport(r){ setReports(prev=>[{...r,time:nowStr(lang)},...prev]); }
  function reset(){ setAlerts(SEED_ALERTS); setReports([]); setLog(seedLog(t)); setSeed(null); setRoute(user==="leader"?"cockpit":"hub"); }

  const store={ t,lang,setLang,cov,setCov,user,setUser,route,setRoute,alerts,ackAlert,raiseGapAlert,
    reports,addReport,log,pushLog,seed,askOrchestrator,clearSeed,reset };

  if(!user) return (<Ctx.Provider value={store}><Login/></Ctx.Provider>);

  let page=null;
  if(route==="chat") page=<ChatAnalysis/>;
  else if(route==="monitor") page=<Monitoring/>;
  else if(route==="macro") page=<MacroImpact/>;
  else if(route==="dev") page=<Developers/>;
  else if(route==="policy") page=<PolicySim/>;
  else if(route==="reports") page=<Reports/>;
  else if(route==="cockpit") page=<Cockpit/>;
  else if(route==="eco") page=<Ecosystem/>;
  else page = user==="leader"?<Cockpit/>:<Hub/>;

  return (<Ctx.Provider value={store}>
    <TopBar/>
    <div className="shell"><Sidebar/><div className="content">{page}</div></div>
    <AgentLog/>
    <div className="buildstamp" title={t("build")}>📦 {t("build")}: {BUILD_TIME}</div>
  </Ctx.Provider>);
}

export default App;
