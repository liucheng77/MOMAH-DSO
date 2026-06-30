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
  { key:"private",status:"ok",    sla:"weekly",    fresh:91 },
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
    nav_hub:"Dashboard", nav_chat:"Conversational Analysis", nav_monitor:"Monitoring & Alerts",
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
    a_gap:"Carrying over Riyadh · Aspirers from the previous turn: the Segment-A gap is 12,400 units (Y3) and the pipeline covers only 35% (RED). The Strategic Planning engine proposes a 3-scenario supply plan ranked by absorption.",
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
    al_gap_t:"Riyadh · Aspirers Seg-A gap 12,400 units · 35% covered (RED)", al_gap_b:"Pipeline covers only 35% of need — a red-level shortfall. Root cause: demand up 31% vs a flat supply pipeline.",
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
  nav_hub:"لوحة المعلومات", nav_chat:"التحليل الحواري", nav_monitor:"المراقبة والتنبيهات",
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
  a_gap:"بترحيل الرياض · المتطلّبون من الدور السابق: فجوة الشريحة A تبلغ ١٢٬٤٠٠ وحدة (السنة ٣) ويغطي الخط ٣٥٪ فقط (أحمر). يقترح محرك التخطيط خطة عرض من ٣ سيناريوهات مرتّبة بالاستيعاب.",
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
  al_gap_t:"الرياض · المتطلّبون: فجوة الشريحة A ١٢٬٤٠٠ وحدة · تغطية ٣٥٪ (أحمر)", al_gap_b:"يغطي الخط ٣٥٪ فقط من الحاجة — نقص بمستوى أحمر. السبب: الطلب +٣١٪ مقابل خط عرض ثابت.",
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
  a_gap:"沿用上一轮的「利雅得 · 改善型客群」：A 段缺口 12,400 套（第3年），管线仅覆盖 35%（红色）。战略规划引擎给出按吸纳排序的 3 情景供给方案。",
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
  al_gap_t:"利雅得 · 改善型客群 A 段缺口 12,400 套 · 覆盖 35%（红）", al_gap_b:"管线仅覆盖需求的 35% —— 红色级短缺。根因：需求 +31% 而供给管线持平。",
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
const MACRO_CORR = [   // 6 indicators × signed Pearson r vs demand/supply/price (Figure 1)
  { key:"int",   demand:-0.85, supply:-0.58, price:-0.90 },
  { key:"pop",   demand:0.92,  supply:0.30,  price:0.69 },
  { key:"gdp",   demand:0.66,  supply:0.51,  price:0.71 },
  { key:"inf",   demand:-0.61, supply:-0.42, price:0.55 },
  { key:"unemp", demand:-0.49, supply:-0.31, price:-0.44 },
  { key:"oil",   demand:0.39,  supply:0.35,  price:0.41 },
];
const ECON_SCN = [
  { k:"opt",  prob:20, rate:"4.25%", inf:"2.5%", unemp:"4.0%", gdp:"3.5%" },
  { k:"base", prob:55, rate:"4.75%", inf:"3.2%", unemp:"4.8%", gdp:"2.1%" },
  { k:"pess", prob:25, rate:"5.00%", inf:"4.5%", unemp:"6.2%", gdp:"0.8%" },
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
  corr_title:"Macro indicators → housing-market Pearson correlation (r)", corr_thresh:"|r| = 0.6 threshold",
  ind_int:"Interest rate", ind_pop:"Population", ind_gdp:"GDP growth", ind_inf:"Inflation (CPI)", ind_unemp:"Unemployment", ind_oil:"Oil price",
  m_demandR:"Demand r", m_supplyR:"Supply r", m_priceR:"Price r",
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
  corr_title:"ارتباط بيرسون (r) للمؤشرات الكلية بسوق السكن", corr_thresh:"عتبة |r| = ٠٫٦",
  ind_int:"سعر الفائدة", ind_pop:"السكان", ind_gdp:"نمو الناتج", ind_inf:"التضخم", ind_unemp:"البطالة", ind_oil:"سعر النفط",
  m_demandR:"r الطلب", m_supplyR:"r العرض", m_priceR:"r السعر",
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
  corr_title:"宏观指标 → 住房市场 Pearson 相关系数(r)", corr_thresh:"|r| = 0.6 阈值",
  ind_int:"利率", ind_pop:"人口", ind_gdp:"GDP 增长", ind_inf:"通胀(CPI)", ind_unemp:"失业率", ind_oil:"油价",
  m_demandR:"需求 r", m_supplyR:"供给 r", m_priceR:"价格 r",
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
  hist_rate:"SAMA rate", hist_rd:"Riyadh demand", hist_rs:"Riyadh supply", hist_ed:"Eastern demand", hist_es:"Eastern supply",
  hist_rateT:"SAMA policy rate (%)", hist_unitsT:"Riyadh & Eastern Region: demand vs supply (quarterly)", hist_diverge:"Divergence risk zone", hist_shock:"+50bps shock",
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
  downloadBrief:"Download briefing (PDF)", genBrief2:"Generate ministerial briefing",
  y1impact:"Base-case Y1 impact", dominant:"dominant driver",
});
Object.assign(I18N.zh, {
  q_history:"调出过去 5 年季度历史:SAMA 利率 + 利雅得与东部省的需求和供给。",
  hist_title:"5 年季度历史(2022 Q1 – 2026 Q2)",
  hist_insight:"需求对利率敏感,但自 2025 Q1 起反弹;供给滞后(利雅得 +2.3% vs 需求 +10.6%)。本次 +50bps 跳升可能打破反弹。",
  hist_rate:"SAMA 利率", hist_rd:"利雅得需求", hist_rs:"利雅得供给", hist_ed:"东部需求", hist_es:"东部供给",
  hist_rateT:"SAMA 政策利率(%)", hist_unitsT:"利雅得与东部地区:需求 vs 供给(季度)", hist_diverge:"背离风险区", hist_shock:"+50bps 冲击",
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
  downloadBrief:"下载简报(PDF)", genBrief2:"生成部长简报",
  y1impact:"基准情景 Y1 影响", dominant:"主导驱动",
});
Object.assign(I18N.ar, {
  q_history:"اعرض تاريخ ٥ سنوات ربعي: فائدة ساما + طلب وعرض الرياض والشرقية.",
  hist_title:"تاريخ ربعي لخمس سنوات (٢٠٢٢ر١ – ٢٠٢٦ر٢)",
  hist_insight:"الطلب حسّاس للفائدة لكنه ارتدّ منذ ٢٠٢٥ر١؛ العرض متأخّر. قفزة +٥٠ نقطة قد تكسر الارتداد.",
  hist_rate:"فائدة ساما", hist_rd:"طلب الرياض", hist_rs:"عرض الرياض", hist_ed:"طلب الشرقية", hist_es:"عرض الشرقية",
  hist_rateT:"معدل سياسة ساما (٪)", hist_unitsT:"الرياض والمنطقة الشرقية: الطلب مقابل العرض (ربعي)", hist_diverge:"منطقة خطر التباعد", hist_shock:"صدمة +٥٠ نقطة",
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
  downloadBrief:"تنزيل الموجز (PDF)", genBrief2:"توليد الموجز الوزاري",
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
  kpis_title:"Key KPIs", biz_reports:"Business reports", k_dq:"Data quality score",
  release_notes:"Release notes", rn_latest:"Latest",
  ki_snapshot:"Jun 1, 2026", ki_sub:"Key indicators — monthly view", ki_real:"Real data", ki_mock:"DSO estimate",
  ki_macro_title:"Macro-Economic Indicators · MoM", ki_housing_title:"Housing Market Indicators · MoM",
  ki_scn_title:"Macro Scenario Distribution", ki_risk_title:"Key Risks · Next 30 Days",
  ki_indicator:"Indicator", ki_may:"May 1", ki_jun:"Jun 1", ki_mom:"MoM Δ", ki_active:"Active",
  ki_scn_note:"Refreshed quarterly · top-4 macro R² ≥ 0.6 · ad-hoc refresh on rate change ≥ 25bps",
  ki_footer:"Real data from SAMA / GASTAT / Market · DSO estimates from the platform · next refresh Jul 1, 2026",
  ai_reco_title:"AI Diagnosis & Recommendation", ai_diag:"Diagnosis", ai_macro:"macro", ai_policy:"policy", ai_impact:"Impact if unaddressed", ai_actions:"Recommended actions", ai_analysis:"AI Analysis & Recommendations",
  ai_recalc:"recomputing…", ai_scn_hint:"click a scenario to recompute", ai_diagnose:"AI diagnosis & recommendation",
  ai_toolkit:"Policy toolkit — six measures at a glance", ai_measure:"Measure", ai_gapclose:"Gap closure", ai_verdict:"Verdict",
  sla_label:"SLA / threshold",
  he_gap:"Riyadh Seg-A gap 12,400 units · 35% covered (RED)",
  he_gap_s:"Gap rule — green <10% · yellow 10–30% · RED >30%",
  he_gap_d:"The Riyadh Segment-A gap is 12,400 units (Y3) and the pipeline covers only 35% — a red-level shortfall that triggers strategic escalation. Root cause: demand +31% (forced B→A migration) against a flat supply pipeline. Routed to the Strategic Planning Manager.",
  he_absorp:"Absorption drop 43% · Riyadh Seg A (RED)",
  he_absorp_s:"Rule — absorption drop >40% → immediate escalation",
  he_absorp_d:"Projected absorption for Riyadh Segment-A fell 43% versus plan, exceeding the 40% threshold that mandates immediate escalation to the Planning Manager. Drivers: 52% conversion plus pipeline mismatch. Recommended: accelerate Tier-1 developers and apply Policy A.",
  he_moj:"DS-07 price feed delayed · 43% of SLA (yellow)",
  he_moj_s:"Freshness — weekly SLA · 3-day delay ≈ 43% (≤50% = yellow)",
  he_moj_d:"The MOJ price feed (DS-07) is 3 days late against its weekly SLA (~43%) — yellow (delay ≤50% of SLA). Price-trend confidence was reduced 95% → 88% and analysis proceeded on the last valid snapshot. Data Manager auto-notified (ticket #DQ-2407); resolve before it crosses 50% (red).",
  he_anom:"Demand anomaly +3.2σ · Eastern",
  he_anom_s:"Rule — deviation >3σ vs 12-week average → flag for review",
  he_anom_d:"Eastern-Region demand deviated +3.2σ from the 12-week moving average, beyond the 3σ threshold. The engine flagged the value and requested expert review instead of feeding it downstream. Likely cause: an oil-sector employment cycle; verify before use.",
  he_conv:"Conversion 52% · Makkah (<60% threshold)",
  he_conv_s:"Rule — conversion <60% requires intervention",
  he_conv_d:"Qualification → signing conversion in Makkah fell to 52%, below the 60% intervention threshold. Driver: developer-margin disincentives on affordable units. Recommended: weekly monitoring + targeted incentive; escalate to the Planning Manager if it persists two more weeks.",
  he_stale:"DS-10 private-market feed delayed · 43% of SLA (yellow)",
  he_stale_s:"Freshness — weekly SLA · 3-day delay ≈ 43% (≤50% = yellow)",
  he_stale_d:"The private-market source (DS-10) is 3 days late against its weekly SLA (~43%) — yellow. Private-coverage outputs carry a reduced-confidence caveat (80% maintained); the monitor uses the last valid snapshot and notified the Data Manager. Total-market figures are unaffected.",
});
Object.assign(I18N.zh, {
  rp_weekly:"每周住房市场快照", rp_monthly:"月度住房市场绩效报告", rp_quarterly:"季度住房市场战略报告",
  periodic_title:"周期报告", generated_title:"已生成报告", preview:"预览", close:"关闭", viewDetail:"查看详情",
  kpis_title:"关键 KPI", biz_reports:"业务报告", k_dq:"数据质量分",
  release_notes:"更新日志", rn_latest:"最新",
  ki_snapshot:"2026 年 6 月 1 日", ki_sub:"关键指标 — 月度", ki_real:"真实数据", ki_mock:"DSO 估算",
  ki_macro_title:"宏观经济指标 · 环比", ki_housing_title:"住房市场指标 · 环比",
  ki_scn_title:"宏观情景分布", ki_risk_title:"关键风险 · 未来 30 天",
  ki_indicator:"指标", ki_may:"5 月 1 日", ki_jun:"6 月 1 日", ki_mom:"环比", ki_active:"当前",
  ki_scn_note:"季度刷新 · 前 4 项宏观 R² ≥ 0.6 · 利率变动 ≥ 25bps 触发临时刷新",
  ki_footer:"真实数据来自 SAMA / GASTAT / 市场 · DSO 估算来自平台 · 下次刷新 2026 年 7 月 1 日",
  ai_reco_title:"AI 诊断与建议", ai_diag:"诊断", ai_macro:"宏观", ai_policy:"政策", ai_impact:"若不处理的影响", ai_actions:"建议措施", ai_analysis:"AI 分析与建议",
  ai_recalc:"重算中…", ai_scn_hint:"点击情景可重算", ai_diagnose:"AI 诊断与建议",
  ai_toolkit:"政策工具箱 — 六项措施一览", ai_measure:"措施", ai_gapclose:"缺口闭合", ai_verdict:"结论",
  sla_label:"SLA / 阈值",
  he_gap:"利雅得 A 段缺口 12,400 套 · 覆盖 35%(红)",
  he_gap_s:"缺口规则 — 绿 <10% · 黄 10–30% · 红 >30%",
  he_gap_d:"利雅得 A 段缺口 12,400 套(第3年),管线仅覆盖 35% —— 红色级短缺,触发战略级升级。根因:需求 +31%(B→A 被迫迁移)而供给管线持平。已路由至战略规划经理。",
  he_absorp:"吸纳率骤降 43% · 利雅得 A 段(红)",
  he_absorp_s:"规则 — 吸纳率下降 >40% → 立即升级",
  he_absorp_d:"利雅得 A 段预期吸纳率较计划下降 43%,超过 40% 阈值,须立即上报规划经理。驱动:转化率 52% 叠加管线错配。建议:加速一级开发商并实施政策 A。",
  he_moj:"DS-07 房价源延迟 · 占 SLA 43%(黄)",
  he_moj_s:"新鲜度 — 周度 SLA · 延迟 3 天 ≈ 43%(≤50% 为黄)",
  he_moj_d:"司法部房价源(DS-07)较周度 SLA 延迟 3 天(约 43%)——黄色(延迟 ≤50% SLA)。价格趋势置信度由 95% 降至 88%,分析沿用最近有效快照。已自动通知数据经理(工单 #DQ-2407);需在越过 50%(红)前修复。",
  he_anom:"需求异常 +3.2σ · 东部省",
  he_anom_s:"规则 — 较 12 周均值偏离 >3σ → 标记复核",
  he_anom_d:"东部省需求较 12 周移动平均偏离 +3.2σ,超过 3σ 阈值。引擎已标记该值并请求专家复核,未直接向下游传递。可能原因:石油行业就业周期;使用前请先核实。",
  he_conv:"转化率 52% · 麦加(<60% 阈值)",
  he_conv_s:"规则 — 转化率 <60% 需干预",
  he_conv_d:"麦加的资格→签约转化率降至 52%,低于 60% 干预阈值。驱动因素:可负担房型上开发商利润偏低的负向激励。建议:每周监控 + 定向激励;若再持续两周则上报规划经理。",
  he_stale:"DS-10 私有市场源延迟 · 占 SLA 43%(黄)",
  he_stale_s:"新鲜度 — 周度 SLA · 延迟 3 天 ≈ 43%(≤50% 为黄)",
  he_stale_d:"私有市场源(DS-10)较周度 SLA 延迟 3 天(约 43%)——黄色。私有覆盖输出附带降置信度提示(维持 80%);监控沿用最近有效快照并已通知数据经理。全市场数据不受影响。",
});
Object.assign(I18N.ar, {
  rp_weekly:"لقطة سوق السكن الأسبوعية", rp_monthly:"أداء سوق السكن الشهري", rp_quarterly:"التقرير الاستراتيجي الفصلي",
  periodic_title:"التقارير الدورية", generated_title:"التقارير المولّدة", preview:"معاينة", close:"إغلاق", viewDetail:"عرض التفاصيل",
  kpis_title:"المؤشرات الرئيسية", biz_reports:"التقارير التشغيلية", k_dq:"درجة جودة البيانات",
  release_notes:"سجل التحديثات", rn_latest:"الأحدث",
  ki_snapshot:"١ يونيو ٢٠٢٦", ki_sub:"المؤشرات الرئيسية — شهرياً", ki_real:"بيانات حقيقية", ki_mock:"تقدير DSO",
  ki_macro_title:"المؤشرات الاقتصادية الكلية · شهرياً", ki_housing_title:"مؤشرات سوق السكن · شهرياً",
  ki_scn_title:"توزيع السيناريوهات الكلية", ki_risk_title:"أهم المخاطر · ٣٠ يوماً القادمة",
  ki_indicator:"المؤشر", ki_may:"١ مايو", ki_jun:"١ يونيو", ki_mom:"التغير الشهري", ki_active:"الحالي",
  ki_scn_note:"تحديث فصلي · أعلى ٤ مؤشرات R² ≥ ٠٫٦ · تحديث فوري عند تغيّر الفائدة ≥ ٢٥ نقطة",
  ki_footer:"بيانات حقيقية من ساما / الإحصاء / السوق · تقديرات DSO من المنصّة · التحديث القادم ١ يوليو ٢٠٢٦",
  ai_reco_title:"تشخيص وتوصية AI", ai_diag:"التشخيص", ai_macro:"كلي", ai_policy:"سياسة", ai_impact:"الأثر إن لم يُعالَج", ai_actions:"الإجراءات الموصى بها", ai_analysis:"تحليل وتوصيات AI",
  ai_recalc:"إعادة الحساب…", ai_scn_hint:"اضغط سيناريو لإعادة الحساب", ai_diagnose:"تشخيص وتوصية AI",
  ai_toolkit:"حقيبة السياسات — ست إجراءات بلمحة", ai_measure:"الإجراء", ai_gapclose:"سدّ الفجوة", ai_verdict:"الحكم",
  sla_label:"SLA / العتبة",
  he_gap:"فجوة الشريحة A بالرياض ١٢٬٤٠٠ وحدة · تغطية ٣٥٪ (أحمر)",
  he_gap_s:"قاعدة الفجوة — أخضر <١٠٪ · أصفر ١٠–٣٠٪ · أحمر >٣٠٪",
  he_gap_d:"بلغت فجوة الشريحة A في الرياض ٣٤٪، متجاوزةً عتبة ٣٠٪ الحمراء. الفجوة الحمراء تستوجب تصعيداً استراتيجياً. السبب: الطلب +٣١٪ (هجرة B→A قسرية) مقابل خط عرض ثابت. وُجّه إلى مدير التخطيط الاستراتيجي.",
  he_absorp:"هبوط الاستيعاب ٤٣٪ · الرياض الشريحة A (أحمر)",
  he_absorp_s:"قاعدة — هبوط الاستيعاب >٤٠٪ ← تصعيد فوري",
  he_absorp_d:"انخفض الاستيعاب المتوقع للشريحة A في الرياض ٤٣٪ مقابل الخطة، متجاوزاً عتبة ٤٠٪ التي توجب التصعيد الفوري لمدير التخطيط. الدوافع: تحويل ٥٢٪ وعدم تطابق الخط. يُوصى بتسريع مطوّري المستوى ١ وتطبيق السياسة A.",
  he_moj:"تأخّر مصدر أسعار DS-07 · ٤٣٪ من SLA (أصفر)",
  he_moj_s:"الحداثة — SLA أسبوعي · تأخّر ٣ أيام ≈ ٤٣٪ (≤٥٠٪ = أصفر)",
  he_moj_d:"تأخّر مصدر أسعار العدل (DS-07) ٣ أيام مقابل SLA الأسبوعي (~٤٣٪) — أصفر (تأخّر ≤٥٠٪). خُفّضت ثقة اتجاه السعر ٩٥٪ ← ٨٨٪ وتابع التحليل على آخر لقطة صالحة. أُبلغ مدير البيانات آلياً (تذكرة #DQ-2407)؛ يُعالَج قبل تجاوز ٥٠٪ (أحمر).",
  he_anom:"شذوذ طلب +٣٫٢σ · الشرقية",
  he_anom_s:"قاعدة — انحراف >٣σ عن متوسط ١٢ أسبوعاً ← وسم للمراجعة",
  he_anom_d:"انحرف طلب الشرقية +٣٫٢σ عن متوسط ١٢ أسبوعاً، متجاوزاً عتبة ٣σ. وسم المحرك القيمة وطلب مراجعة خبير بدل تمريرها. السبب المرجّح: دورة توظيف قطاع النفط؛ تحقّق قبل الاستخدام.",
  he_conv:"التحويل ٥٢٪ · مكة (<٦٠٪)",
  he_conv_s:"قاعدة — التحويل <٦٠٪ يتطلب تدخلاً",
  he_conv_d:"انخفض التحويل من التأهيل إلى التوقيع في مكة إلى ٥٢٪، دون عتبة التدخل ٦٠٪. السبب: ضعف هامش المطوّر على الوحدات الميسورة. يُوصى بمراقبة أسبوعية وحافز موجّه؛ ويُرفع لمدير التخطيط إذا استمر أسبوعين آخرين.",
  he_stale:"تأخّر مصدر السوق الخاص DS-10 · ٤٣٪ من SLA (أصفر)",
  he_stale_s:"الحداثة — SLA أسبوعي · تأخّر ٣ أيام ≈ ٤٣٪ (≤٥٠٪ = أصفر)",
  he_stale_d:"تأخّر مصدر السوق الخاص (DS-10) ٣ أيام مقابل SLA الأسبوعي (~٤٣٪) — أصفر. تحمل مخرجات التغطية الخاصة تنويه ثقة مخفّضة (٨٠٪ محفوظة)؛ يستخدم المراقب آخر لقطة صالحة وأبلغ مدير البيانات. أرقام السوق الكلي غير متأثرة.",
});

/* historical series (storyline step 2) */
const HIST = [   // quarterly: SAMA rate + Riyadh/Eastern demand & supply (uploaded chart)
  {q:"22Q1",r:1.00,rd:15800,rs:14200,ed:9800, es:9100},{q:"22Q2",r:1.75,rd:16100,rs:14300,ed:9900, es:9150},{q:"22Q3",r:3.00,rd:16300,rs:14500,ed:10000,es:9300},{q:"22Q4",r:5.00,rd:15500,rs:14700,ed:9600, es:9400},
  {q:"23Q1",r:5.25,rd:14900,rs:15000,ed:9400, es:9600},{q:"23Q2",r:5.50,rd:14500,rs:15200,ed:9200, es:9700},{q:"23Q3",r:5.75,rd:14000,rs:14800,ed:8900, es:9500},{q:"23Q4",r:6.00,rd:13500,rs:14300,ed:8600, es:9200},
  {q:"24Q1",r:6.00,rd:13200,rs:13900,ed:8400, es:9000},{q:"24Q2",r:5.75,rd:13400,rs:13600,ed:8500, es:8800},{q:"24Q3",r:5.50,rd:13600,rs:13400,ed:8700, es:8600},{q:"24Q4",r:5.50,rd:13800,rs:13300,ed:8800, es:8500},
  {q:"25Q1",r:5.00,rd:14100,rs:13200,ed:9000, es:8600},{q:"25Q2",r:4.75,rd:14400,rs:13300,ed:9100, es:8600},{q:"25Q3",r:4.50,rd:14500,rs:13400,ed:9200, es:8700},{q:"25Q4",r:4.25,rd:14600,rs:13500,ed:9300, es:8800},
  {q:"26Q1",r:4.25,rd:14700,rs:13600,ed:9400, es:8900},{q:"26Q2",r:4.75,rd:14400,rs:13700,ed:9300, es:9000},
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
  const {t,lang,setLang,user,setUser,reset,route,setRoute,alerts}=useStore();
  const [open,setOpen]=useState(false);
  const [notif,setNotif]=useState(false);
  const openAlerts=alerts.filter(a=>!a.ack).length;
  const notifLbl=lang==="zh"?"通知":lang==="ar"?"التنبيهات":"Notifications";
  return (<div className="topbar">
    <div className="brand">
      <img className="topbar-logo" src="/assets/logo.png" alt="MoMAH" onError={e=>{const im=e.currentTarget,f=im.dataset.f||"0"; if(f==="0"){im.dataset.f="1";im.src="public/assets/logo.png";} else if(f==="1"){im.dataset.f="2";im.src="assets/logo.png";} else im.style.display="none";}}/>
      <span className="topbar-sep"/>
      <span className="topbar-app">{t("appName")}</span>
    </div>
    <nav className="topnav">
      {NAV[user].map(([k,ic,r])=>{
        const badge = k==="nav_monitor"&&openAlerts;
        return (<button key={k} className={"tnav"+(route===r?" on":"")} onClick={()=>setRoute(r)}>
          <span className="ico">{ic}</span>{t(k)}{badge?<span className="badge-count">{badge}</span>:null}</button>);
      })}
    </nav>
    <div className="right">
      <CoverageSwitch/>
      <button className="icobtn" title="Search" aria-label="Search">⌕</button>
      <div className="usermenu">
        <button className="icobtn" title={notifLbl} aria-label={notifLbl} onClick={()=>setNotif(n=>!n)}>◔{openAlerts?<span className="badge">{openAlerts}</span>:null}</button>
        {notif&&<div className="panel" onMouseLeave={()=>setNotif(false)} style={{width:300}}>
          <div style={{padding:"4px 8px 8px",fontWeight:700}}>{notifLbl}</div>
          {alerts.filter(a=>!a.ack).length===0&&<div className="muted" style={{padding:"6px 8px",fontSize:12}}>{t("noItems")}</div>}
          {alerts.filter(a=>!a.ack).slice(0,5).map(a=>(<div key={a.id} className="notif-row">
            <span className={"sev-dot "+a.sev}/><span style={{flex:1}}>{t(a.tk)}</span><span className="muted" style={{fontSize:11}}>{a.ts}</span></div>))}
        </div>}
      </div>
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
  analyst:[["nav_hub","◧","hub"],["nav_chat","✦","chat"],["nav_monitor","◉","monitor"],["nav_reports","📄","reports"]],
  planner:[["nav_hub","◧","hub"],["nav_chat","✦","chat"],["nav_reports","📄","reports"]],
  leader:[["nav_cockpit","◧","cockpit"],["nav_eco","🤝","eco"],["nav_reports","📄","reports"]],
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
/* ---- Key Indicators dashboard data (June snapshot; values within BRD scope) ---- */
// dir: up = orange, down = blue, flat = green (value + change + sparkline share the colour)
// series: Dec 2025 → May 2026 monthly mock points {m, v(display), h(0–100 bar height)}
const KI_KPI=[
  {src:"SAMA · Official", src_zh:"SAMA · 官方", real:1, label:"SAMA Repo Rate", label_zh:"SAMA 回购利率", v:"4.25", unit:"%", chg:"→ 0 bps", dir:"flat",
    meta:"Held steady since Dec 2025 · next review Jul 2026", meta_zh:"自 2025 年 12 月持平 · 下次评审 2026 年 7 月",
    series:[{m:"Dec",v:"4.25%",h:55},{m:"Jan",v:"4.25%",h:55},{m:"Feb",v:"4.25%",h:55},{m:"Mar",v:"4.25%",h:55},{m:"Apr",v:"4.25%",h:55},{m:"May",v:"4.25%",h:55}]},
  {src:"GASTAT · Official", src_zh:"GASTAT · 官方", real:1, label:"CPI Inflation (YoY)", label_zh:"CPI 通胀(同比)", v:"1.8", unit:"%", chg:"↑ 0.2pp", dir:"up",
    meta:"Housing rents +8.1% YoY · food +0.9% YoY", meta_zh:"住房租金 +8.1% 同比 · 食品 +0.9% 同比",
    series:[{m:"Dec",v:"1.3%",h:34},{m:"Jan",v:"1.4%",h:40},{m:"Feb",v:"1.4%",h:40},{m:"Mar",v:"1.5%",h:48},{m:"Apr",v:"1.6%",h:56},{m:"May",v:"1.6%",h:56}]},
  {src:"GASTAT · Official", src_zh:"GASTAT · 官方", real:1, label:"Real GDP Growth (YoY)", label_zh:"实际 GDP 增长(同比)", v:"3.0", unit:"%", chg:"↑ 0.2pp vs Q4'25", dir:"up",
    meta:"Non-oil +4.1% · oil +1.2% · Q1 2026", meta_zh:"非石油 +4.1% · 石油 +1.2% · 2026 Q1",
    series:[{m:"Dec",v:"2.4%",h:34},{m:"Jan",v:"2.5%",h:40},{m:"Feb",v:"2.6%",h:48},{m:"Mar",v:"2.7%",h:56},{m:"Apr",v:"2.8%",h:64},{m:"May",v:"3.0%",h:78}]},
  {src:"Market · Real-time", src_zh:"市场 · 实时", real:1, label:"Brent Crude Oil", label_zh:"布伦特原油", v:"$80.59", unit:"", chg:"↓ $1.84 (−2.2%)", dir:"down",
    meta:"May avg $82.43 · YTD $75–$89", meta_zh:"5 月均价 $82.43 · 年内 $75–$89",
    series:[{m:"Dec",v:"$86.10",h:80},{m:"Jan",v:"$84.20",h:66},{m:"Feb",v:"$85.00",h:70},{m:"Mar",v:"$83.10",h:58},{m:"Apr",v:"$82.43",h:52},{m:"May",v:"$80.59",h:44}]},
  {src:"DSO · Demand Intelligence", src_zh:"DSO · 需求智能", real:0, label:"Riyadh Housing Demand", label_zh:"利雅得住房需求", v:"14,600", unit:"", chg:"↑ 2.1%", dir:"up",
    meta:"May 14,300 units · Seg A +3.2% · Seg B −1.4%", meta_zh:"5 月 14,300 套 · A 段 +3.2% · B 段 −1.4%",
    series:[{m:"Dec",v:"13,900",h:40},{m:"Jan",v:"14,000",h:46},{m:"Feb",v:"14,100",h:52},{m:"Mar",v:"14,200",h:58},{m:"Apr",v:"14,300",h:62},{m:"May",v:"14,600",h:74}]},
  {src:"DSO · Supply Planning", src_zh:"DSO · 供给规划", real:0, label:"National Supply Pipeline", label_zh:"全国供给管线", v:"51,400", unit:"", chg:"↑ 1.8%", dir:"up",
    meta:"May 50,500 units · 487 active · 78 completed", meta_zh:"5 月 50,500 套 · 487 在建 · 78 完工",
    series:[{m:"Dec",v:"49,800",h:42},{m:"Jan",v:"50,000",h:48},{m:"Feb",v:"50,200",h:52},{m:"Mar",v:"50,500",h:58},{m:"Apr",v:"50,800",h:64},{m:"May",v:"51,400",h:74}]},
  {src:"DSO · Conversion", src_zh:"DSO · 转化", real:0, label:"Avg. Project Conversion", label_zh:"平均项目转化率", v:"65.8", unit:"%", chg:"↓ 1.4pp", dir:"down",
    meta:"Seg A 52% · Seg E 78% · rate hike pressures A–B", meta_zh:"A 段 52% · E 段 78% · 加息施压 A–B 段",
    series:[{m:"Dec",v:"69.0%",h:78},{m:"Jan",v:"68.5%",h:72},{m:"Feb",v:"68.0%",h:66},{m:"Mar",v:"67.5%",h:60},{m:"Apr",v:"67.2%",h:56},{m:"May",v:"65.8%",h:46}]},
  {src:"DSO · Quality Monitor", src_zh:"DSO · 质量监控", real:0, label:"Data Quality Score", label_zh:"数据质量分", v:"94.6", unit:"/100", chg:"↑ 0.5", dir:"up",
    meta:"10/11 sources ≥95% · DS-10 Private 90.1% (recovered)", meta_zh:"10/11 源 ≥95% · DS-10 私有 90.1%(已恢复)",
    series:[{m:"Dec",v:"93.6",h:48},{m:"Jan",v:"93.8",h:54},{m:"Feb",v:"94.0",h:58},{m:"Mar",v:"94.1",h:62},{m:"Apr",v:"94.3",h:68},{m:"May",v:"94.6",h:74}]},
];
function dcol(d){ return d==="up"?"#f59e0b":d==="down"?"#2563eb":"var(--green)"; }

/* ---- AI Recommendation deliverable (recomputes with coverage & scenario) ---- */
const AIREC={
  shock:{ conf:85, macroBase:62,
    diag:"Riyadh Segment-A gap of 12,400 units (Y3); the pipeline covers only 35%, after the SAMA rate hike (4.25% → 4.75%, +50bps).",
    diag_zh:"利雅得 A 段缺口 12,400 套(第3年);管线仅覆盖 35%。起因:SAMA 加息(4.25% → 4.75%,+50bps)。",
    attr:"Macro: affordability shock → forced B→A migration. Policy: developer-margin incentives are addressable.",
    attr_zh:"宏观:负担能力下降 → B→A 被迫迁移。政策:开发商利润激励可干预。",
    impacts:[{label:"Seg A gap (Y3)",label_zh:"A 段缺口(Y3)",base:12400,unit:"units",sign:"-"},{label:"Subsidy burden",label_zh:"补贴负担",base:1.8,unit:"SAR B",sign:"+"}],
    measures:[
      {c:"M1", n:"Developer Subsidy +15%", n_zh:"开发商补贴 +15%", supply:"+3,100/yr", gap:"35%→85%", cost:"SAR 2.4B", v:"PROCEED", vt:"good"},
      {c:"M2", n:"Land Release −40%", n_zh:"土地释放 −40%", supply:"+2,000/yr", gap:"+12pp", cost:"SAR 0.8B", v:"PROCEED", vt:"good"},
      {c:"M3", n:"Expedited Permitting", n_zh:"加快审批", supply:"+1,500/yr", gap:"+9pp", cost:"~0", v:"PROCEED NOW", vt:"good"},
      {c:"M4", n:"PPP 5,000-Unit Contract", n_zh:"PPP 5,000 套合同", supply:"+5,000 (Y2+)", gap:"+30pp", cost:"SAR 5.2B", v:"PHASE Q4", vt:"warn"},
      {c:"M5", n:"Mortgage Subsidy +2pp", n_zh:"按揭补贴 +2pp", supply:"none", gap:"neutral", cost:"SAR 3.1B", v:"CONDITIONAL", vt:"warn"},
      {c:"M6", n:"Lower Down Payment 10%→5%", n_zh:"降首付 10%→5%", supply:"none", gap:"35%→38% ✕", cost:"~SAR 4B hidden", v:"AVOID", vt:"bad"},
    ]},
  conv:{ conf:84, macroBase:70,
    diag:"Average project conversion fell 1.4pp to 65.8% (Seg A at 52%).",
    diag_zh:"平均项目转化率下降 1.4pp 至 65.8%(A 段仅 52%)。",
    attr:"Macro: higher rates → affordability & financing approvals. Policy: thin developer margins on affordable units.",
    attr_zh:"宏观:利率上升 → 负担能力与放贷审批。政策:可负担房型开发商利润薄。",
    impacts:[{label:"At-risk Seg A units (3y)",label_zh:"A 段风险单元(3年)",base:2400,unit:"units",sign:"-"}],
    actions:[
      {t:"+15% developer subsidy on Seg A", t_zh:"对 A 段开发商补贴 +15%", owner:"planner", eff:"≈ +9pp conversion recovery", eff_zh:"≈ +9pp 转化回升"},
      {t:"Financing facilitation / installment buy-down", t_zh:"融资便利 / 分期利息补贴", eff:"addresses the macro-driven share", eff_zh:"对冲宏观驱动的部分"},
    ]},
  gap:{ conf:86, macroBase:55,
    diag:"National supply-demand gap widened +3.7% MoM to −39,200 (Y3).",
    diag_zh:"全国供需缺口环比扩大 +3.7% 至 −39,200(第 3 年)。",
    attr:"Macro: demand resilience + rate-driven segment downshift. Policy/supply: pipeline skewed to mid–high segments.",
    attr_zh:"宏观:需求韧性 + 利率驱动的客群下迁。政策/供给:管线偏向中高端。",
    impacts:[{label:"National gap (Y3)",label_zh:"全国缺口(Y3)",base:39200,unit:"units",sign:"-"}],
    actions:[
      {t:"Re-prioritize the pipeline toward Seg A–B", t_zh:"将供给管线向 A–B 段重排", owner:"planner", eff:"rebalances the product mix", eff_zh:"重新平衡产品组合"},
      {t:"Activate Policy A + Tier-1 developers", t_zh:"启动政策 A + 一级开发商", owner:"leader", eff:"gap closure to 85% in priority regions", eff_zh:"优先区域缺口闭合至 85%"},
    ]},
  macroPage:{ conf:88,
    diag:"Interest rate is the dominant driver (price R²=0.81, demand R²=0.73). A +50bps shock propagates demand → gap → subsidy.",
    diag_zh:"利率是主导驱动(价格 R²=0.81、需求 R²=0.73)。+50bps 冲击沿 需求 → 缺口 → 补贴 传导。",
    impacts:[{label:"Riyadh demand (Y1)",label_zh:"利雅得需求(Y1)",base:7.2,unit:"%",sign:"-"},{label:"Seg A gap",label_zh:"A 段缺口",base:1400,unit:"units",sign:"+"},{label:"Subsidy",label_zh:"补贴",base:1.8,unit:"SAR B",sign:"+"}],
    actions:[
      {t:"Accelerate Seg A supply + targeted subsidy", t_zh:"加速 A 段供给 + 定向补贴", owner:"planner", eff:"offsets ≈ ⅓ of the demand shock", eff_zh:"对冲约 ⅓ 的需求冲击"},
      {t:"If Q3 adds +25bps → switch to pessimistic & pre-activate the plan", t_zh:"若 Q3 再 +25bps → 切换悲观情景并提前启动方案", owner:"leader", eff:"contingency trigger", eff_zh:"应急触发条件"},
    ]},
  dq:{ conf:88,
    diag:"DS-07 (MOJ price) feed delayed within the yellow SLA band; price-trend confidence reduced 95% → 88%.",
    diag_zh:"DS-07(司法部房价)在黄色 SLA 区间内延迟;价格趋势置信度由 95% 降至 88%。",
    note:"Operational data-quality issue — neither policy nor market driven. Analysis continues on the last valid snapshot.",
    note_zh:"运营层数据质量问题 —— 既非政策也非市场驱动。分析沿用最近有效快照继续。",
    actions:[
      {t:"Resolve DS-07 pipeline · escalate ticket #DQ-2407", t_zh:"修复 DS-07 管线 · 升级工单 #DQ-2407", owner:"datamgr", eff:"restore price confidence 88% → 95%", eff_zh:"价格置信度 88% → 95%"},
      {t:"Set up automated SLA monitoring with MOJ", t_zh:"与司法部建立自动 SLA 监控", eff:"prevent recurrence", eff_zh:"防止复发"},
    ]},
};
function recCompute(d,cov,scn){
  let macro=null,policy=null;
  if(d.macroBase!=null){ macro=d.macroBase+(scn==="pess"?8:scn==="opt"?-6:0)+(cov==="private"?10:cov==="ministry"?-8:0); macro=Math.max(12,Math.min(90,macro)); policy=100-macro; }
  let conf=cov==="ministry"?95:cov==="private"?80:(d.conf||88); conf+=(scn==="pess"?-3:0); conf=Math.max(60,Math.min(99,Math.round(conf)));
  const f=(scn==="opt"?0.55:scn==="pess"?1.45:1.0)*(cov==="ministry"?0.92:cov==="private"?1.12:1.0);
  return {macro,policy,conf,impacts:(d.impacts||[]).map(im=>({...im,val:im.base*f}))};
}
function fmtImp(val,unit){ if(unit==="%") return Math.abs(val).toFixed(1)+"%"; if(unit==="SAR B") return Math.abs(val).toFixed(1)+" SAR B"; return n0(Math.abs(val))+(unit==="units"?" units":(unit?(" "+unit):"")); }
function AiRec({d}){
  const {t,lang,cov,scn}=useStore();
  const Z=(o,b)=>(lang==="zh"&&o[b+"_zh"])?o[b+"_zh"]:o[b];
  const r=recCompute(d,cov,scn||"base");
  const [calc,setCalc]=useState(false);
  useEffect(()=>{ setCalc(true); const id=setTimeout(()=>setCalc(false),650); return ()=>clearTimeout(id); },[cov,scn]);
  return (<div className="airec">
    <div className="airec-h"><span className="airec-ic">✦</span><span className="airec-t">{t("ai_reco_title")}</span>
      <span className="airec-ctx">{t("cov_"+cov)} · {t("sc_"+(scn||"base"))}</span>
      {calc? <span className="chip info" style={{marginInlineStart:"auto"}}>⟳ {t("ai_recalc")}</span>
           : <span className="chip" style={{marginInlineStart:"auto"}}>{t("confidence")}: {r.conf}%</span>}</div>
    <div className="airec-diag"><b>{t("ai_diag")}:</b> {Z(d,"diag")}</div>
    {r.macro!=null&&<div>
      <div className={"attrbar"+(calc?" recalc":"")}><span className="am" style={{width:r.macro+"%"}}>{r.macro}% {t("ai_macro")}</span><span className="ap" style={{width:r.policy+"%"}}>{r.policy}% {t("ai_policy")}</span></div>
      <div className="airec-note">{Z(d,"attr")}</div>
    </div>}
    {r.impacts.length>0&&<div className="airec-imp"><span className="airec-sub">{t("ai_impact")}:</span>
      {r.impacts.map((im,i)=><span key={i} className={"imp-chip"+(calc?" recalc":"")}>{Z(im,"label")}: <b>{(im.sign||"")+fmtImp(im.val,im.unit)}</b></span>)}</div>}
    {d.note&&<div className="airec-row">{Z(d,"note")}</div>}
    {d.measures? <div>
      <div className="airec-sub">{t("ai_toolkit")}</div>
      <div className="scrollx"><table className="tbl">
        <thead><tr><th>{t("ai_measure")}</th><th>{t("m_supplyImp")}</th><th>{t("ai_gapclose")}</th><th>{t("m_cost")}</th><th>{t("ai_verdict")}</th></tr></thead>
        <tbody>{d.measures.map((mm,i)=>(<tr key={i}>
          <td><b>{mm.c}</b> · {(lang==="zh"&&mm.n_zh)?mm.n_zh:mm.n}</td>
          <td className="mono">{mm.supply}</td><td className="mono">{mm.gap}</td><td className="mono">{mm.cost}</td>
          <td><span className={"chip "+(mm.vt==="good"?"":mm.vt==="warn"?"amber":"danger")}>{mm.v}</span></td>
        </tr>))}</tbody>
      </table></div>
    </div> : <>
      <div className="airec-sub">{t("ai_actions")}</div>
      {(d.actions||[]).map((a,i)=>(<div key={i} className="airec-act"><span className="rk">{i+1}</span>
        <div>{(lang==="zh"&&a.t_zh)?a.t_zh:a.t}<div className="airec-meta">{a.owner?(t("owner")+": "+t(a.owner+"_full")+" · "):""}{(lang==="zh"&&a.eff_zh)?a.eff_zh:a.eff}</div></div></div>))}
    </>}
  </div>);
}

const MOM_MACRO=[
  {k:"SAMA Repo Rate", k_zh:"SAMA 回购利率", may:"4.25%", jun:"4.25%", d:"→ 0 bps", dt:"flat"},
  {k:"CPI Inflation (YoY)", k_zh:"CPI 通胀(同比)", may:"1.6%", jun:"1.8%", d:"↑ +0.2pp", dt:"bad"},
  {k:"GDP Growth (YoY, Q1)", k_zh:"GDP 增长(同比,Q1)", may:"2.8% flash", jun:"3.0% final", d:"↑ +0.2pp", dt:"good"},
  {k:"Unemployment", k_zh:"失业率", may:"3.5% Q4'25", jun:"3.5% Q4'25", d:"→ —", dt:"flat"},
  {k:"Brent Crude ($/bbl)", k_zh:"布伦特原油($/桶)", may:"$82.43", jun:"$80.59", d:"↓ −2.2%", dt:"bad"},
  {k:"Population Growth (est.)", k_zh:"人口增长(估)", may:"1.8%", jun:"1.8%", d:"→ —", dt:"flat"},
];
const MOM_HOUSING=[
  {k:"Riyadh Demand (units)", k_zh:"利雅得需求(套)", may:"14,300", jun:"14,600", d:"↑ +2.1%", dt:"good"},
  {k:"National Supply Pipeline", k_zh:"全国供给管线", may:"50,500", jun:"51,400", d:"↑ +1.8%", dt:"good"},
  {k:"Avg. Conversion Rate", k_zh:"平均转化率", may:"67.2%", jun:"65.8%", d:"↓ −1.4pp", dt:"bad"},
  {k:"National Price Index", k_zh:"全国价格指数", may:"SAR 4,850", jun:"SAR 4,820", d:"↓ −0.6%", dt:"bad"},
  {k:"Supply-Demand Gap (Y3)", k_zh:"供需缺口(第3年)", may:"−37,800", jun:"−39,200", d:"↑ +3.7% widening", dt:"bad"},
  {k:"Data Quality Score", k_zh:"数据质量分", may:"94.1/100", jun:"94.6/100", d:"↑ +0.5", dt:"good"},
];
const KI_SCN=[
  {k:"opt", prob:20, tone:"green", rate:"Rate cut to 3.75%", rate_zh:"降息至 3.75%", gdp:"GDP ↑3.5%"},
  {k:"base",prob:55, tone:"blue", rate:"Hold at 4.25%", rate_zh:"维持 4.25%", gdp:"GDP 2.8%"},
  {k:"pess",prob:25, tone:"red", rate:"Hike to 4.75%", rate_zh:"加息至 4.75%", gdp:"GDP ↓2.0%"},
];
const KI_RISKS=[
  {sev:"red",   t:"SAMA Jul meeting", t_zh:"SAMA 7 月会议", d:"Any ±25bps change triggers a full scenario refresh and impacts all housing forecasts.", d_zh:"任何 ±25bps 变动都会触发完整情景刷新,影响全部住房预测。"},
  {sev:"amber", t:"Brent below $75", t_zh:"布伦特跌破 $75", d:"A sustained decline would pressure fiscal capacity and Eastern-Region employment.", d_zh:"持续下跌将压制财政能力与东部省就业。"},
  {sev:"amber", t:"Housing rent inflation", t_zh:"住房租金通胀", d:"May CPI shows +8.1% YoY in rents; above 10% may trigger an affordability policy response.", d_zh:"5 月 CPI 住房租金同比 +8.1%;若超 10% 可能触发可负担性政策。"},
  {sev:"info",  t:"Seg A demand acceleration", t_zh:"A 段需求加速", d:"Riyadh Seg A registrations +3.2% MoM; if the trend holds, the gap-closure target is at risk.", d_zh:"利雅得 A 段登记环比 +3.2%;若延续,缺口闭合目标承压。"},
];
function tcol(dt){ return dt==="good"?"var(--green-dark)":dt==="bad"?"var(--danger)":"var(--muted)"; }
function CountUp({value,dur=950}){
  const [d,setD]=useState(value);
  useEffect(()=>{
    const str=String(value); const m=str.match(/[−-]?[\d,]+(\.\d+)?/);
    if(!m||typeof performance==="undefined"||typeof requestAnimationFrame==="undefined"){ setD(value); return; }
    const raw=m[0]; const num=parseFloat(raw.replace(/,/g,"").replace("−","-")); if(isNaN(num)){ setD(value); return; }
    const hasComma=raw.indexOf(",")>=0; const dec=(raw.split(".")[1]||"").length;
    const pre=str.slice(0,m.index), suf=str.slice(m.index+raw.length);
    const fmt=n=>{ const neg=n<0; let a=Math.abs(n); let s=dec?a.toFixed(dec):String(Math.round(a)); if(hasComma) s=Number(s).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec}); return pre+(neg?"−":"")+s+suf; };
    const t0=performance.now(); let raf;
    const tick=now=>{ const p=Math.min(1,(now-t0)/dur); const e=1-Math.pow(1-p,3); setD(fmt(num*e)); if(p<1) raf=requestAnimationFrame(tick); else setD(value); };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[value,dur]);
  return d;
}
function Hub(){
  const {t,lang,user,setRoute,cov,scn,setScn}=useStore();
  const Z=(o,b)=>(lang==="zh"&&o[b+"_zh"])?o[b+"_zh"]:o[b];
  return (<div className="fade">
    <PageHeader title={t("nav_hub")+" · "+t("ki_snapshot")} sub={t("ki_sub")}
      right={<span className="ki-legend"><span><span className="dot" style={{background:"var(--green)"}}/>{t("ki_real")}</span><span><span className="dot" style={{background:"#2563eb"}}/>{t("ki_mock")}</span></span>}/>
    <Section title={t("kpis_title")}>
      <div className="ki-grid">
        {KI_KPI.map((k,i)=>{ const c=dcol(k.dir); return (<div key={i} className={"ki-card pop"+(k.real?"":" mock")} style={{animationDelay:(i*55)+"ms"}}>
          <span className={"ki-src "+(k.real?"real":"mock")}>{Z(k,"src")}</span>
          <div className="ki-label">{Z(k,"label")}</div>
          <div className="ki-row">
            <div className="ki-value" style={{color:c}}><CountUp value={String(k.v)}/>{k.unit&&<span className="ki-unit">{k.unit}</span>}</div>
            <div className="ki-spark2" aria-hidden="false">{k.series.map((pt,j)=>
              <span key={j} title={pt.m+(pt.m==="Dec"?" 2025":" 2026")+": "+pt.v} style={{height:pt.h+"%",background:c}}/>)}</div>
          </div>
          <div className="ki-chg" style={{color:c}}>{k.chg}</div>
          <div className="ki-meta">{Z(k,"meta")}</div>
        </div>); })}
      </div>
    </Section>
    <div className="cols-2">
      <Section title={<span className="sect-right"><span className="dot" style={{background:"var(--green)"}}/> {t("ki_macro_title")}</span>}>
        <div className="scrollx"><table className="tbl">
          <thead><tr><th>{t("ki_indicator")}</th><th className="right-num">{t("ki_may")}</th><th className="right-num">{t("ki_jun")}</th><th className="right-num">{t("ki_mom")}</th></tr></thead>
          <tbody>{MOM_MACRO.map((r,i)=>(<tr key={i}><td>{Z(r,"k")}</td><td className="right-num mono muted">{r.may}</td><td className="right-num mono">{r.jun}</td><td className="right-num mono" style={{color:tcol(r.dt),fontWeight:700}}>{r.d}</td></tr>))}</tbody>
        </table></div>
      </Section>
      <Section title={<span className="sect-right"><span className="dot" style={{background:"#2563eb"}}/> {t("ki_housing_title")}</span>}>
        <div className="scrollx"><table className="tbl">
          <thead><tr><th>{t("ki_indicator")}</th><th className="right-num">{t("ki_may")}</th><th className="right-num">{t("ki_jun")}</th><th className="right-num">{t("ki_mom")}</th></tr></thead>
          <tbody>{MOM_HOUSING.map((r,i)=>(<tr key={i}><td>{Z(r,"k")}</td><td className="right-num mono muted">{r.may}</td><td className="right-num mono">{r.jun}</td><td className="right-num mono" style={{color:tcol(r.dt),fontWeight:700}}>{r.d}</td></tr>))}</tbody>
        </table></div>
      </Section>
    </div>
    <Section title={t("ai_analysis")}>
      <div className="cols-2"><AiRec d={AIREC.conv}/><AiRec d={AIREC.gap}/></div>
    </Section>
    <div className="cols-2">
      <Section title={t("ki_scn_title")}>
        <div className="ki-scn">{KI_SCN.map(s=>(<div key={s.k} className={"ki-scn-box "+s.tone+(scn===s.k?" active":"")} style={{cursor:"pointer"}} onClick={()=>setScn(s.k)}>
          <div className="p">{s.prob}%</div>
          <div className="n">{t("sc_"+s.k)}{scn===s.k?(" ← "+t("ki_active")):""}</div>
          <div className="m">{Z(s,"rate")}</div><div className="m">{s.gdp}</div>
        </div>))}</div>
        <div className="scn-bar2">{KI_SCN.map(s=><span key={s.k} className={"seg "+s.tone} style={{width:s.prob+"%"}}/>)}</div>
        <div className="muted" style={{fontSize:11,marginTop:8}}>{t("ki_scn_note")} · {t("ai_scn_hint")}</div>
      </Section>
      <Section title={t("ki_risk_title")}>
        {KI_RISKS.map((r,i)=>(<div key={i} className={"ki-risk "+r.sev}><b>{Z(r,"t")}</b> — {Z(r,"d")}</div>))}
      </Section>
    </div>
    <div className="muted" style={{fontSize:11,textAlign:"center",margin:"4px 0 8px"}}>{t("ki_footer")}</div>
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
  const DZ1="25Q3", DZ2="26Q2";   // divergence risk zone
  return (<div style={{marginTop:6}}>
    <div className="mini-t">{t("hist_rateT")}</div>
    <div style={{width:"100%",height:150}}><C.ResponsiveContainer>
      <C.LineChart data={HIST} margin={{top:6,right:14,left:-10,bottom:0}}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="q" tick={{fontSize:8.5}} interval={1}/>
        <C.YAxis tick={{fontSize:9}} domain={[0,7]} tickFormatter={v=>v+"%"}/>
        <C.Tooltip formatter={v=>v+"%"}/>
        <C.ReferenceArea x1={DZ1} x2={DZ2} fill="#e32700" fillOpacity={0.07}/>
        <C.ReferenceLine x={DZ2} stroke="#e32700" strokeDasharray="4 3" label={{value:t("hist_shock"),fontSize:9,fill:"#e32700",position:"insideTopRight"}}/>
        <C.Line type="monotone" dataKey="r" name={t("hist_rate")} stroke="#e32700" strokeWidth={2.4} dot={{r:2.2}}/>
      </C.LineChart></C.ResponsiveContainer></div>
    <div className="mini-t">{t("hist_unitsT")}</div>
    <div style={{width:"100%",height:210}}><C.ResponsiveContainer>
      <C.LineChart data={HIST} margin={{top:6,right:14,left:-2,bottom:0}}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="q" tick={{fontSize:8.5}} interval={1}/>
        <C.YAxis tick={{fontSize:9}} domain={[8000,17000]} tickFormatter={v=>(v/1000)+"K"}/>
        <C.Tooltip formatter={v=>n0(v)}/><C.Legend wrapperStyle={{fontSize:9.5}}/>
        <C.ReferenceArea x1={DZ1} x2={DZ2} fill="#e32700" fillOpacity={0.07}/>
        <C.Line type="monotone" dataKey="rd" name={t("hist_rd")} stroke="#2563eb" strokeWidth={2.4} dot={false}/>
        <C.Line type="monotone" dataKey="rs" name={t("hist_rs")} stroke="#93b8f0" strokeWidth={1.8} strokeDasharray="5 3" dot={false}/>
        <C.Line type="monotone" dataKey="ed" name={t("hist_ed")} stroke="#1B8354" strokeWidth={2.4} dot={false}/>
        <C.Line type="monotone" dataKey="es" name={t("hist_es")} stroke="#8fd0b0" strokeWidth={1.8} strokeDasharray="5 3" dot={false}/>
      </C.LineChart></C.ResponsiveContainer></div>
  </div>);
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
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:8.5}} interval={0} angle={-18} textAnchor="end" height={44}/><C.YAxis domain={[-1,1]} ticks={[-1,-0.6,0,0.6,1]} tick={{fontSize:9}}/>
        <C.Tooltip/><C.Legend wrapperStyle={{fontSize:9}}/><C.ReferenceLine y={0} stroke="#9aa3ab"/><C.ReferenceLine y={0.6} stroke="#e32700" strokeDasharray="4 4"/><C.ReferenceLine y={-0.6} stroke="#e32700" strokeDasharray="4 4"/>
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
function downloadBriefing(){
  // the briefing is the original MOMAH PDF embedded as base64 — download it verbatim as .pdf
  try{ const bin=window.atob(REPORTS_B64.briefing||""); const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const blob=new Blob([bytes],{type:"application/pdf"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="DSO_Ministerial_Briefing.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){ window.print(); }
}
/* ---- Multi-agent reasoning theater data ---- */
const DS11=[["DS-01","Sakani"],["DS-02","Wafi"],["DS-03","IDMS"],["DS-04","Ejari"],["DS-05","MoF/Budget"],["DS-06","SEC"],["DS-07","MOJ Price"],["DS-08","GASTAT"],["DS-09","Private Mkt"],["DS-10","Geo/GIS"],["DS-11","Banks/Loans"]];
const AGENTS_T=[
 {ag:"Orchestrator Agent",ag_zh:"编排 Agent",ic:"✦",lyr:"L3",io:{in:"User query (NL)",out:"Routed task + plan"},lines:[
   {k:"think",t:"Let me understand the core first… an unexpected +50bps is a monetary-policy shock.",t_zh:"让我先理解这个问题的核心……SAMA 突然加息 50 个基点,属于非预期的货币政策冲击。"},
   {k:"think",t:"I'll decompose it: macro transmission, housing-segment impact, supply-demand imbalance, fiscal sustainability, and feasible policy response.",t_zh:"我从几个维度拆解:宏观传导路径、住房市场细分影响、供需失衡变化、财政可持续性,以及可行的政策应对。"},
   {k:"call",t:"This needs several BRD agents — Macro, Demand, Balancing, Fiscal, Policy. Query model registry → match capability.",t_zh:"这涉及多个 BRD Agent 协作——Macro、Demand、Balancing、Fiscal、Policy。查询模型注册表 → 能力匹配。",ds:[]},
   {k:"think",t:"Routing confidence 92% ≥ 70% threshold → auto-run, no escalation.",t_zh:"路由置信 92% ≥ 70% 阈值 → 自动执行,无需升级。"},
   {k:"out",t:"I'll wake Macro Agent first to build the rate-transmission frame, and parallelize the rest.",t_zh:"先唤醒 Macro Agent 建立利率传导的基础框架,其余并行+串行协同。"}]},
 {ag:"Data Quality Monitor",ag_zh:"数据质量监控",ic:"◉",lyr:"L2",io:{in:"11 raw sources",out:"Validated dataset · conf 88%"},lines:[
   {k:"call",t:"Pull 11 data sources in parallel",t_zh:"并行拉取 11 个数据源",ds:["DS-01","DS-02","DS-03","DS-04","DS-05","DS-06","DS-07","DS-08","DS-09","DS-10","DS-11"]},
   {k:"think",t:"Check completeness — 11/11 above 95% record coverage",t_zh:"完整性检查 —— 11/11 记录覆盖率 > 95%"},
   {k:"think",t:"Check timeliness — DS-09 Private Mkt latency was 26h, now 1h (recovered)",t_zh:"时效检查 —— DS-09 私有市场延迟曾 26h,现 1h(已恢复)"},
   {k:"think",t:"Cross-source consistency — Ejari vs MOJ price delta within 2%",t_zh:"跨源一致性 —— Ejari 与 MOJ 价格偏差 < 2%"},
   {k:"calc",t:"Data confidence = min(source confidences)",t_zh:"数据置信 = min(各源置信)",val:"88%"},
   {k:"out",t:"11/11 passed (Private Mkt recovered) — cleared into analysis",t_zh:"11/11 通过(Private Mkt 已恢复)— 放行进入分析"}]},
 {ag:"Macro-Economic Agent",ag_zh:"宏观经济引擎",ic:"🌐",lyr:"L3",io:{in:"Rates, FX peg, demographics",out:"Transmission frame · r=−0.85"},lines:[
   {k:"think",t:"On it. Saudi has a special feature — the riyal is pegged to USD at 3.75, so SAMA's policy space is effectively \"imported\" from the Fed. This +50bps largely follows the global tightening cycle, but the domestic cycle isn't synced — we have large Vision-2030 investment demand, not overheating-driven inflation.",t_zh:"收到。沙特有个特殊之处——里亚尔与美元挂钩在 3.75,SAMA 的货币政策空间实际上是被美联储\"进口\"的。这次 +50bps 很大程度是跟随全球紧缩周期,但国内周期并不同步——我们有 Vision 2030 的大规模投资需求,不是过热型通胀。"},
   {k:"calc",t:"A few key numbers: mortgage stock ≈ SAR 680B, of which 78% is floating-rate. The +50bps passes through fast — SAIBOR 3M reacts immediately and mortgage rates rise ~35–50bps.",t_zh:"说几个关键数字:按揭存量大概 SAR 680B,其中 78% 是浮动利率。+50bps 传导很直接——SAIBOR 3M 立刻反应,按揭利率上浮约 35–50bps。",val:"+35–50bps"},
   {k:"calc",t:"On 2016–2026 panel data, the Pearson r between the repo rate and housing demand is −0.85 — highly significant — with about a 2-quarter lag.",t_zh:"用 2016–2026 面板数据,SAMA 回购利率与住房需求量的 Pearson r 是 −0.85,统计上非常显著,约有 2 个季度滞后。",val:"r=−0.85"},
   {k:"think",t:"Interestingly, population growth vs demand is +0.92 — so short term the rate shock dominates, while over 3–5y demographics partly offset it, but never fully (the path dependence is strong).",t_zh:"但有趣的是,人口增长与住房需求的相关性是 +0.92——短期利率冲击主导,中长期人口因素部分对冲,但不会完全抵消(路径依赖很强)。",val:"+0.92"},
   {k:"out",t:"Transmission frame set; the rate shock dominates the short term.",t_zh:"传导框架确立;短期利率冲击主导。"}]},
 {ag:"Demand Intelligence Agent",ag_zh:"需求智能引擎",ic:"📈",lyr:"L3",io:{in:"Beneficiary + segment data",out:"Asymmetric shock −2% / −9% / −18%"},lines:[
   {k:"think",t:"I'll take it. The core issue is that the hit is asymmetric across income groups — I calibrated the elasticity model on Saudi household-survey data.",t_zh:"好的,我接过来。这次的核心是——加息对不同收入群体的打击是不对称的。我根据沙特住户调查数据校准了弹性模型。"},
   {k:"calc",t:"High income (SAR 25K+): barely affected — 40% pay cash, and +SAR 200–300/mo is absorbable. Demand shock ≈ −2%, negligible.",t_zh:"高收入(月入 SAR 25K 以上):几乎不受影响——40% 现金购房,即便月供多 SAR 200–300 也可吸收。需求冲击约 −2%,可忽略。",val:"−2%"},
   {k:"calc",t:"Middle (SAR 10–25K): feeling it — 72% mortgage-dependent, +~SAR 250/mo, ~5–7% \"wait and see\". Demand shock ≈ −9%.",t_zh:"中收入(SAR 10–25K):开始有压力——按揭依赖度 72%,月供 +约 SAR 250,约 5–7% 选择\"等等看\",需求冲击约 −9%。",val:"−9%"},
   {k:"calc",t:"What worries me is the most-in-need (<SAR 10K): 85% mortgage-dependent; +SAR 180/mo is 4.2% of disposable income. Demand shock ≈ −18%.",t_zh:"真正担心的是最需要群体(月入 SAR 10K 以下):85% 依赖按揭,月供 +SAR 180 占其可支配收入的 4.2%,需求冲击约 −18%。",val:"−18%"},
   {k:"think",t:"Structural catch: that 18% don't stop buying — they downgrade from low-income to most-in-need housing. A squeeze effect that raises latent most-in-need demand instead.",t_zh:"结构性问题:这 18% 不是\"不买房了\",而是从低收入住宅降级到最需要住宅——挤压效应,反而抬高最需要群体的隐性需求。"},
   {k:"out",t:"Selective shock; the most-in-need bear disproportionate harm.",t_zh:"选择性冲击;最需要群体承受不成比例的伤害。"}]},
 {ag:"Supply-Demand Balancing Agent",ag_zh:"供需平衡引擎",ic:"⚖",lyr:"L3",io:{in:"Demand + pipeline",out:"Gap 12,400 · 35% · RED"},lines:[
   {k:"think",t:"Hold on — hearing Demand's analysis, this is worse than I expected. Let me compute directly.",t_zh:"等一下,我听到 Demand 的分析了,这比预想严重。让我直接算一下。"},
   {k:"call",t:"Current pipeline is YTD 62,400 units (full-year target 78,000).",t_zh:"当前供给管线 YTD 62,400 套(全年目标 78,000)。",ds:["DS-03","DS-08"]},
   {k:"calc",t:"Most-in-need existing gap 12,400, pipeline coverage only 35% — already RED (BRD §6.2 threshold 50%).",t_zh:"最需要群体现有缺口 12,400 套,管线覆盖率仅 35%——这本身已是 RED(BRD §6.2 阈值 50%)。",val:"12,400 · 35%"},
   {k:"think",t:"If Riyadh demand falls 11%, nominal effective demand ≈ 68,400 and the gap looks smaller — but that's a dangerous statistical illusion: it shrank because fewer can afford to buy.",t_zh:"若利雅得总需求下降 11%,名义有效需求约 68,400 套,表面缺口缩小——但这是危险的统计幻觉:缩小是因为\"买得起房的人少了\"。"},
   {k:"calc",t:"What to watch: latent most-in-need demand rises to ~15,200 units, +22% over the original.",t_zh:"真正要警惕的:最需要群体隐性需求增加到约 15,200 套,比原来多 +22%。",val:"15,200 · +22%"},
   {k:"think",t:"Worse, these needs are real but unmet at current conditions — a \"structural demand deficit\". Absorption falls 43% → 38%, tripping my RED alert.",t_zh:"更糟的是这些需求是\"有效的\"但在当前条件下无法实现——结构性需求赤字。吸收率从 43% 跌到 38%,已触发 RED 预警。",val:"43%→38%"},
   {k:"out",t:"Structural demand deficit — RED early-warning tripped.",t_zh:"结构性需求赤字 —— 触发 RED 早期预警。"}]},
 {ag:"Conversion & Absorption Agent",ag_zh:"转化吸纳引擎",ic:"🎯",lyr:"L3",io:{in:"Pipeline + conversion rates",out:"Early-warning · residual gap 6,200"},lines:[
   {k:"calc",t:"Seg A conversion 52% vs Seg E 78%",t_zh:"Seg A 转化率 52% vs Seg E 78%",val:"−26pp"},
   {k:"think",t:"Root cause: long approval cycles · thin developer margins · cancellation risk",t_zh:"根因:审批周期长 · 开发商利润薄 · 取消风险高"},
   {k:"calc",t:"Even if all 23 Seg-A projects hit 100%: 12,900 − 19,100",t_zh:"即便 23 个 A 段项目 100% 兑现:12,900 − 19,100",val:"gap 6,200"},
   {k:"think",t:"Conclusion: pipeline acceleration alone can't close it",t_zh:"结论:仅靠加速管线无法补足"},
   {k:"out",t:"Must add new supply — triggers early-warning to Planning",t_zh:"必须新增供给 —— 触发早期预警至规划"}]},
 {ag:"Policy Simulation Agent",ag_zh:"政策模拟引擎",ic:"🛡️",lyr:"L3",io:{in:"Gap + fiscal cap SAR 3.2B",out:"Recommend Combo #4 · 97%"},lines:[
   {k:"think",t:"Systematic simulation. Constraint: fiscal cap SAR 3.2B (Fiscal's available space); objective: maximize most-in-need gap closure without hurting the Vision-2030 core pipeline.",t_zh:"做系统性政策模拟。约束:财政上限设为 SAR 3.2B(Fiscal 给的可用空间);目标:最需要群体缺口闭合率最大化,且不影响 Vision 2030 核心管线。"},
   {k:"calc",t:"Monte-Carlo over 6 options — M1 mortgage subsidy (1.8B, 28%), M2 Sakani expansion (2.4B, 34%), M3 developer incentive (1.2B, 22%).",t_zh:"对 6 套方案跑蒙特卡洛——M1 按揭补贴(1.8B,28%)、M2 Sakani 扩容(2.4B,34%)、M3 开发商激励(1.2B,22%)。"},
   {k:"calc",t:"M4 Combo = M2 + M3 + 5,000-unit PPP fast-track: cost SAR 3.2B, gap closure 97%.",t_zh:"M4 组合 = M2 + M3 + 5,000 套 PPP 快速通道:成本 SAR 3.2B,缺口闭合 97%。",val:"97% · SAR 3.2B"},
   {k:"think",t:"M5 rental vouchers (0.8B, 15%) are a low-cost transitional add-on; M6 austerity (−4.0B, 0%) adds no supply.",t_zh:"M5 租赁券(0.8B,15%)可作低成本过渡;M6 财政紧缩(−4.0B,0%)不增加供给。"},
   {k:"out",t:"Recommend Combo #4 — 97% closure, within the fiscal cap, PPP leverages private capital, 6–12-month effect; start M5 vouchers immediately.",t_zh:"推荐 Combo #4——97% 闭合、成本在上限内、PPP 撬动私人资本、6–12 个月生效;M5 租赁券可立刻启动作过渡。"}]},
 {ag:"Fiscal Sustainability Agent",ag_zh:"财政可持续引擎",ic:"﷼",lyr:"L3",io:{in:"Debt, Sakani budget, Vision-2030 pipeline",out:"Net impact SAR 8B · index 72→67"},lines:[
   {k:"think",t:"Let me add the fiscal view. Everyone discussed micro and meso impacts — I need to put this into the fiscal frame.",t_zh:"我来从财政角度补充一下。大家刚才讨论的都是微观和中观层面的影响,但我需要把这个放到财政框架里看。"},
   {k:"calc",t:"First, sovereign debt: public debt is SAR 1,150B (27% of GDP) — not high. But +50bps means new 1-yr issuance pays ~SAR 5.8B more interest — about 15% of Sakani's annual budget.",t_zh:"首先,主权债务:沙特公债现在是 SAR 1,150B,占 GDP 27%,还不算高。但 +50bps 意味着新的一年期发行要多付约 SAR 5.8B 利息——相当于 Sakani 年预算的 15%。",val:"+SAR 5.8B"},
   {k:"calc",t:"Second, a Sakani paradox: weaker demand should cut subsidy spend (save 2.4–3.6B), but the most-in-need need MORE support or they're priced out — extra 1.8–2.2B.",t_zh:"其次,Sakani 补贴体系面临矛盾:需求收缩本应让补贴下降(省 SAR 2.4–3.6B),但最需要群体反而需要更多补贴支持,否则被彻底挤出市场——额外支出 SAR 1.8–2.2B。",val:"+1.8–2.2B"},
   {k:"calc",t:"Third, Vision 2030 (ROSHN/NEOM/Red Sea, SAR 1.3T committed): financing cost up SAR 3.2–5B; though sovereign-backed, ~12% of mid-size developers may not survive (margins under 5%).",t_zh:"第三,Vision 2030(ROSHN、NEOM、红海新城,SAR 1.3T 已承诺管线):融资成本上升 SAR 3.2–5B;虽有主权担保,但约 12% 中型开发商可能扛不住(利润率掉到 5% 以下)。"},
   {k:"out",t:"All in, net fiscal impact ≈ SAR 8B/yr (±2B); sustainability index 72 → 67. Not critical — but with Brent at $74.32 (below the $75 breakeven), fiscal space is narrowing.",t_zh:"综合来看,我估算财政净冲击大概 SAR 8B(年化,±2B);财政可持续性指数从 72 降到 67。还不算危急——但加上 Brent 在 $74.32(低于 $75 盈亏线),财政空间确实在收窄。",val:"≈ SAR 8B · 72→67"}]},
 {ag:"Governance Gate · Human-in-the-Loop",ag_zh:"治理门 · 人工复核",ic:"!",lyr:"L4",gate:true,io:{in:"Draft recommendation",out:"Awaiting human approval"},lines:[
   {k:"think",t:"Severity = RED and gap > 30% → above autonomous scope",t_zh:"严重度 = 红色 且 缺口 > 30% → 超出自治范围"},
   {k:"think",t:"Fiscal exposure > SAR 2B → finance-continuity review required",t_zh:"财政敞口 > SAR 20 亿 → 需要财政延续性复核"},
   {k:"think",t:"Guardrails: HUMAN-REVIEWED 04:48 · LEGAL CLEARED 05:31",t_zh:"护栏:HUMAN-REVIEWED 04:48 · LEGAL CLEARED 05:31"},
   {k:"think",t:"Hold output as draft → requires Planning Manager approval",t_zh:"产出保持草稿 → 需 Planning Manager 批准"}]},
 {ag:"Orchestrator · Final Output",ag_zh:"协调器 · 最终输出",ic:"✦",lyr:"L5",io:{in:"Approved recommendation",out:"Briefing · alert · SSOT"},lines:[
   {k:"think",t:"Connecting the threads: Macro showed transmission is real (r=−0.85); Demand showed the shock is selective (−18% vs −2%); Balance revealed the paradox (nominal gap shrinks, structural gap worsens); Fiscal showed space is squeezed from both ends. A rate cut can't fix this — we need a structural toolkit.",t_zh:"把几条线串起来:Macro 显示传导真实(r=−0.85);Demand 显示冲击有选择性(−18% vs −2%);Balance 揭示悖论(名义缺口缩小、结构性缺口恶化);Fiscal 显示财政两头受压。降息无法解决——需要结构性工具箱。"},
   {k:"out",t:"Core conclusion: a localized shock — negligible for high income, mild for middle, structural for the most-in-need. Don't read the shrinking nominal gap; watch the worsening gap structure.",t_zh:"核心结论:这是局部冲击——高收入几乎无影响,中收入温和,但对最需要群体是结构性的。不要只看名义缺口缩小,要关注缺口结构的恶化。"},
   {k:"out",t:"Fiscal: the SAR 8B net hit is manageable within buffers — provided Brent doesn't keep falling; below $70, trigger contingency immediately.",t_zh:"财政:SAR 8B 净冲击在缓冲内可控,但前提是 Brent 不再下跌;跌破 $70 须立即触发应急。"},
   {k:"out",t:"Policy path: Combo #4 (Sakani + developer + PPP) — affordable, effective, fast to start.",t_zh:"政策路径:Combo #4(Sakani + 开发商 + PPP)——成本可控、效果显著、可快速启动。"},
   {k:"out",t:"Watchlist: ① Brent $70 line ② absorption 40% RED ③ developer margin 5% floor — any breach escalates the response.",t_zh:"监控清单:① Brent $70 警戒线 ② 吸收率 40% RED ③ 开发商利润率 5% 底线——任一突破即升级响应。"},
   {k:"out",t:"Generate briefing (PDF) + early-warning → audit log → SSOT push to AI_H_03 / CoPilot.",t_zh:"生成简报(PDF)+ 早期预警 → 写入审计日志 → SSOT 推送 AI_H_03 / CoPilot。"}]},
];
/* ---- BRD Agent Action List (left rail) — actions only, no type/description ---- */
const AGENT_ACTIONS=[
 {key:"orch", name:"Orchestrator Agent",name_zh:"编排 Agent",acts:["think_intent","think_route","think_compose","think_perm","gen_report","push_log"]},
 {key:"dq",   name:"Data Quality Monitor",name_zh:"数据质量监控",acts:["scan_sources","flag_degraded","emit_alert","report_dq","ticket_dq"]},
 {key:"macro",name:"Macro-Economic Agent",name_zh:"宏观经济引擎",acts:["think_run","compute_corr","project_gdp","monitor_fiscal","render_macro_chart","analyze_transmission"]},
 {key:"demand",name:"Demand Intelligence Agent",name_zh:"需求智能引擎",acts:["think_run","compute_elasticity","segment_migration","forecast_demand","render_seg_chart","assess_affordability"]},
 {key:"sdb",  name:"Supply-Demand Balancing Agent",name_zh:"供需平衡引擎",acts:["think_run","compute_gap","assess_coverage","analyze_rootcause","render_heatmap","project_absorption"]},
 {key:"conv", name:"Conversion & Absorption Agent",name_zh:"转化吸纳引擎",acts:["think_run","monitor_absorption","forecast_conv","map_pipeline","assess_margin","render_conv_chart"]},
 {key:"policy",name:"Policy Simulation Agent",name_zh:"政策模拟引擎",acts:["think_run","simulate_measure","rank_combos","recommend","assess_risk","render_policy_chart"]},
 {key:"fin",  name:"Financial Sustainability Agent",name_zh:"财政可持续引擎",acts:["assess_sovereign_debt","analyze_subsidy","evaluate_v2030","compute_sustainability_index","monitor_oil_breakeven","assess_reserves"]},
];
AGENT_ACTIONS.forEach(a=>{ const o=a.acts.map((_,i)=>i); for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];} a.order=o; });
// readable labels for action codes (BRD Type column)
const ACTLABEL={
 think_intent:["Intent understanding","意图理解"],think_route:["Engine routing","引擎路由"],think_compose:["Output composition","输出组合"],think_perm:["Permission check","权限校验"],gen_report:["Report generation","报告生成"],push_log:["Audit trail","审计留痕"],
 scan_sources:["Source scan","数据源扫描"],flag_degraded:["Degradation flag","降级标记"],emit_alert:["Alert trigger","触发预警"],report_dq:["Quality report","质量报告"],ticket_dq:["Ticket creation","创建工单"],
 think_run:["Run analysis","执行分析"],compute_corr:["Correlation","相关性计算"],project_gdp:["GDP projection","GDP 预测"],monitor_fiscal:["Fiscal monitor","财政监测"],render_macro_chart:["Visualization","可视化"],analyze_transmission:["Transmission","传导分析"],
 compute_elasticity:["Elasticity","弹性计算"],segment_migration:["Segment migration","段位迁移"],forecast_demand:["Demand forecast","需求预测"],render_seg_chart:["Visualization","可视化"],assess_affordability:["Affordability","可负担性"],
 compute_gap:["Gap quantification","缺口量化"],assess_coverage:["Coverage","覆盖评估"],analyze_rootcause:["Root-cause","根因分解"],render_heatmap:["Visualization","可视化"],project_absorption:["Absorption","吸纳预测"],
 monitor_absorption:["Absorption","吸纳监测"],forecast_conv:["Conversion forecast","转化预测"],map_pipeline:["Pipeline mapping","管线映射"],assess_margin:["Margin analysis","利润分析"],render_conv_chart:["Visualization","可视化"],
 simulate_measure:["Measure simulation","逐项模拟"],rank_combos:["Combo ranking","组合排序"],recommend:["Recommendation","方案推荐"],assess_risk:["Risk assessment","风险评估"],render_policy_chart:["Visualization","可视化"],
 assess_sovereign_debt:["Sovereign debt","主权债务"],analyze_subsidy:["Subsidy analysis","补贴分析"],evaluate_v2030:["V2030 financing","V2030 融资"],compute_sustainability_index:["Sustainability index","可持续指数"],monitor_oil_breakeven:["Oil breakeven","油价监测"],assess_reserves:["Reserve check","储备评估"],
};
function brdKeyOf(name){ if(/Orchestrator/.test(name))return "orch"; if(/Data Quality/.test(name))return "dq"; if(/Macro/.test(name))return "macro"; if(/Demand Intelligence/.test(name))return "demand"; if(/Supply-Demand Balancing/.test(name))return "sdb"; if(/Conversion/.test(name))return "conv"; if(/Policy Simulation/.test(name))return "policy"; if(/Fiscal|Financial/.test(name))return "fin"; return null; }

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
// AI Financial Sustainability — first-principles score: budget safety 30 + efficiency 25 + HBR 25 + risk 20
const FISCAL_BUDGET=7.9, CONTRACT_TARGET=510000, CONTRACT_COST=141444;
const FISCAL_DEFAULTS={burn:67,eff:0.82,hbr:36,leak:5,mape:7,contracts:127952};
function computeFiscalContinuity(lv){
  const budgetScore = lv.burn<70?30:lv.burn<85?20:10;
  const effScore = Math.min(25, (lv.eff/1.0)*25);
  const hbrProgress = (40-lv.hbr)/(40-30);                 // 40→30 = 100% progress
  const hbrScore = Math.min(25, Math.max(0,hbrProgress)*25);
  const leakScore = lv.leak<7?10:5, fcScore = lv.mape<8?10:5;
  const riskScore = leakScore+fcScore;
  const score = Math.round(budgetScore+effScore+hbrScore+riskScore);
  const tone = score>=70?"good":score>=50?"warn":"bad";
  const consumed = +(FISCAL_BUDGET*lv.burn/100).toFixed(1);          // SAR B consumed
  const historical = +(lv.contracts*CONTRACT_COST/1e9).toFixed(1);  // SAR B historical exposure
  const contractPct = Math.round(lv.contracts/CONTRACT_TARGET*100);
  const approve = lv.burn<70 && lv.hbr<40 && lv.leak<7;
  return {budgetScore,effScore:+effScore.toFixed(1),hbrScore:+hbrScore.toFixed(1),riskScore,score,tone,consumed,historical,contractPct,approve};
}
function FiscalContinuityPanel({compact=false,lv:lvP,setLv:setLvP,active=false}){
  const {lang}=useStore();
  const L=(en,zh)=>lang==="zh"?zh:en;
  const [lvI,setLvI]=useState(FISCAL_DEFAULTS);
  const lv=lvP||lvI, setLv=setLvP||setLvI;
  const m=useMemo(()=>computeFiscalContinuity(lv),[lv]);
  const set=(k,v)=>setLv(prev=>({...prev,[k]:Number(v)}));
  const COL={good:"var(--green-dark)",warn:"var(--amber)",bad:"var(--danger)"};
  const band=m.score>=90?{t:"good",l:L("Excellent","优秀")}:m.score>=70?{t:"good",l:L("Good","良好")}:m.score>=50?{t:"warn",l:L("Warning","预警")}:{t:"bad",l:L("Critical","危急")};
  const chipCls=band.t==="good"?"":band.t==="warn"?" amber":" danger";
  const burnT=lv.burn<70?"good":lv.burn<85?"warn":"bad";
  const effT=lv.eff>=1?"good":lv.eff>=0.7?"warn":"bad";
  const hbrT=lv.hbr<=35?"good":lv.hbr<=38?"warn":"bad";
  const n0=v=>Math.round(v).toLocaleString("en-US");
  const rows=[
    {k:"burn",label:L("Budget consumption","预算消耗"),min:0,max:100,step:1,val:lv.burn,fmt:v=>v+"%",note:L("threshold 70% / 85%","阈值 70% / 85%")},
    {k:"eff",label:L("Spending efficiency","支出效率"),min:0.4,max:1.4,step:.01,val:lv.eff,fmt:v=>v.toFixed(2),note:L("contracts/SAR · target 1.0","合同/SAR · 目标 1.0")},
    {k:"hbr",label:L("Housing burden ratio","住房负担比 HBR"),min:30,max:45,step:.5,val:lv.hbr,fmt:v=>v+"%",note:L("40→36, target 30","40→36, 目标 30")},
    {k:"contracts",label:L("Contract progress","合同进度"),min:0,max:CONTRACT_TARGET,step:1000,val:lv.contracts,fmt:v=>n0(v),note:m.contractPct+"% · /510,000"},
    {k:"leak",label:L("Leakage detection (days)","泄漏检测(天)"),min:1,max:21,step:1,val:lv.leak,fmt:v=>v+"d",note:L("target < 7 days","目标 < 7 天")},
    {k:"mape",label:L("Forecast accuracy (MAPE)","预测准确度 MAPE"),min:2,max:20,step:.5,val:lv.mape,fmt:v=>v+"%",note:L("target < 8%","目标 < 8%")},
  ];
  const shown=rows.slice(0,3);   // unified to 3 sliders (match the 3 KPI cards) in both intro and theater
  return (<div className={"fiscal-card"+(compact?" compact":"")+(active?" synced":"")}>
    <div className="fiscal-head">
      <div><div className="eyebrow">{L("AI financial sustainability","AI 财政可持续性")}{active&&<span className="synced-tag">↔ {L("synced","已同步")}</span>}</div>
        <h3>{L("Is this recommendation fiscally sustainable through the budget cycle?","这套建议在财政上能否持续(撑过预算周期)?")}</h3></div>
      <span className={"chip"+chipCls} title={band.l}>{L("Score","评分")} {m.score}/100</span>
    </div>
    {active&&<div className="synced-note">{L("From Financial Sustainability Agent: sustainability index 72 → 67 · net fiscal impact ≈ SAR 8B","来自 财政可持续 Agent:可持续指数 72 → 67 · 净财政冲击 ≈ SAR 8B")}</div>}
    <div className="fiscal-metrics">
      <div><span>{L("Budget burn","预算消耗")}</span><b style={{color:COL[burnT]}}>{lv.burn}%</b></div>
      <div><span>{L("Spending eff.","支出效率")}</span><b style={{color:COL[effT]}}>{lv.eff.toFixed(2)}</b></div>
      <div><span>{L("HBR","住房负担比")}</span><b style={{color:COL[hbrT]}}>{lv.hbr}%</b></div>
    </div>
    <div className="fiscal-controls">
      {shown.map(r=><label key={r.k} className="fslider">
        <span><b>{r.label}</b><em>{r.fmt(r.val)}</em></span>
        <input type="range" min={r.min} max={r.max} step={r.step} value={r.val} onChange={e=>set(r.k,e.target.value)}/>
        <small className="fnote">{r.note}</small>
      </label>)}
    </div>
    <div className="calc-chain">
      <div><b>1</b><span>{L("Budget pressure","预算压力")} = SAR {FISCAL_BUDGET}B × {lv.burn}% + {n0(lv.contracts)} × SAR {n0(CONTRACT_COST)} = <strong>SAR {m.consumed}B</strong> {L("consumed","已耗")} + SAR {m.historical}B {L("exposure","历史敞口")}</span></div>
      <div><b>2</b><span>{L("Score","评分")} = {L("budget","预算")} {m.budgetScore} + {L("eff","效率")} {m.effScore} + HBR {m.hbrScore} + {L("risk","风险")} {m.riskScore} = <strong>{m.score}/100</strong> · {band.l}</span></div>
      <div><b>3</b><span>{L("Decision","决策")} = {m.approve?<strong style={{color:"var(--green-dark)"}}>{L("Approve allocation","批准分配")}</strong>:<strong style={{color:"var(--danger)"}}>{L("Escalate to Minister","上报部长")}</strong>} <span className="muted">({L("burn<70 AND HBR↓ AND leakage<7d","消耗<70 且 HBR↓ 且 泄漏<7天")})</span></span></div>
    </div>
    {!compact&&<div className="output-stack">
      <div><span>Output</span><b>{L("Fiscal-safe allocation recommendation","财政安全分配建议")}</b></div>
      <div><span>API</span><b>/subsidy/v1/scenario/fiscal-sustainability</b></div>
      <div><span>Dispatch</span><b>CoPilot + AI_H_03 + audit log</b></div>
    </div>}
  </div>);
}
function ReasoningStatus({ai,L,Z}){
  const active = ai.ag>=0 && ai.ag<AGENTS_T.length ? AGENTS_T[ai.ag] : null;
  const line = active && ai.line>=0 ? active.lines[ai.line] : null;
  const sourceCount = Object.keys(ai.ds||{}).length;
  const status = ai.done?L("Output package ready","产出包已就绪"):ai.gate?L("Waiting for human gate","等待人工治理门"):active?Z(active,"ag"):L("Ready","就绪");
  return (<div className="reasoning-status card">
    <div className="rs-cell live"><span className="livedot"/><span>{L("Active AI work","当前 AI 动作")}</span><b>{status}</b></div>
    <div className="rs-cell"><span>{L("Current step","当前步骤")}</span><b>{line?Z(line,"t"):L("Preparing routing plan","准备路由计划")}</b></div>
    <div className="rs-cell"><span>{L("Sources touched","已触达数据源")}</span><b>{sourceCount}/11</b></div>
    <div className="rs-cell"><span>{L("Next output","下一项输出")}</span><b>{L("recommendation + API payload + PDF","建议 + API Payload + PDF")}</b></div>
  </div>);
}
function ChatAnalysis(){
  const {t,lang,cov,pushLog,setRoute,addReport,seed,clearSeed}=useStore();
  const [ai,setAi]=useState({on:false,ag:-1,line:-1,ds:{},gate:false,done:false,playing:false});
  const [flow,setFlow]=useState(false);
  const [flv,setFlv]=useState(FISCAL_DEFAULTS);
  const fres=computeFiscalContinuity(flv);
  const [q,setQ]=useState("");
  const tRef=useRef(null); const aiRef=useRef(ai); aiRef.current=ai; const endRef=useRef(null); const streamRef=useRef(null);
  const Z=(o,k)=>(lang==="zh"&&o[k+"_zh"])?o[k+"_zh"]:o[k];
  const L=(en,zh)=>lang==="zh"?zh:en;
  const orchSt=!ai.on?L("ready","就绪"):ai.done?L("done","已完成"):ai.gate?L("awaiting approval","待批准"):L("running","运行中");
  const mafChip=<button className="maf-chip" onClick={()=>setFlow(true)} title={L("Open agent I/O flow","展开 Agent I/O 流")}>⛓ Multi-Agent Flow · {orchSt} ▸</button>;
  useEffect(()=>()=>clearTimeout(tRef.current),[]);
  useEffect(()=>{ if(ai.on&&streamRef.current){ const el=streamRef.current; el.scrollTo({top:el.scrollHeight,behavior:"smooth"}); } },[ai]);
  function advance(cur){
    const ag=AGENTS_T[cur.ag];
    if(cur.line<ag.lines.length-1){
      const nl=cur.line+1, ln=ag.lines[nl], ds={...cur.ds};
      if(ln.k==="call"&&ln.ds) ln.ds.forEach(d=>{ds[d]=true;});
      const next={...cur,line:nl,ds}; setAi(next);
      if(cur.playing) tRef.current=setTimeout(()=>advance(next), ln.k==="calc"?900:ln.k==="call"?850:680);
    } else if(ag.gate){ setAi({...cur,gate:true,playing:false}); }
    else if(cur.ag<AGENTS_T.length-1){ const next={...cur,ag:cur.ag+1,line:-1}; setAi(next); pushLog("log_route"); if(cur.playing) tRef.current=setTimeout(()=>advance(next),500); }
    else { setAi({...cur,done:true,playing:false}); pushLog("log_report"); addReport({ref:"DSO-2026-0619-URG-001",nameKey:"repName_brief",cov,conf:88}); }
  }
  function start(){ clearTimeout(tRef.current); pushLog("log_cross"); const cur={on:true,ag:0,line:-1,ds:{},gate:false,done:false,playing:true}; setAi(cur); tRef.current=setTimeout(()=>advance(cur),300); }
  function play(){ const cur={...aiRef.current,playing:true}; setAi(cur); advance(cur); }
  function pause(){ clearTimeout(tRef.current); setAi({...aiRef.current,playing:false}); }
  function stepOne(){ clearTimeout(tRef.current); advance({...aiRef.current,playing:false}); }
  function approve(){ clearTimeout(tRef.current); pushLog("log_route"); const cur={...aiRef.current,gate:false,ag:aiRef.current.ag+1,line:-1,playing:true}; setAi(cur); tRef.current=setTimeout(()=>advance(cur),400); }
  function reset(){ clearTimeout(tRef.current); setAi({on:false,ag:-1,line:-1,ds:{},gate:false,done:false,playing:false}); }
  useEffect(()=>{ if(seed){ start(); clearSeed(); } /* eslint-disable-next-line */ },[seed]);

  if(!ai.on){
    const ex=["⚡ "+L("Rate-hike +50bps impact on Riyadh Seg-A gap","加息 +50bps 对利雅得 A 段缺口的影响"),L("Is the gap a policy or a macro problem?","缺口是政策问题还是宏观问题?"),L("What should we do to close it?","该怎么补这个缺口?")];
    return (<div className="fade">
      <PageHeader title={t("nav_chat")} sub={L("Multi-agent reasoning theater — watch agents think, fetch, compute step-by-step, then hand back at the governance gate","多智能体推理剧场 — 看智能体逐步「想 → 取数 → 计算 → 产出」,治理门交回人工")} cls="ph-end" right={mafChip}/>
      <div className="ai-brief-grid">
        <div className="ai-brief-side">
          <FiscalContinuityPanel compact/>
        </div>
        <div className="ai-brief-main card pad">
          <div className="eyebrow">{L("Live demo case","现场演示 Case")}</div>
          <h2>{L("SAMA +50bps shock → housing gap → fiscal continuity decision","SAMA +50bps 冲击 → 住房缺口 → 财政延续性决策")}</h2>
          <p>{L("Ask in natural language — the Orchestrator routes to the right engines, exposes the calculation chain, and packages the output for CoPilot / AI_H_03.","用自然语言提问 —— 编排器会路由到对应引擎,展开计算链,并把输出打包给 CoPilot / AI_H_03。")}</p>
          <div className="preset-row">
            <span className="muted" style={{fontSize:12,fontWeight:700,alignSelf:"center"}}>{L("Try","试试")}:</span>
            {ex.map((e,i)=><button key={i} className="preset" onClick={()=>{setQ(e);start();}}>{e}</button>)}
            <button className="btn secondary sm" onClick={()=>setFlow(true)}>{L("Open Multi-Agent Flow","打开 Multi-Agent Flow")}</button>
          </div>
          <div className="ask-dock">
            <div className="ask-row">
              <span className="ask-ic">✦</span>
              <input className="ask-input" value={q} placeholder={L("Ask the data — e.g. how big is the Riyadh Seg-A gap, and how to close it?","智能问数 —— 例如:利雅得 A 段供需缺口有多大?该怎么补?")}
                onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")start();}}/>
              <button className="btn" onClick={start}>➤ {L("Ask","提问")}</button>
            </div>
          </div>
        </div>
      </div>
      {flow&&<FlowDiagram lang={lang} onClose={()=>setFlow(false)}/>}
    </div>);
  }
  const finActive=ai.on&&!ai.done&&!ai.gate&&ai.ag>=0&&AGENTS_T[ai.ag]&&brdKeyOf(AGENTS_T[ai.ag].ag)==="fin";
  const tmap={}; AGENTS_T.forEach((a,i)=>{const k=brdKeyOf(a.ag); if(k)(tmap[k]=tmap[k]||[]).push(i);});
  const linesLen=(ai.ag>=0&&AGENTS_T[ai.ag])?AGENTS_T[ai.ag].lines.length:1;
  const actLabel=ac=>{const m=ACTLABEL[ac];return m?(lang==="zh"?m[1]:m[0]):ac.replace(/_/g," ");};
  const actItem=(ac,ok,key)=>(<div key={key} className={"agact"+(ok?" ok":"")}><span className="agck">✓</span><span className="alab">{actLabel(ac)}</span></div>);
  const agentRow=(a)=>{
    const idxs=tmap[a.key]||[];
    const isActive=idxs.includes(ai.ag)&&!ai.done;
    const passed=idxs.length>0&&Math.max.apply(null,idxs)<ai.ag;
    const done=ai.done||passed;
    const k=done?a.acts.length:isActive?Math.max(1,Math.ceil(((ai.line+1)/linesLen)*a.acts.length)):0;
    const ticked=new Set(a.order.slice(0,k));
    return (<div key={a.key} className={"agrow"+(isActive?" active":done?" done":"")}>
      <div className="agrow-h"><span className="livedot"/><b>{Z(a,"name")}</b>{done?<span className="agdone">✓</span>:isActive?<span className="agtag">{L("running","运行中")}</span>:null}</div>
      {isActive&&<div className="aglist">{a.acts.map((ac,j)=>actItem(ac,ticked.has(j),j))}</div>}
    </div>);
  };
  // Orchestrator wraps the specialist agents — it coordinates throughout the run
  const orch=AGENT_ACTIONS[0];
  const orchActive=ai.on&&!ai.done;
  const overall=ai.done?1:(ai.on?Math.min(1,(Math.max(0,ai.ag)+(ai.line+1)/linesLen)/AGENTS_T.length):0);
  const orchK=ai.done?orch.acts.length:orchActive?Math.max(1,Math.round(overall*orch.acts.length)):0;
  const orchTicked=new Set(orch.order.slice(0,orchK));
  const rail=(<div className={"orch-wrap"+(ai.done?" done":orchActive?" active":"")}>
    <div className="agrow-h orch-h"><span className="livedot"/><b>{Z(orch,"name")}</b>
      {ai.done?<span className="agdone">✓</span>:orchActive?<span className="agtag">{L("coordinating","调度中")}</span>:<span className="agtag" style={{background:"#eef1ee",color:"var(--muted)"}}>{L("ready","就绪")}</span>}</div>
    {orchActive&&<div className="aglist">{orch.acts.map((ac,j)=>actItem(ac,orchTicked.has(j),j))}</div>}
    <div className="orch-children">{AGENT_ACTIONS.slice(1).map(agentRow)}</div>
  </div>);
  const kindLbl=k=>k==="think"?L("Thinking","思考"):k==="call"?L("Fetch","取数"):k==="calc"?L("Compute","计算"):L("Output","产出");
  const cards=[];
  for(let i=0;i<=ai.ag && i<AGENTS_T.length;i++){
    const ag=AGENTS_T[i]; const active=(i===ai.ag&&!ai.done);
    const shown=(i<ai.ag)?ag.lines.length:(ai.line+1);
    const lns=[];
    for(let j=0;j<shown;j++){ const ln=ag.lines[j]; const isLast=active&&j===shown-1&&ln.k==="think"&&ai.playing;
      lns.push(<div key={j} className={"tln "+ln.k}><span className={"kind "+ln.k}>{kindLbl(ln.k)}</span><span className="ttx">{Z(ln,"t")}{ln.val?<span className="res">{ln.val}</span>:null}{isLast?<span className="dots"/>:null}</span></div>); }
    cards.push(<div key={i} className={"agentcard"+(active?" active":"")+(ag.gate?" gatec":"")}>
      <div className="ah"><span className="aic">{ag.ic}</span>{Z(ag,"ag")}<span className="alyr">{ag.lyr}</span></div>{lns}</div>);
  }
  return (<div className="fade">
    <PageHeader title={t("nav_chat")} sub={L("L1 data → L2 quality gate → L3 agents → L4 governance → L5 output","L1 数据 → L2 质量门 → L3 智能体 → L4 治理门 → L5 产出")} cls="ph-end"
      right={mafChip}/>
    <ReasoningStatus ai={ai} L={L} Z={Z}/>
    <div className="ctrl">
      {ai.playing? <button className="btn ghost sm" onClick={pause}>⏸ {L("Pause","暂停")}</button>
        : (!ai.done&&!ai.gate? <button className="btn sm" onClick={play}>▶ {L("Resume","继续")}</button>:null)}
      {(!ai.done&&!ai.gate)?<button className="btn ghost sm" onClick={stepOne}>⏭ {L("Step","下一步")}</button>:null}
      <button className="btn ghost sm" onClick={reset}>↻ {L("Replay","重放")}</button>
    </div>
    <div className="theater theater-fiscal">
      <FiscalContinuityPanel lv={flv} setLv={setFlv} active={finActive}/>
      <div className="tstream" ref={streamRef}>
        {cards}
        {ai.gate&&<div className="gate-card">
          <div className="row" style={{flexWrap:"wrap",gap:8}}><span className="chip amber">⚠ {L("Governance gate","治理门")}</span><b>{L("Uncovered 65% > 30% — Planning Manager approval required","未覆盖 65% > 30% — 需 Planning Manager 批准")}</b></div>
          <div className="muted" style={{fontSize:12.5,margin:"8px 0 10px"}}>{L("AI output is a draft until you approve. Cleared HUMAN-REVIEWED (04:48) & LEGAL CLEARED (05:31).","AI 产出在你批准前仅为草稿。已过 HUMAN-REVIEWED(04:48)与 LEGAL CLEARED(05:31)。")}</div>
          <div className={"gate-fiscal "+(fres.approve?"pass":"fail")}>{L("AI Financial Sustainability","AI 财政可持续性")}: <b>{fres.score}/100</b> · {fres.approve?L("PASS — fiscally fundable, approval enabled","通过 — 财政可承受,可批准"):L("FAIL — exceeds fiscal cap, must escalate","未通过 — 超出财政上限,须上报")} <span className="muted">({L("drag the panel sliders to change this →","拖右侧面板滑块可改变此结果 →")})</span></div>
          <div className="row" style={{flexWrap:"wrap",gap:8}}>
            {fres.approve
              ? <button className="btn amber" onClick={approve}>✓ {L("Approve & continue","批准并继续")}</button>
              : <button className="btn" style={{background:"var(--danger)",color:"#fff"}} onClick={()=>{pushLog("log_route");approve();}}>⤴ {L("Escalate to Minister","上报部长")}</button>}
            <button className="btn ghost" onClick={reset}>{L("Return","退回")}</button></div>
        </div>}
        {ai.done&&<div style={{marginTop:6}}>
          <div className="card pad" style={{marginBottom:14}}><div className="row" style={{justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <span className="chip">✓ {L("Complete · audit logged · SSOT pushed","完成 · 审计已记录 · SSOT 已推送")}</span>
            <button className="btn" onClick={downloadBriefing}>⬇ {t("download")} PDF</button></div></div>
          <AiRec d={AIREC.shock}/>
        </div>}
        <div ref={endRef} style={{height:1}}/>
      </div>
      <div className="dsrail card pad"><div className="rail-h"><span className="livedot"/>{L("Agent · LIVE","Agent · 实时")}</div>{rail}</div>
    </div>
    {flow&&<FlowDiagram lang={lang} onClose={()=>setFlow(false)}/>}
  </div>);
}
const FLOW_SRC=["SAP / Asas","Etimad","Esnad","Sakani","Wafi","Ejari","MOJ Price","GASTAT","Private Mkt","Geo / GIS","Bank stmts"];
const FLOW_STAGES=[
 {t:"Intake & Data Quality",t_zh:"接入与数据质量",hand:"Unified dataset + DQ flags · 88%",hand_zh:"统一数据 + 质量标记 · 88%",ag:[
   {n:"Orchestrator Agent",ic:"✦",own:"platform",in:"User query (NL)",in_zh:"用户提问(NL)",out:"Routed task + plan",out_zh:"路由任务 + 计划"},
   {n:"Data Quality Monitor",ic:"◉",own:"platform",in:"11 raw sources",in_zh:"11 原始源",out:"Validated set · 88%",out_zh:"校验数据 · 88%"}]},
 {t:"Macro-Economic Analysis",t_zh:"宏观经济分析",hand:"Transmission frame · r=−0.85",hand_zh:"传导框架 · r=−0.85",ag:[
   {n:"Macro-Economic Agent",ic:"🌐",own:"custom",in:"Rates · FX peg · demographics",in_zh:"利率 · 汇率挂钩 · 人口",out:"r=−0.85 · +35–50bps",out_zh:"r=−0.85 · +35–50bps"},
   {n:"Data Querying Agent",ic:"🔎",own:"platform",in:"SAMA / GASTAT series",in_zh:"SAMA / GASTAT 序列",out:"Correlation panel",out_zh:"相关性面板"}]},
 {t:"Demand Intelligence",t_zh:"需求智能",hand:"Seg-A demand 19,100",hand_zh:"A 段需求 19,100",ag:[
   {n:"Demand Intelligence Agent",ic:"📈",own:"custom",in:"Validated dataset",in_zh:"校验数据集",out:"Seg-A demand 19,100",out_zh:"A 段需求 19,100"},
   {n:"Data Querying Agent",ic:"🔎",own:"platform",in:"Segment / beneficiary tables",in_zh:"段位 / 受益人表",out:"B→A migration 2,360",out_zh:"B→A 迁移 2,360"}]},
 {t:"Supply-Demand Balancing",t_zh:"供需平衡",hand:"Gap 12,400 · coverage 35%",hand_zh:"缺口 12,400 · 覆盖 35%",ag:[
   {n:"Supply-Demand Balancing Agent",ic:"⚖",own:"custom",in:"Demand + pipeline",in_zh:"需求 + 管线",out:"Gap 12,400 · 35%",out_zh:"缺口 12,400 · 35%"},
   {n:"Data Querying Agent",ic:"🔎",own:"platform",in:"143 projects",in_zh:"143 个项目",out:"Effective supply 6,700",out_zh:"有效供给 6,700"}]},
 {t:"Conversion & Absorption",t_zh:"转化吸纳",hand:"Residual gap 6,200 + alert",hand_zh:"剩余缺口 6,200 + 预警",ag:[
   {n:"Conversion & Absorption Agent",ic:"🎯",own:"custom",in:"Pipeline + conv rates",in_zh:"管线 + 转化率",out:"Residual gap 6,200",out_zh:"剩余缺口 6,200"},
   {n:"Proactive Insights Agent",ic:"💡",own:"platform",in:"Conversion trend",in_zh:"转化趋势",out:"Early-warning",out_zh:"早期预警"}]},
 {t:"Policy Simulation",t_zh:"政策模拟",hand:"Ranked toolkit (draft)",hand_zh:"排序工具箱(草稿)",ag:[
   {n:"Policy Simulation Agent",ic:"⚖",own:"custom",in:"Gap + six measures",in_zh:"缺口 + 六项措施",out:"Toolkit M1+M2+M3",out_zh:"工具箱 M1+M2+M3"},
   {n:"Data Querying Agent",ic:"🔎",own:"platform",in:"Causal-chain inputs",in_zh:"因果链输入",out:"M6 counter-indication",out_zh:"M6 反指征"}]},
 {t:"Financial Sustainability",t_zh:"财政可持续",hand:"Fiscal-safe recommendation",hand_zh:"财政安全建议",ag:[
   {n:"Financial Sustainability Agent",ic:"💰",own:"custom",in:"Debt + Sakani + V2030 + Brent",in_zh:"债务 + Sakani + V2030 + Brent",out:"Net SAR 8B · index 72→67",out_zh:"净 SAR 8B · 指数 72→67"},
   {n:"Finance Rules Engine",ic:"📐",own:"platform",in:"5% cap envelope",in_zh:"5% 上限信封",out:"Within cap ✓",out_zh:"上限内 ✓"}]},
];
function FlowDiagram({lang,onClose}){
  const L=(en,zh)=>lang==="zh"?zh:en;
  const Z=(o,k)=>(lang==="zh"&&o[k+"_zh"])?o[k+"_zh"]:o[k];
  const Conn=({label})=>(<div className="hconn"><span className="vlabel">{label}</span></div>);
  const agent=(a,j)=>(<div key={j} className="vagent">
    <div className="va-h"><span className="gdot" title="live"/><b style={{flex:1}}>{a.n}</b></div>
    <div className="va-io col">
      <div className="io-box in"><span className="io-l">{L("INPUT","输入")}</span>{Z(a,"in")}</div>
      <span className="io-arrow down">↓</span>
      <div className="io-box out"><span className="io-l">{L("OUTPUT","输出")}</span>{Z(a,"out")}</div>
    </div>
  </div>);
  const stageBox=(s,k)=>(<div key={k} className="hcol hstage"><div className="hstage-h">{Z(s,"t")}</div><div className="hstage-b">{s.ag.map(agent)}</div></div>);
  const r1=FLOW_STAGES.slice(0,4), r2=FLOW_STAGES.slice(4);
  return (<Drawer wide title={L("Demand & Supply Optimizer — Agent I/O flow","Demand & Supply Optimizer — Agent I/O 流")} onClose={onClose}>
    <div className="flow-legend" style={{padding:"0 0 12px",borderBottom:"1px solid var(--line)",marginBottom:14}}>
      <span><span className="lg sw-flow"/>{L("Main flow","主流程")}</span>
      <span><span className="lg sw-gate"/>{L("Human gate","人工门")}</span>
      <span><span className="lg sw-agent"/>{L("Agent (live)","智能体(存活)")}</span>
      <span><span className="lg sw-src"/>{L("Sources / deliverables","源 / 交付物")}</span>
    </div>
    <div className="hscroll">
      <div className="hsnake">
        <div className="hrow">
          <div className="hcol hsrc">
            <div className="vsrc-h">📥 {L("Data Sources","数据源")}</div>
            <div className="src-chips">{FLOW_SRC.map((s,i)=><span key={i} className="srcchip">{s}</span>)}</div>
          </div>
          <Conn label={L("Raw feeds","原始数据")}/>
          {r1.map((s,i)=>(<React.Fragment key={i}>{stageBox(s,i)}{i<r1.length-1&&<Conn label={Z(s,"hand")}/>}</React.Fragment>))}
        </div>
        <div className="hreturn"><span className="elbow r"/><span className="hline"/><span className="vlabel">↩ {Z(r1[r1.length-1],"hand")}</span><span className="elbow l"/></div>
        <div className="hrow">
          {r2.map((s,i)=>(<React.Fragment key={i}>{stageBox(s,i)}<Conn label={Z(s,"hand")}/></React.Fragment>))}
          <div className="hcol hstage gate">
            <div className="hstage-h">⚖ {L("Human Review · Mandatory Gate","人工复核 · 强制门")}</div>
            <div className="hgate-b">{L("Validate & approve · authorize export","校验与批准 · 授权导出")}
              <div className="muted" style={{fontSize:11,marginTop:5}}>HUMAN-REVIEWED 04:48<br/>LEGAL CLEARED 05:31</div></div>
          </div>
          <Conn label={L("Approved recommendation","已批准建议")}/>
          <div className="hcol hdeliv">
            <div className="vsrc-h">📦 {L("Deliverables","交付物")}</div>
            <div className="muted" style={{fontSize:12,marginTop:6}}>{L("Fiscal note · gap briefing (PDF) · API payload · SSOT push → AI_H_03 / CoPilot","财政说明 · 缺口简报(PDF)· API Payload · SSOT 推送 → AI_H_03 / CoPilot")}</div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>);
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
      <AiRec d={AIREC.shock}/>
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
          <button className="btn sm" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={()=>scn.brief?downloadBriefing():window.print()}>⬇ {scn.brief?t("downloadBrief"):t("download")}</button>
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
function AlertCard({a}){
  const {t,askOrchestrator,ackAlert}=useStore();
  const [open,setOpen]=useState(false);
  const rec=a.rec&&AIREC[a.rec];
  return (<div className={"mon "+(a.sev==="red"?"red":a.sev==="amber"?"amber":"")} style={{marginBottom:10}}>
    <div className="mh">
      <span style={{display:"flex",alignItems:"center",gap:8}}>
        <span className={"chip "+(a.sev==="red"?"danger":a.sev==="amber"?"amber":"info")}>{t("sev_"+a.sev)}</span>
        <strong style={{fontSize:13}}>{t(a.tk)}</strong>
      </span>
      <span className="muted" style={{fontSize:11}}>{a.ts}</span>
    </div>
    <div style={{fontSize:12.5,marginBottom:8}}><b>{t("rootCause")}:</b> {t(a.bk)}</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {rec&&<button className="btn btn-ai sm" onClick={()=>setOpen(o=>!o)}>✦ {t("ai_diagnose")} {open?"▴":"▾"}</button>}
      {a.scn&&<button className="btn sm" onClick={()=>askOrchestrator(a.scn)}>✦ {t("askOrch")}</button>}
      {!a.ack? <button className="btn secondary sm" onClick={()=>ackAlert(a.id)}>✓ {t("ack")}</button> : <span className="chip">✓ {t("acked")}</span>}
    </div>
    {open&&rec&&<AiRec d={rec}/>}
  </div>);
}
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
        alerts.map(a=><AlertCard key={a.id} a={a}/>)}
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
function Drawer({title,onClose,children,foot,wide}){
  return (<div className="drawer-ov" onClick={onClose}>
    <div className={"drawer-panel"+(wide?" wide":"")} onClick={e=>e.stopPropagation()}>
      <div className="drawer-head"><h3>{title}</h3><button className="modal-x" onClick={onClose} aria-label="close">✕</button></div>
      <div className="drawer-body">{children}</div>
      {foot&&<div className="drawer-foot">{foot}</div>}
    </div></div>);
}
const REPORTS_META=[
  {id:"weekly",   icon:"⚡", color:"#2563eb", nameKey:"rp_weekly",   ref:"DSO-WR-2026-W25", date:"22 Jun 2026 · 06:00", cov:"ministry"},
  {id:"monthly",  icon:"📊", color:"#059669", nameKey:"rp_monthly",  ref:"DSO-MR-2026-06",  date:"01 Jul 2026 · 06:00", cov:"total"},
  {id:"quarterly",icon:"🏛", color:"#7c3aed", nameKey:"rp_quarterly",ref:"DSO-QR-2026-Q2",  date:"30 Jun 2026 · 09:35", cov:"total"},
];
// severity mapped to BRD thresholds: red(error) = gap>30% / absorption drop>40% / source outage>24h / delay>50% SLA;
//                                     yellow(warn) = delay≤50% SLA / anomaly>3σ / conversion<60%
const HEALTH_EVENTS=[
  {sev:"error", k:"he_gap",    dk:"he_gap_d",    sla:"he_gap_s"},
  {sev:"error", k:"he_absorp", dk:"he_absorp_d", sla:"he_absorp_s"},
  {sev:"warn",  k:"he_moj",    dk:"he_moj_d",    sla:"he_moj_s"},
  {sev:"warn",  k:"he_anom",   dk:"he_anom_d",   sla:"he_anom_s"},
  {sev:"warn",  k:"he_conv",   dk:"he_conv_d",   sla:"he_conv_s"},
  {sev:"warn",  k:"he_stale",  dk:"he_stale_d",  sla:"he_stale_s"},
];
// seed a rich real-time log: mostly healthy info ticks, with the occasional clickable unhealthy event
const LOG_NORMAL=["log_scan","log_route","log_cross","log_idle","log_idle","log_feed","log_policy",
  ["log_report","DSO-WR-2026-W25"],["log_report","DSO-MR-2026-06"],["log_route"]];
function seedLog(t){
  const out=[]; const base=Date.now(); let off=0;
  for(let i=0;i<34;i++){
    const ts=new Date(base-off*1000).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    off += 4+Math.floor(Math.random()*9);
    const n=LOG_NORMAL[Math.floor(Math.random()*LOG_NORMAL.length)];
    out.push({ts, text: Array.isArray(n)? (t(n[0])+" "+n[1]) : t(n)});
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
          <td className="right-num"><button className="btn sm" onClick={()=>r.nameKey==="repName_brief"?downloadBriefing():window.print()}>⬇</button></td>
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
    {pr&&<Drawer title={<span style={{color:pr.color}}>{pr.icon} {t(pr.nameKey)}</span>} onClose={()=>setPreview(null)}
      foot={<><button className="btn secondary" onClick={()=>setPreview(null)}>{t("close")}</button><button className="btn" onClick={()=>downloadReport(preview)}>⬇ {t("download")}</button></>}>
      <iframe title="report" srcDoc={decodeReport(preview)} style={{flex:1,minHeight:0,width:"100%",border:"1px solid var(--line)",borderRadius:8,background:"#fff"}}/>
    </Drawer>}
    {health&&<Modal title={<span className="sect-right"><span className={"chip "+(health.sev==="error"?"danger":"amber")}>{health.sev==="error"?("✕ "+t("sev_red")):("⚠ "+t("sev_amber"))}</span> {t(health.k)}</span>} onClose={()=>setHealth(null)}>
      {health.sla&&<div className="banner" style={{marginBottom:12}}>📐 {t("sla_label")}: {t(health.sla)}</div>}
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
const DEV_DIM_W={quality:25,completion:25,timeliness:20,concentration:15,signing:15};  // PDF weighting
function DevRadar({h}){
  const {t}=useStore(); const C=RC; if(!C.ResponsiveContainer) return null;
  const radar=DEV_DIMS.map(d=>{ const row={dim:t("d_"+d)+" "+DEV_DIM_W[d]+"%"}; DEVS.slice(0,5).forEach(dv=>row[dv.name]=dv[d]); return row; });
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
    <Section title={t("ai_analysis")}><AiRec d={AIREC.macroPage}/></Section>
    <Section title={t("corr_title")} right={<span className="chip gray">{t("confidence")}: 88%</span>}>
      <div style={{width:"100%",height:280}}>{ok&&
        <C.ResponsiveContainer><C.BarChart data={corr} margin={{top:6,right:10,left:-6,bottom:4}}>
          <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef"/><C.XAxis dataKey="name" tick={{fontSize:10}} interval={0} angle={-20} textAnchor="end" height={56}/>
          <C.YAxis domain={[-1,1]} ticks={[-1,-0.6,0,0.6,1]} tick={{fontSize:10}}/><C.Tooltip/><C.Legend wrapperStyle={{fontSize:11}}/>
          <C.ReferenceLine y={0} stroke="#9aa3ab"/>
          <C.ReferenceLine y={0.6} stroke="#e32700" strokeDasharray="4 4" label={{value:t("corr_thresh"),fontSize:10,fill:"#e32700",position:"insideTopRight"}}/>
          <C.ReferenceLine y={-0.6} stroke="#e32700" strokeDasharray="4 4"/>
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
  { id:"AL-1", sev:"amber", tk:"al_moj_t", bk:"al_moj_b", ts:"06:10", ack:false, scn:null, rec:"dq" },
  { id:"AL-2", sev:"amber", tk:"al_conv_t", bk:"al_conv_b", ts:"05:40", ack:false, scn:null, rec:"conv" },
];
/* release notes timeline (hidden menu pages intentionally excluded) */
const RELEASE_NOTES={
  en:[
    { ver:"v1.10", date:BUILD_TIME, items:[
      "Storyline charts corrected against the v7 briefing: Macro-Economic now plots signed Pearson r (interest −0.85/−0.90, population +0.92) with ±0.6 thresholds instead of unsigned R².",
      "Developer radar now labels the five PDF-weighted dimensions (quality 25% · completion 25% · delay 20% · concentration 15% · signing 15%).",
      "Removed the Policy Simulation step from the analysis storyline (six engines)." ]},
    { ver:"v1.9", date:"2026-06-22", items:[
      "Periodic reports (weekly / monthly / quarterly) and the downloadable ministerial briefing updated to the latest source documents.",
      "Conversational Analysis aligned to the v7 briefing: rate path 4.25% → 4.75% (+50bps) and the Riyadh Segment-A gap framed as 12,400 units (Y3) with 35% pipeline coverage.",
      "AI Diagnosis & Recommendation now presents the full policy toolkit — six measures at a glance (M1–M6: mechanism, supply impact, gap closure, cost, verdict)." ]},
    { ver:"v1.8", date:"2026-06-21", items:[
      "Monitoring alerts now expand into an AI diagnosis & recommendation (why + what to do).",
      "AI recommendations recompute with Coverage and a clickable scenario (optimistic / base / pessimistic) — attribution %, impact figures and confidence update live." ]},
    { ver:"v1.7", date:"2026-06-21", items:[
      "AI Diagnosis & Recommendation: every analysis now ends with diagnosis → macro-vs-policy attribution → quantified impact → ranked actions, in Conversational Analysis and the Dashboard.",
      "Causal attribution shown as a macro/policy split bar with a one-line conclusion and confidence." ]},
    { ver:"v1.6", date:"2026-06-21", items:[
      "Dashboard rebuilt as Key Indicators: real (SAMA / GASTAT / Market) vs DSO-estimate KPI cards with monthly sparklines & hover tooltips, MoM comparison tables, macro scenario distribution, and key risks." ]},
    { ver:"v1.5", date:"2026-06-21", items:[
      "Ministerial briefing now downloads as the original PDF (verbatim).",
      "KPI value, change and sparkline share a direction colour (up=orange, down=blue, flat=green)." ]},
    { ver:"v1.4", date:"2026-06-20", items:[
      "Agent activity log is now a real-time stream (2-minute refresh).",
      "Severity aligned to BRD SLA thresholds (red: gap >30% / absorption drop >40% / delay >50% SLA / outage >24h · yellow: delay ≤50% SLA / anomaly >3σ / conversion <60%).",
      "Click an unhealthy log entry for root-cause detail." ]},
    { ver:"v1.3", date:"2026-06-20", items:[
      "Reports Center: weekly / monthly / quarterly reports with in-app preview and download.",
      "“Hub” renamed to “Dashboard” with Key KPIs and Business Reports." ]},
    { ver:"v1.2", date:"2026-06-19", items:[
      "Conversational Analysis: interest-rate-shock storyline — agents stream in one-by-one, the Orchestrator consolidates, then a downloadable ministerial briefing.",
      "Orchestrator status: fixed-width badge that morphs into live progress (indigo, distinct from content)." ]},
    { ver:"v1.1", date:"2026-06-19", items:[
      "Monitoring & early-warning and data-quality checks.",
      "Login, role switching, and EN / العربية (RTL) language toggle." ]},
  ],
  zh:[
    { ver:"v1.10", date:BUILD_TIME, items:[
      "故事线图表对照 v7 简报修正:宏观经济图改为带符号的 Pearson 相关系数 r(利率 −0.85/−0.90、人口 +0.92),并标注 ±0.6 阈值(原为无符号 R²)。",
      "开发商雷达图标注 PDF 的五项加权维度(质量 25% · 完工 25% · 延误 20% · 集中度 15% · 签约 15%)。",
      "分析故事线移除政策模拟步骤(六个引擎)。" ]},
    { ver:"v1.9", date:"2026-06-22", items:[
      "周期报告(每周/月度/季度)与可下载的部长简报已更新为最新源文档。",
      "对话分析对齐 v7 简报:利率路径 4.25% → 4.75%(+50bps),利雅得 A 段缺口表述为 12,400 套(第3年),管线仅覆盖 35%。",
      "AI 诊断与建议现展示完整政策工具箱 —— 六项措施一览(M1–M6:机制、供给影响、缺口闭合、成本、结论)。" ]},
    { ver:"v1.8", date:"2026-06-21", items:[
      "监控预警可展开为 AI 诊断与建议(为什么 + 怎么办)。",
      "AI 建议随 Coverage 与可点击情景(乐观/基准/悲观)重算 —— 归因比例、影响数值与置信度实时联动。" ]},
    { ver:"v1.7", date:"2026-06-21", items:[
      "AI 诊断与建议:每次分析现在以 诊断 → 宏观/政策归因 → 量化影响 → 排序处方 收尾(对话分析与仪表盘)。",
      "归因用 宏观/政策 百分比拆分条 + 一句结论 + 置信度 呈现。" ]},
    { ver:"v1.6", date:"2026-06-21", items:[
      "仪表盘重建为关键指标:真实(SAMA / GASTAT / 市场)与 DSO 估算 KPI 卡(含月度迷你图与悬停提示)、环比对照表、宏观情景分布、关键风险。" ]},
    { ver:"v1.5", date:"2026-06-21", items:[
      "部长简报下载改为原始 PDF 格式(逐字节一致)。",
      "KPI 数值、涨跌与迷你图同色(上升=橘、下降=蓝、不变=绿)。" ]},
    { ver:"v1.4", date:"2026-06-20", items:[
      "Agent 操作日志改为实时流(2 分钟刷新)。",
      "严重 / 警告分级对齐 BRD 的 SLA 阈值(红:缺口 >30% / 吸纳率下降 >40% / 延迟 >50% SLA / 中断 >24h;黄:延迟 ≤50% SLA / 异常 >3σ / 转化 <60%)。",
      "点击不健康日志可查看根因详情。" ]},
    { ver:"v1.3", date:"2026-06-20", items:[
      "报告中心:每周 / 月度 / 季度三份报告,支持页内预览与下载。",
      "「Hub」更名为「Dashboard」,新增关键 KPI 与业务报告。" ]},
    { ver:"v1.2", date:"2026-06-19", items:[
      "对话分析:加息冲击故事线 —— 多个智能体逐步展开,编排器汇总,最后生成可下载的部长简报。",
      "编排状态:固定宽度徽章,运行时就地变为实时进度(靛紫,与生成内容区分)。" ]},
    { ver:"v1.1", date:"2026-06-19", items:[
      "监控预警与数据质量校验。",
      "登录、角色切换,以及 EN / العربية(RTL)语言切换。" ]},
  ],
  ar:[
    { ver:"v1.10", date:BUILD_TIME, items:[
      "تصحيح رسوم القصة مقابل موجز v7: المخطط الاقتصادي الكلي يعرض الآن ارتباط بيرسون r بالإشارة (الفائدة −0.85/−0.90، السكان +0.92) مع عتبات ±0.6 بدلاً من R² غير المُوقّع.",
      "رادار المطوّرين يوسم الأبعاد الخمسة المرجّحة من PDF (الجودة 25% · الإنجاز 25% · التأخير 20% · التركّز 15% · التوقيع 15%).",
      "إزالة خطوة محاكاة السياسات من قصة التحليل (ستة محرّكات)." ]},
    { ver:"v1.9", date:"2026-06-22", items:[
      "تم تحديث التقارير الدورية (أسبوعي/شهري/ربع سنوي) والموجز الوزاري القابل للتنزيل إلى أحدث المستندات المصدرية.",
      "مواءمة التحليل الحواري مع موجز v7: مسار الفائدة 4.25% ← 4.75% (+50 نقطة أساس)، وفجوة الشريحة A بالرياض 12,400 وحدة (السنة 3) بتغطية خط أنابيب 35%.",
      "يعرض تشخيص وتوصية AI الآن حقيبة السياسات الكاملة — ست إجراءات بلمحة (M1–M6: الآلية، أثر العرض، سدّ الفجوة، الكلفة، الحكم)." ]},
    { ver:"v1.8", date:"2026-06-21", items:[
      "تنبيهات المراقبة تتوسّع الآن إلى تشخيص وتوصية AI (لماذا + ماذا تفعل).",
      "توصيات AI تُعاد حسابها مع التغطية وسيناريو قابل للنقر (متفائل/أساسي/متشائم) — تتحدّث نسبة الإسناد وأرقام الأثر والثقة لحظياً." ]},
    { ver:"v1.7", date:"2026-06-21", items:[
      "تشخيص وتوصية AI: كل تحليل ينتهي الآن بتشخيص ← إسناد كلي/سياسة ← أثر مكمّى ← إجراءات مرتّبة (التحليل الحواري ولوحة المعلومات).",
      "يُعرض الإسناد كشريط نسبة كلي/سياسة مع خلاصة سطر واحد ودرجة ثقة." ]},
    { ver:"v1.6", date:"2026-06-21", items:[
      "إعادة بناء لوحة المعلومات كمؤشرات رئيسية: بطاقات حقيقية (ساما/الإحصاء/السوق) مقابل تقديرات DSO مع رسوم شهرية مصغّرة وتلميحات، جداول مقارنة شهرية، توزيع سيناريوهات كلية، وأهم المخاطر." ]},
    { ver:"v1.5", date:"2026-06-21", items:[
      "تنزيل الموجز الوزاري الآن بصيغة PDF الأصلية (حرفياً).",
      "قيمة المؤشر وتغيّره ورسمه المصغّر بلون موحّد حسب الاتجاه (صعود=برتقالي، هبوط=أزرق، ثابت=أخضر)." ]},
    { ver:"v1.4", date:"2026-06-20", items:[
      "سجل نشاط الوكلاء أصبح تدفقاً لحظياً (تحديث كل دقيقتين).",
      "مواءمة الخطورة مع عتبات SLA في BRD (أحمر: فجوة >٣٠٪ / هبوط استيعاب >٤٠٪ / تأخّر >٥٠٪ SLA / انقطاع >٢٤س · أصفر: تأخّر ≤٥٠٪ / شذوذ >٣σ / تحويل <٦٠٪).",
      "اضغط على أي سجل غير صحي لعرض السبب الجذري." ]},
    { ver:"v1.3", date:"2026-06-20", items:[
      "مركز التقارير: تقارير أسبوعية / شهرية / فصلية مع معاينة وتنزيل داخل التطبيق.",
      "إعادة تسمية «Hub» إلى «Dashboard» مع المؤشرات الرئيسية والتقارير التشغيلية." ]},
    { ver:"v1.2", date:"2026-06-19", items:[
      "التحليل الحواري: سيناريو صدمة الفائدة — تظهر الوكلاء تباعاً، يجمّع المنسّق، ثم موجز وزاري قابل للتنزيل.",
      "حالة المنسّق: شارة بعرض ثابت تتحوّل إلى تقدّم لحظي (نيلي، مميّز عن المحتوى)." ]},
    { ver:"v1.1", date:"2026-06-19", items:[
      "المراقبة والإنذار المبكر وفحوص جودة البيانات.",
      "تسجيل الدخول، تبديل الأدوار، وتبديل اللغة EN / العربية (RTL)." ]},
  ],
};

function App(){
  const [user,setUserState]=useState(null);
  const [lang,setLang]=useState(()=>{ try{ const q=new URLSearchParams(window.location.search).get("ln"); if(q==="zh"||q==="ar"||q==="en") return q; }catch(e){} return "en"; });
  const [cov,setCov]=useState("total");
  const [route,setRoute]=useState("hub");
  const [alerts,setAlerts]=useState(SEED_ALERTS);
  const [reports,setReports]=useState([]);
  const [log,setLog]=useState([]);
  const [seed,setSeed]=useState(null);
  const [showNotes,setShowNotes]=useState(false);
  const [scn,setScn]=useState("base");
  const t=(k)=>{ const d=I18N[lang]; if(d&&d[k]!==undefined) return d[k]; const e=I18N.en; return (e&&e[k]!==undefined)?e[k]:k; };

  useEffect(()=>{ const html=document.documentElement; html.lang=lang; html.dir=lang==="ar"?"rtl":"ltr"; },[lang]);

  function pushLog(key,extra){ const txt = extra? (t(key)+" "+extra) : t(key);
    setLog(prev=>[{ts:timeStr(lang),text:txt},...prev].slice(0,40)); }
  // ambient real-time log: healthy info ticks only
  useEffect(()=>{ if(!user) return; const id=setInterval(()=>{
      const keys=["log_idle","log_scan","log_route","log_feed"]; pushLog(keys[Math.floor(Math.random()*keys.length)]);
    },120000); return ()=>clearInterval(id); /* eslint-disable-next-line */ },[user,lang]);

  function setUser(r){ setUserState(r); setRoute(r==="leader"?"cockpit":"hub"); if(r) setLog(seedLog(t)); }
  function ackAlert(id){ setAlerts(prev=>prev.map(a=>a.id===id?{...a,ack:true}:a)); }
  function raiseGapAlert(){ setAlerts(prev=> prev.some(a=>a.id==="AL-GAP")? prev : [{id:"AL-GAP",sev:"red",tk:"al_gap_t",bk:"al_gap_b",ts:nowStr(lang).split(" ").slice(-1)[0],ack:false,scn:"q_gap",rec:"shock"},...prev]); }
  function askOrchestrator(scn){ setSeed(scn); setRoute("chat"); }
  function clearSeed(){ setSeed(null); }
  function addReport(r){ setReports(prev=>[{...r,time:nowStr(lang)},...prev]); }
  function reset(){ setAlerts(SEED_ALERTS); setReports([]); setLog(seedLog(t)); setSeed(null); setRoute(user==="leader"?"cockpit":"hub"); }

  const store={ t,lang,setLang,cov,setCov,scn,setScn,user,setUser,route,setRoute,alerts,ackAlert,raiseGapAlert,
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
    <div className="shell"><div className="content">{page}</div></div>
    <button className="buildstamp" title={t("release_notes")} onClick={()=>setShowNotes(true)}><span className="bs-dot"/><b>{RELEASE_NOTES.en[0].ver}</b> · {BUILD_TIME}</button>
    {showNotes&&<Modal title={"📦 "+t("release_notes")} onClose={()=>setShowNotes(false)}>
      <div className="timeline">
        {(RELEASE_NOTES[lang]||RELEASE_NOTES.en).map((r,i)=>(<div key={i} className="ev">
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <b style={{fontSize:13.5}}>{r.ver}</b><span className="muted" style={{fontSize:12}}>{r.date}</span>
            {i===0&&<span className="chip">{t("rn_latest")}</span>}
          </div>
          <ul style={{margin:"6px 0 2px",paddingInlineStart:18,fontSize:12.5,lineHeight:1.65}}>
            {r.items.map((it,j)=><li key={j}>{it}</li>)}
          </ul>
        </div>))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><button className="btn secondary" onClick={()=>setShowNotes(false)}>{t("close")}</button></div>
    </Modal>}
  </Ctx.Provider>);
}

export default App;
