import { useState, useMemo, useEffect, useCallback } from 'react'

const SUPABASE_URL = 'https://gilsgrkqdjhjgiwbvjaz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbHNncmtxZGpoamdpd2J2amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDgwNDEsImV4cCI6MjA5MjQyNDA0MX0.bjsc0fZM6Vl1xGdIdUuoTFQSTHd9YIVNYteF98TDevA'
const API = `${SUPABASE_URL}/rest/v1/outlets`
const HDR = { 'Content-Type':'application/json', 'apikey':SUPABASE_ANON_KEY, 'Authorization':`Bearer ${SUPABASE_ANON_KEY}`, 'Prefer':'return=representation' }

// Colour palette
const C = {
  bg:'#F5F6FA', white:'#FFFFFF', border:'#E2E8F0', text:'#1E293B', sub:'#64748B',
  accent:'#2563EB', accentBg:'#EFF6FF', green:'#16A34A', greenBg:'#DCFCE7',
  red:'#DC2626', redBg:'#FEE2E2', amber:'#D97706', amberBg:'#FEF3C7',
  purple:'#7C3AED', purpleBg:'#EDE9FE', blue:'#0284C7', blueBg:'#E0F2FE',
}

const BRAND_COLOR = { 'Tealive':'#0EA5E9','Bask Bear Coffee':'#92400E','Ayee Southern Thai':'#DC2626','Gindaco':'#D97706','Croissant Taiyaki':'#CA8A04','Ding Dang':'#0891B2' }
const BRAND_BG    = { 'Tealive':'#E0F2FE','Bask Bear Coffee':'#FEF3C7','Ayee Southern Thai':'#FEE2E2','Gindaco':'#FFFBEB','Croissant Taiyaki':'#FEFCE8','Ding Dang':'#CFFAFE' }

const BRANDS  = ['All Brands','Tealive','Bask Bear Coffee','Ayee Southern Thai','Gindaco','Croissant Taiyaki','Ding Dang']
const STATUSES= ['All','Active','Under Renovation','Pending Opening','Closed','Under Negotiation']
const MODELS  = ['Franchise','Company-Owned','JV']
const TYPES   = ['Mall','Shop Lot','Transport Hub','Airport','Hospital','University','Drive-Thru','Other']
const SIZES   = ['Kiosk (<80sqft)','Small (80-200sqft)','Medium (200-500sqft)','Large (500-800sqft)','Flagship (>800sqft)']
const NAV     = [
  {key:'dashboard', label:'Dashboard',       icon:'▦'},
  {key:'outlets',   label:'Outlets',         icon:'◫'},
  {key:'lease',     label:'Lease & Deposits',icon:'⊟'},
  {key:'compliance',label:'Compliance',      icon:'⊕'},
  {key:'performance',label:'Performance',    icon:'◈'},
  {key:'import',    label:'Import CSV',      icon:'↑'},
]

const EMPTY = {
  id:null,outletCode:'',outletFormat:'',brand:'Tealive',outletName:'',state:'',
  type:'Mall',model:'Franchise',status:'Active',openingDate:'',closureDate:'',
  storeSize:'',sqft:'',storageSizeSqft:'',lat:'',lng:'',
  outletAddress:'',storageAddress:'',
  monthlyRental:'',monthlySales:'',atv:'',gto:'',serviceCharge:'',apFees:'',
  securityDeposit:'',utilitiesDeposit:'',mailboxDeposit:'',fitoutDeposit:'',restorationDeposit:'',
  leaseExpiry:'',halalExpiry:'',lad:'',ladRemarks:'',landlordName:'',tenantName:'',
  franchisee:'',contact:'',notes:'',
}

const FORM_SECTIONS = [
  { title:'Identity', cols:3, fields:[
    {k:'outletCode',l:'Outlet Code'},
    {k:'outletFormat',l:'Format',opts:['Inline','Kiosk','Cafe','Restaurant','Drive-Thru','Counter']},
    {k:'brand',l:'Brand',opts:BRANDS.slice(1)},
    {k:'outletName',l:'Outlet Name'},
    {k:'state',l:'State'},
    {k:'type',l:'Location Type',opts:TYPES},
    {k:'model',l:'Business Model',opts:MODELS},
    {k:'status',l:'Status',opts:STATUSES.slice(1)},
    {k:'storeSize',l:'Store Size Category',opts:SIZES},
  ]},
  { title:'Dates', cols:3, fields:[
    {k:'openingDate',l:'Opening Date',type:'date'},
    {k:'closureDate',l:'Closure Date',type:'date'},
  ]},
  { title:'Site', cols:3, fields:[
    {k:'sqft',l:'Store Sqft',type:'number'},
    {k:'storageSizeSqft',l:'Storage Sqft',type:'number'},
    {k:'lat',l:'Latitude'},
    {k:'lng',l:'Longitude'},
    {k:'outletAddress',l:'Outlet Address',full:true},
    {k:'storageAddress',l:'Storage Address',full:true},
  ]},
  { title:'Commercial', cols:3, fields:[
    {k:'monthlyRental',l:'Monthly Rental (RM)',type:'number'},
    {k:'monthlySales',l:'Monthly Sales (RM)',type:'number'},
    {k:'atv',l:'ATV (RM)',type:'number'},
    {k:'gto',l:'GTO Annual (RM)',type:'number'},
    {k:'serviceCharge',l:'Service Charge/mo',type:'number'},
    {k:'apFees',l:'A&P Fees/mo',type:'number'},
  ]},
  { title:'Deposits', cols:3, fields:[
    {k:'securityDeposit',l:'Security Deposit',type:'number'},
    {k:'utilitiesDeposit',l:'Utilities Deposit',type:'number'},
    {k:'mailboxDeposit',l:'Mailbox Deposit',type:'number'},
    {k:'fitoutDeposit',l:'Fitout Deposit',type:'number'},
    {k:'restorationDeposit',l:'Restoration Deposit',type:'number'},
  ]},
  { title:'Lease & Legal', cols:2, fields:[
    {k:'leaseExpiry',l:'Lease Expiry',type:'date'},
    {k:'halalExpiry',l:'Halal Cert Expiry',type:'date'},
    {k:'landlordName',l:'Landlord Name'},
    {k:'tenantName',l:'Tenant Name'},
    {k:'lad',l:'LAD Rate'},
    {k:'ladRemarks',l:'LAD Remarks',full:true},
  ]},
  { title:'PIC / Franchisee', cols:2, fields:[
    {k:'franchisee',l:'Franchisee / PIC'},
    {k:'contact',l:'Contact Number'},
    {k:'notes',l:'Notes',textarea:true,full:true},
  ]},
]

const DB_FIELDS = [
  {key:'outletCode',label:'Outlet Code'},{key:'outletFormat',label:'Outlet Format'},
  {key:'brand',label:'Brand'},{key:'outletName',label:'Outlet Name'},
  {key:'state',label:'State'},{key:'type',label:'Location Type'},
  {key:'model',label:'Business Model'},{key:'status',label:'Status'},
  {key:'openingDate',label:'Opening Date'},{key:'closureDate',label:'Closure Date'},
  {key:'storeSize',label:'Store Size'},{key:'sqft',label:'Store Sqft'},
  {key:'storageSizeSqft',label:'Storage Sqft'},{key:'lat',label:'Latitude'},{key:'lng',label:'Longitude'},
  {key:'outletAddress',label:'Outlet Address'},{key:'storageAddress',label:'Storage Address'},
  {key:'monthlyRental',label:'Monthly Rental'},{key:'monthlySales',label:'Monthly Sales'},
  {key:'atv',label:'ATV'},{key:'gto',label:'GTO'},
  {key:'serviceCharge',label:'Service Charge'},{key:'apFees',label:'A&P Fees'},
  {key:'securityDeposit',label:'Security Deposit'},{key:'utilitiesDeposit',label:'Utilities Deposit'},
  {key:'mailboxDeposit',label:'Mailbox Deposit'},{key:'fitoutDeposit',label:'Fitout Deposit'},
  {key:'restorationDeposit',label:'Restoration Deposit'},
  {key:'leaseExpiry',label:'Lease Expiry'},{key:'halalExpiry',label:'Halal Expiry'},
  {key:'lad',label:'LAD Rate'},{key:'ladRemarks',label:'LAD Remarks'},
  {key:'landlordName',label:'Landlord Name'},{key:'tenantName',label:'Tenant Name'},
  {key:'franchisee',label:'Franchisee / PIC'},{key:'contact',label:'Contact'},{key:'notes',label:'Notes'},
]

const MOCK = [
  {id:1,outletCode:'TL-001',outletFormat:'Inline',brand:'Tealive',outletName:'Mid Valley Megamall',state:'Kuala Lumpur',type:'Mall',model:'Franchise',status:'Active',openingDate:'2019-03-15',closureDate:'',storeSize:'Medium (200-500sqft)',sqft:350,storageSizeSqft:40,lat:'3.1175',lng:'101.6765',outletAddress:'Lot G-023, Mid Valley Megamall, 59200 KL',storageAddress:'Store Room B2-12',monthlyRental:22000,monthlySales:185000,atv:14.5,gto:2220000,serviceCharge:1800,apFees:500,securityDeposit:66000,utilitiesDeposit:5000,mailboxDeposit:0,fitoutDeposit:10000,restorationDeposit:15000,leaseExpiry:'2026-03-31',halalExpiry:'2025-12-31',lad:'RM500/day',ladRemarks:'Triggered if fitout exceeds handover date',landlordName:'IGB Berhad',tenantName:'Loob Holding Sdn Bhd',franchisee:'Tan Wei Liang',contact:'011-2345678',notes:'High performer'},
  {id:2,outletCode:'TL-002',outletFormat:'Inline',brand:'Tealive',outletName:'Sunway Pyramid',state:'Selangor',type:'Mall',model:'Franchise',status:'Active',openingDate:'2020-07-01',closureDate:'',storeSize:'Medium (200-500sqft)',sqft:420,storageSizeSqft:55,lat:'3.0731',lng:'101.6066',outletAddress:'Lot LG1-88, Sunway Pyramid, Subang Jaya',storageAddress:'Store LG1-S3',monthlyRental:28000,monthlySales:210000,atv:15.2,gto:2520000,serviceCharge:2200,apFees:600,securityDeposit:84000,utilitiesDeposit:6000,mailboxDeposit:200,fitoutDeposit:12000,restorationDeposit:18000,leaseExpiry:'2025-09-30',halalExpiry:'2025-06-30',lad:'RM800/day',ladRemarks:'After 14-day grace period',landlordName:'Sunway Malls',tenantName:'Loob Holding Sdn Bhd',franchisee:'Lim Soo Fen',contact:'012-9876543',notes:'Lease renewal urgent'},
  {id:3,outletCode:'BB-001',outletFormat:'Cafe',brand:'Bask Bear Coffee',outletName:'IOI City Mall',state:'Selangor',type:'Mall',model:'Company-Owned',status:'Active',openingDate:'2021-11-20',closureDate:'',storeSize:'Large (500-800sqft)',sqft:600,storageSizeSqft:80,lat:'2.9726',lng:'101.7221',outletAddress:'Lot 2F-34, IOI City Mall, Putrajaya',storageAddress:'Back-of-house',monthlyRental:35000,monthlySales:155000,atv:18.0,gto:1860000,serviceCharge:3000,apFees:800,securityDeposit:105000,utilitiesDeposit:8000,mailboxDeposit:300,fitoutDeposit:20000,restorationDeposit:25000,leaseExpiry:'2027-06-30',halalExpiry:'2026-03-31',lad:'RM1000/day',ladRemarks:'Cap at 5% of contract',landlordName:'IOI Properties',tenantName:'Loob Holding Sdn Bhd',franchisee:'',contact:'',notes:'Flagship store'},
  {id:4,outletCode:'AY-001',outletFormat:'Restaurant',brand:'Ayee Southern Thai',outletName:'Pavilion Bukit Jalil',state:'Kuala Lumpur',type:'Mall',model:'Franchise',status:'Active',openingDate:'2023-01-10',closureDate:'',storeSize:'Flagship (>800sqft)',sqft:800,storageSizeSqft:120,lat:'3.0584',lng:'101.6901',outletAddress:'Lot 3F-11, Pavilion Bukit Jalil',storageAddress:'Store 3F-S5',monthlyRental:32000,monthlySales:98000,atv:22.5,gto:1176000,serviceCharge:4000,apFees:1000,securityDeposit:96000,utilitiesDeposit:10000,mailboxDeposit:300,fitoutDeposit:25000,restorationDeposit:30000,leaseExpiry:'2027-03-31',halalExpiry:'2026-06-30',lad:'RM1200/day',ladRemarks:'Under review',landlordName:'Pavilion Group',tenantName:'Loob Holding Sdn Bhd',franchisee:'Mohd Razif',contact:'019-8877665',notes:'Below target'},
  {id:5,outletCode:'GD-001',outletFormat:'Kiosk',brand:'Gindaco',outletName:'Pavilion KL',state:'Kuala Lumpur',type:'Mall',model:'JV',status:'Active',openingDate:'2022-09-05',closureDate:'',storeSize:'Small (80-200sqft)',sqft:200,storageSizeSqft:20,lat:'3.1488',lng:'101.7131',outletAddress:'Lot G-118, Pavilion KL',storageAddress:'N/A',monthlyRental:25000,monthlySales:88000,atv:19.0,gto:1056000,serviceCharge:1200,apFees:400,securityDeposit:75000,utilitiesDeposit:5000,mailboxDeposit:200,fitoutDeposit:8000,restorationDeposit:12000,leaseExpiry:'2026-06-30',halalExpiry:'2025-09-30',lad:'RM700/day',ladRemarks:'JV partner co-liable',landlordName:'Pavilion Group',tenantName:'Gindaco Malaysia JV',franchisee:'JV Partner',contact:'',notes:'Monitor closely'},
]

// helpers
const rsr  = (r,s) => (!s||s==0) ? null : ((r/s)*100).toFixed(1)
const days = d => !d ? null : Math.ceil((new Date(d)-new Date())/86400000)
const fRM  = v => (v===''||v===null||v===undefined) ? '—' : 'RM '+Number(v).toLocaleString()
const dep  = o => [o.securityDeposit,o.utilitiesDeposit,o.mailboxDeposit,o.fitoutDeposit,o.restorationDeposit].reduce((s,v)=>s+(Number(v)||0),0)
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g,'')

function toDB(o) {
  return {
    outlet_code:o.outletCode, outlet_format:o.outletFormat, brand:o.brand,
    outlet_name:o.outletName, state:o.state, type:o.type, model:o.model, status:o.status,
    opening_date:o.openingDate||null, closure_date:o.closureDate||null,
    store_size:o.storeSize, sqft:o.sqft||null, storage_size_sqft:o.storageSizeSqft||null,
    lat:o.lat, lng:o.lng, outlet_address:o.outletAddress, storage_address:o.storageAddress,
    monthly_rental:o.monthlyRental||null, monthly_sales:o.monthlySales||null,
    atv:o.atv||null, gto:o.gto||null, service_charge:o.serviceCharge||null, ap_fees:o.apFees||null,
    security_deposit:o.securityDeposit||null, utilities_deposit:o.utilitiesDeposit||null,
    mailbox_deposit:o.mailboxDeposit||null, fitout_deposit:o.fitoutDeposit||null,
    restoration_deposit:o.restorationDeposit||null,
    lease_expiry:o.leaseExpiry||null, halal_expiry:o.halalExpiry||null,
    lad:o.lad, lad_remarks:o.ladRemarks, landlord_name:o.landlordName, tenant_name:o.tenantName,
    franchisee:o.franchisee, contact:o.contact, notes:o.notes,
  }
}
function fromDB(r) {
  return {
    id:r.id, outletCode:r.outlet_code||'', outletFormat:r.outlet_format||'',
    brand:r.brand||'', outletName:r.outlet_name||'', state:r.state||'',
    type:r.type||'', model:r.model||'', status:r.status||'Active',
    openingDate:r.opening_date||'', closureDate:r.closure_date||'',
    storeSize:r.store_size||'', sqft:r.sqft||'', storageSizeSqft:r.storage_size_sqft||'',
    lat:r.lat||'', lng:r.lng||'', outletAddress:r.outlet_address||'', storageAddress:r.storage_address||'',
    monthlyRental:r.monthly_rental||'', monthlySales:r.monthly_sales||'',
    atv:r.atv||'', gto:r.gto||'', serviceCharge:r.service_charge||'', apFees:r.ap_fees||'',
    securityDeposit:r.security_deposit||'', utilitiesDeposit:r.utilities_deposit||'',
    mailboxDeposit:r.mailbox_deposit||'', fitoutDeposit:r.fitout_deposit||'',
    restorationDeposit:r.restoration_deposit||'',
    leaseExpiry:r.lease_expiry||'', halalExpiry:r.halal_expiry||'',
    lad:r.lad||'', ladRemarks:r.lad_remarks||'',
    landlordName:r.landlord_name||'', tenantName:r.tenant_name||'',
    franchisee:r.franchisee||'', contact:r.contact||'', notes:r.notes||'',
  }
}

// ─── UI primitives ────────────────────────────────────────────────
function StatusPill({ status }) {
  const m = {
    'Active':[C.green,C.greenBg], 'Under Renovation':[C.amber,C.amberBg],
    'Pending Opening':[C.blue,C.blueBg], 'Closed':['#6B7280','#F3F4F6'],
    'Under Negotiation':[C.purple,C.purpleBg],
  }
  const [fg,bg] = m[status]||['#6B7280','#F3F4F6']
  return <span style={{background:bg,color:fg,padding:'3px 10px',borderRadius:99,fontSize:13,fontWeight:700}}>{status}</span>
}

function DaysBadge({ d }) {
  if (d===null) return <span style={{color:'#9CA3AF'}}>—</span>
  const [bg,color,label] = d<0 ? [C.redBg,C.red,'EXPIRED'] : d<60 ? [C.redBg,C.red,d+'d'] : d<120 ? [C.amberBg,C.amber,d+'d'] : [C.greenBg,C.green,d+'d']
  return <span style={{background:bg,color,padding:'3px 10px',borderRadius:99,fontSize:13,fontWeight:700}}>{label}</span>
}

function RSB({ ratio }) {
  if (!ratio) return <span style={{color:'#9CA3AF'}}>—</span>
  const r = parseFloat(ratio)
  return <span style={{color:r>15?C.red:r>10?C.amber:C.green,fontWeight:700,fontSize:14}}>{ratio}%</span>
}

function Toast({ msg, type }) {
  if (!msg) return null
  const [bg,color] = type==='error' ? [C.redBg,C.red] : type==='loading' ? [C.blueBg,C.blue] : [C.greenBg,C.green]
  return (
    <div style={{position:'fixed',bottom:24,right:24,background:bg,border:`1px solid ${color}`,borderRadius:12,padding:'14px 22px',fontSize:15,fontWeight:600,color,zIndex:9999,boxShadow:'0 4px 24px rgba(0,0,0,0.1)'}}>
      {type==='loading'?'⟳ ':type==='error'?'✕ ':'✓ '}{msg}
    </div>
  )
}

function DelModal({ outlet, onConfirm, onCancel }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:420,textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.15)'}}>
        <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
        <div style={{fontSize:20,fontWeight:800,color:C.red,marginBottom:8}}>Delete Outlet?</div>
        <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:6}}>{outlet.outletCode} — {outlet.outletName}</div>
        <div style={{fontSize:14,color:C.sub,marginBottom:28}}>This permanently deletes from the database and cannot be undone.</div>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onCancel} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:'10px 24px',borderRadius:9,cursor:'pointer',fontSize:15,fontWeight:600}}>Cancel</button>
          <button onClick={onConfirm} style={{background:C.red,border:'none',color:'#fff',padding:'10px 24px',borderRadius:9,cursor:'pointer',fontSize:15,fontWeight:700}}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── CSV helpers ──────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim())
  const rows = lines.slice(1).map(line => {
    const vals = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch==='"') inQ=!inQ
      else if (ch===','&&!inQ) { vals.push(cur.trim()); cur='' }
      else cur+=ch
    }
    vals.push(cur.trim())
    const obj = {}
    headers.forEach((h,i) => { obj[h] = vals[i]||'' })
    return obj
  })
  return { headers, rows }
}

function autoMap(headers) {
  const map = {}
  DB_FIELDS.forEach(f => {
    const fk=norm(f.key), fl=norm(f.label)
    const match = headers.find(h => { const hn=norm(h); return hn===fk||hn===fl||hn.includes(fk)||fk.includes(hn)||hn.includes(fl)||fl.includes(hn) })
    map[f.key] = match||''
  })
  return map
}

// ─── Import View ──────────────────────────────────────────────────
function ImportView({ onImported, showToast, isLive }) {
  const [step, setStep]       = useState(1)
  const [csv,  setCsv]        = useState(null)
  const [map,  setMap]        = useState({})
  const [prev, setPrev]       = useState([])
  const [busy, setBusy]       = useState(false)
  const [pct,  setPct]        = useState(0)

  const inp = { background:'#fff', border:`1px solid ${C.border}`, color:C.text, padding:'8px 12px', borderRadius:8, fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const { headers, rows } = parseCSV(ev.target.result)
        setCsv({ headers, rows }); setMap(autoMap(headers)); setStep(2)
      } catch(err) { showToast('Cannot parse CSV: '+err.message,'error') }
    }
    r.readAsText(f)
  }

  function buildPreview() {
    setPrev(csv.rows.slice(0,5).map(row => {
      const o={}; DB_FIELDS.forEach(f => { o[f.key]=map[f.key]?row[map[f.key]]||'':'' }); return o
    }))
    setStep(3)
  }

  async function doImport() {
    setBusy(true); setPct(0)
    const all = csv.rows.map(row => { const o={}; DB_FIELDS.forEach(f => { o[f.key]=map[f.key]?row[map[f.key]]||'':'' }); return o })
    if (!isLive) {
      await new Promise(r=>setTimeout(r,1200))
      setBusy(false); onImported(all.map((o,i)=>({...o,id:Date.now()+i}))); return
    }
    const toNum = v => v ? Number(String(v).replace(/[^0-9.]/g,''))||null : null
    const BATCH=50; const done=[]
    for (let i=0; i<all.length; i+=BATCH) {
      const batch = all.slice(i,i+BATCH).map(o => ({
        outlet_code:o.outletCode, outlet_format:o.outletFormat, brand:o.brand,
        outlet_name:o.outletName, state:o.state, type:o.type, model:o.model, status:o.status||'Active',
        opening_date:o.openingDate||null, closure_date:o.closureDate||null,
        store_size:o.storeSize, sqft:toNum(o.sqft), storage_size_sqft:toNum(o.storageSizeSqft),
        lat:o.lat, lng:o.lng, outlet_address:o.outletAddress, storage_address:o.storageAddress,
        monthly_rental:toNum(o.monthlyRental), monthly_sales:toNum(o.monthlySales),
        atv:toNum(o.atv), gto:toNum(o.gto), service_charge:toNum(o.serviceCharge), ap_fees:toNum(o.apFees),
        security_deposit:toNum(o.securityDeposit), utilities_deposit:toNum(o.utilitiesDeposit),
        mailbox_deposit:toNum(o.mailboxDeposit), fitout_deposit:toNum(o.fitoutDeposit),
        restoration_deposit:toNum(o.restorationDeposit),
        lease_expiry:o.leaseExpiry||null, halal_expiry:o.halalExpiry||null,
        lad:o.lad, lad_remarks:o.ladRemarks, landlord_name:o.landlordName, tenant_name:o.tenantName,
        franchisee:o.franchisee, contact:o.contact, notes:o.notes,
      }))
      try {
        const res = await fetch(API,{method:'POST',headers:HDR,body:JSON.stringify(batch)})
        if (!res.ok) throw new Error(await res.text())
        done.push(...(await res.json()).map(fromDB))
        setPct(Math.min(100,Math.round(((i+BATCH)/all.length)*100)))
      } catch(err) { showToast('Import error: '+err.message,'error'); setBusy(false); return }
    }
    setBusy(false); onImported(done)
  }

  const card = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }

  return (
    <div style={{maxWidth:960,margin:'0 auto'}}>
      {/* Step indicator */}
      <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
        {['Upload CSV','Map Columns','Preview & Import'].map((s,i) => (
          <div key={s} style={{display:'flex',alignItems:'center',flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:30,height:30,borderRadius:99,background:step>i+1?C.green:step===i+1?C.accent:'#E5E7EB',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700}}>
                {step>i+1?'✓':i+1}
              </div>
              <span style={{fontSize:15,fontWeight:600,color:step===i+1?C.text:C.sub}}>{s}</span>
            </div>
            {i<2&&<div style={{flex:1,height:2,background:'#E5E7EB',margin:'0 14px'}}/>}
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={card}>
          <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:6}}>Upload your Excel file as CSV</div>
          <div style={{fontSize:14,color:C.sub,marginBottom:20}}>In Excel → <strong style={{color:C.text}}>File → Save As → CSV (Comma delimited)</strong></div>
          {!isLive && <div style={{background:C.amberBg,border:`1px solid ${C.amber}`,borderRadius:10,padding:'12px 16px',fontSize:14,color:C.amber,marginBottom:20,fontWeight:500}}>⚠ Preview mode — deploy to Vercel for real Supabase imports.</div>}
          <label style={{display:'block',border:`2px dashed ${C.border}`,borderRadius:12,padding:'50px 20px',textAlign:'center',cursor:'pointer',background:C.bg}}>
            <input type="file" accept=".csv" onChange={onFile} style={{display:'none'}}/>
            <div style={{fontSize:48,marginBottom:12}}>📂</div>
            <div style={{fontSize:17,fontWeight:600,color:C.text,marginBottom:6}}>Click to select your CSV file</div>
            <div style={{fontSize:14,color:C.sub}}>Column names don't need to match — you'll map them in the next step</div>
          </label>
          <div style={{marginTop:20,background:'#F8FAFC',borderRadius:10,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.sub,marginBottom:8}}>TIPS</div>
            <div style={{fontSize:14,color:C.sub,lineHeight:1.9}}>• Dates in YYYY-MM-DD format (e.g. 2026-03-31)<br/>• Amounts as numbers only — no "RM" prefix needed<br/>• Empty columns will be left blank and can be filled later via Edit</div>
          </div>
        </div>
      )}

      {step===2 && csv && (
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:C.text}}>Map your columns</div>
              <div style={{fontSize:14,color:C.sub,marginTop:3}}>{csv.rows.length} rows · {csv.headers.length} columns · auto-matched where possible</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(1)} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 18px',borderRadius:9,cursor:'pointer',fontSize:14,fontWeight:600}}>← Back</button>
              <button onClick={buildPreview} style={{background:C.accent,border:'none',color:'#fff',padding:'9px 18px',borderRadius:9,cursor:'pointer',fontSize:14,fontWeight:700}}>Preview →</button>
            </div>
          </div>
          <div style={{maxHeight:420,overflowY:'auto',display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:24,rowGap:2}}>
            {DB_FIELDS.map(f => (
              <div key={f.key} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:map[f.key]?C.text:C.sub}}>{f.label}</div>
                <select value={map[f.key]||''} onChange={e=>setMap(m=>({...m,[f.key]:e.target.value}))} style={{...inp,fontSize:13,padding:'6px 10px'}}>
                  <option value="">— skip —</option>
                  {csv.headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{...card,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:busy?16:0}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:C.text}}>Preview — first 5 rows</div>
                <div style={{fontSize:14,color:C.sub,marginTop:3}}>{csv.rows.length} outlets ready to import</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(2)} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 18px',borderRadius:9,cursor:'pointer',fontSize:14,fontWeight:600}}>← Back</button>
                <button onClick={doImport} disabled={busy} style={{background:busy?'#93C5FD':C.accent,border:'none',color:'#fff',padding:'9px 22px',borderRadius:9,cursor:busy?'not-allowed':'pointer',fontSize:14,fontWeight:700,minWidth:190}}>
                  {busy?`Importing... ${pct}%`:`Import ${csv.rows.length} Outlets →`}
                </button>
              </div>
            </div>
            {busy && <div style={{marginTop:14}}><div style={{height:8,background:'#E5E7EB',borderRadius:99}}><div style={{width:pct+'%',height:'100%',background:C.accent,borderRadius:99,transition:'width 0.3s'}}/></div><div style={{fontSize:13,color:C.sub,marginTop:5}}>{pct}% complete</div></div>}
          </div>
          <div style={{...card,overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.border}`}}>
                  {['Code','Brand','Outlet Name','State','Status','Rental','Sales','Lease Expiry','Franchisee'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',color:C.sub,fontWeight:700,fontSize:13}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prev.map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?'#fff':'#F8FAFC'}}>
                    <td style={{padding:'10px 12px',color:C.accent,fontWeight:700,fontFamily:'monospace'}}>{row.outletCode||'—'}</td>
                    <td style={{padding:'10px 12px',color:BRAND_COLOR[row.brand]||C.text,fontWeight:600}}>{row.brand||'—'}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:C.text}}>{row.outletName||'—'}</td>
                    <td style={{padding:'10px 12px',color:C.sub}}>{row.state||'—'}</td>
                    <td style={{padding:'10px 12px',color:C.sub}}>{row.status||'—'}</td>
                    <td style={{padding:'10px 12px'}}>{row.monthlyRental?'RM '+Number(row.monthlyRental).toLocaleString():'—'}</td>
                    <td style={{padding:'10px 12px'}}>{row.monthlySales?'RM '+Number(row.monthlySales).toLocaleString():'—'}</td>
                    <td style={{padding:'10px 12px',color:C.sub}}>{row.leaseExpiry||'—'}</td>
                    <td style={{padding:'10px 12px',color:C.sub}}>{row.franchisee||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Outlet Form ──────────────────────────────────────────────────
function OutletForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({...initial})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const inp = { background:'#fff', border:`1px solid ${C.border}`, color:C.text, padding:'9px 13px', borderRadius:9, fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }

  function Field({ k, l, type, opts, textarea, full }) {
    const val = form[k]??''
    const el = opts
      ? <select value={val} onChange={e=>set(k,e.target.value)} style={inp}><option value=''>— Select —</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
      : textarea
        ? <textarea value={val} onChange={e=>set(k,e.target.value)} rows={3} style={{...inp,resize:'vertical'}}/>
        : <input type={type||'text'} value={val} onChange={e=>set(k,e.target.value)} style={inp}/>
    return (
      <div style={{gridColumn:full?'1/-1':'auto'}}>
        <label style={{fontSize:12,color:C.sub,fontWeight:700,display:'block',marginBottom:5,letterSpacing:0.3}}>{l.toUpperCase()}</label>
        {el}
      </div>
    )
  }

  return (
    <div>
      {FORM_SECTIONS.map(sec => (
        <div key={sec.title} style={{marginBottom:22}}>
          <div style={{fontSize:12,color:C.accent,fontWeight:700,letterSpacing:2,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.accentBg}`}}>{sec.title.toUpperCase()}</div>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${sec.cols},1fr)`,gap:12}}>
            {sec.fields.map(f=><Field key={f.k} k={f.k} l={f.l} type={f.type} opts={f.opts} textarea={f.textarea} full={f.full}/>)}
          </div>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <button onClick={onCancel} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'10px 22px',borderRadius:9,cursor:'pointer',fontSize:15,fontWeight:600}}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{background:saving?'#93C5FD':C.accent,border:'none',color:'#fff',padding:'10px 26px',borderRadius:9,cursor:saving?'not-allowed':'pointer',fontSize:15,fontWeight:700}}>
          {saving?'Saving...':'Save Outlet'}
        </button>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [outlets,    setOutlets]    = useState([])
  const [isLive,     setIsLive]     = useState(false)
  const [ready,      setReady]      = useState(false)
  const [view,       setView]       = useState('dashboard')
  const [toast,      setToast]      = useState({msg:'',type:''})
  const [filterBrand,setFilterBrand]= useState('All Brands')
  const [filterStatus,setFilterStatus]=useState('All')
  const [search,     setSearch]     = useState('')
  const [sortK,      setSortK]      = useState('outletCode')
  const [sortAsc,    setSortAsc]    = useState(true)
  const [expanded,   setExpanded]   = useState(null)
  const [editing,    setEditing]    = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [alertsOnly, setAlertsOnly] = useState(false)

  const toast$ = (msg,type='success') => { setToast({msg,type}); if(type!=='loading') setTimeout(()=>setToast({msg:'',type:''}),3500) }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}?order=outlet_code.asc`,{headers:{...HDR,'Prefer':''},signal:AbortSignal.timeout(5000)})
      if (!res.ok) throw new Error()
      setOutlets((await res.json()).map(fromDB)); setIsLive(true)
    } catch { setOutlets(MOCK); setIsLive(false) }
    finally { setReady(true) }
  },[])

  useEffect(()=>{ load() },[load])

  const filtered = useMemo(()=>{
    let d = [...outlets]
    if (filterBrand!=='All Brands') d=d.filter(o=>o.brand===filterBrand)
    if (filterStatus!=='All') d=d.filter(o=>o.status===filterStatus)
    if (search) d=d.filter(o=>[o.outletCode,o.outletName,o.state,o.franchisee,o.outletAddress,o.landlordName,o.notes].join(' ').toLowerCase().includes(search.toLowerCase()))
    if (alertsOnly) d=d.filter(o=>{const ld=days(o.leaseExpiry),hd=days(o.halalExpiry);return(ld!==null&&ld<120)||(hd!==null&&hd<120)})
    d.sort((a,b)=>{let av=a[sortK]??'',bv=b[sortK]??'';if(typeof av==='string')av=av.toLowerCase();if(typeof bv==='string')bv=bv.toLowerCase();return sortAsc?(av>bv?1:-1):(av<bv?1:-1)})
    return d
  },[outlets,filterBrand,filterStatus,search,sortK,sortAsc,alertsOnly])

  const stats = useMemo(()=>{
    const ac = outlets.filter(o=>o.status==='Active')
    const sales  = ac.reduce((s,o)=>s+(Number(o.monthlySales)||0),0)
    const rental = ac.reduce((s,o)=>s+(Number(o.monthlyRental)||0),0)
    const deps   = outlets.reduce((s,o)=>s+dep(o),0)
    const avgRS  = sales ? ((rental/sales)*100).toFixed(1) : 0
    const alerts = outlets.filter(o=>{const ld=days(o.leaseExpiry),hd=days(o.halalExpiry);return(ld!==null&&ld<120)||(hd!==null&&hd<120)}).length
    return { total:outlets.length, active:ac.length, sales, rental, deps, avgRS, alerts }
  },[outlets])

  function sortBy(k) { if(sortK===k) setSortAsc(!sortAsc); else { setSortK(k); setSortAsc(true) } }

  async function save(data) {
    setSaving(true); toast$('Saving...','loading')
    try {
      if (isLive) {
        if (data.id) {
          const res = await fetch(`${API}?id=eq.${data.id}`,{method:'PATCH',headers:HDR,body:JSON.stringify(toDB(data))})
          if (!res.ok) throw new Error(await res.text())
          const updated = fromDB((await res.json())[0])
          setOutlets(p=>p.map(o=>o.id===data.id?updated:o))
        } else {
          const res = await fetch(API,{method:'POST',headers:HDR,body:JSON.stringify(toDB(data))})
          if (!res.ok) throw new Error(await res.text())
          const created = fromDB((await res.json())[0])
   setOutlets(p=>[...p,created])
        }
      } else {
        if (data.id) setOutlets(p=>p.map(o=>o.id===data.id?data:o))
        else setOutlets(p=>[...p,{...data,id:Date.now()}])
      }
      toast$(data.id?'Outlet updated':'Outlet created')
      setEditing(null)
    } catch(e) { toast$('Save failed: '+e.message,'error') }
    finally { setSaving(false) }
  }

  async function confirmDelete() {
    const id = delTarget.id; toast$('Deleting...','loading')
    try {
      if (isLive) { const res=await fetch(`${API}?id=eq.${id}`,{method:'DELETE',headers:{...HDR,'Prefer':''}}); if(!res.ok) throw new Error(await res.text()) }
      setOutlets(p=>p.filter(o=>o.id!==id)); toast$('Outlet deleted')
    } catch(e) { toast$('Delete failed: '+e.message,'error') }
    finally { setDelTarget(null) }
  }

  function exportCSV() {
    const keys = ['outletCode','outletFormat','brand','outletName','state','type','model','status','openingDate','closureDate','storeSize','sqft','storageSizeSqft','lat','lng','outletAddress','storageAddress','monthlyRental','monthlySales','atv','gto','serviceCharge','apFees','securityDeposit','utilitiesDeposit','mailboxDeposit','fitoutDeposit','restorationDeposit','leaseExpiry','halalExpiry','lad','ladRemarks','landlordName','tenantName','franchisee','contact','notes']
    const hdrs = ['Outlet Code','Format','Brand','Outlet Name','State','Type','Model','Status','Opening Date','Closure Date','Store Size','Sqft','Storage Sqft','Lat','Lng','Outlet Address','Storage Address','Monthly Rental','Monthly Sales','ATV','GTO','Service Charge','A&P Fees','Security Deposit','Utilities Deposit','Mailbox Deposit','Fitout Deposit','Restoration Deposit','Lease Expiry','Halal Expiry','LAD','LAD Remarks','Landlord','Tenant','Franchisee','Contact','Notes']
    const rows = filtered.map(o=>[...keys.map(k=>o[k]??''), rsr(o.monthlyRental,o.monthlySales)??''])
    const csv  = [[...hdrs,'R/S Ratio (%)'],...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download = `loob_outlets_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); toast$('CSV exported')
  }

  // shared table styles
  const TH = { padding:'11px 14px', textAlign:'left', color:C.sub, fontWeight:700, fontSize:13, whiteSpace:'nowrap', borderBottom:`2px solid ${C.border}`, background:'#F8FAFC' }
  const TD = { padding:'11px 14px', fontSize:14, verticalAlign:'middle', borderBottom:`1px solid ${C.border}` }

  if (!ready) return (
    <div style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,Segoe UI,sans-serif'}}>
      <div style={{textAlign:'center',color:C.sub}}><div style={{fontSize:40,marginBottom:10}}>⟳</div><div style={{fontSize:16}}>Loading...</div></div>
    </div>
  )

  return (
    <div style={{fontFamily:'Inter,"Segoe UI",sans-serif',background:C.bg,minHeight:'100vh',color:C.text,display:'flex',fontSize:14}}>
      <Toast msg={toast.msg} type={toast.type}/>
      {delTarget && <DelModal outlet={delTarget} onConfirm={confirmDelete} onCancel={()=>setDelTarget(null)}/>}

      {/* ── SIDEBAR ── */}
      <div style={{width:230,background:C.white,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',padding:'24px 0',flexShrink:0,boxShadow:'2px 0 8px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'0 20px 28px'}}>
          <div style={{fontSize:10,letterSpacing:3,color:C.sub,fontWeight:700,marginBottom:5}}>LOOB HOLDING</div>
          <div style={{fontSize:20,fontWeight:800,color:C.text,lineHeight:1.3}}>Outlet<br/>Manager</div>
          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:8,height:8,borderRadius:99,background:isLive?C.green:C.amber}}/>
            <span style={{fontSize:12,color:C.sub,fontWeight:500}}>{isLive?'Live · Supabase':'Preview mode'}</span>
          </div>
        </div>
        {NAV.map(n=>(
          <button key={n.key} onClick={()=>setView(n.key)} style={{background:view===n.key?C.accentBg:'transparent',border:'none',borderLeft:view===n.key?`3px solid ${C.accent}`:'3px solid transparent',color:view===n.key?C.accent:C.sub,padding:'13px 20px',textAlign:'left',cursor:'pointer',fontSize:15,fontWeight:view===n.key?700:500,display:'flex',alignItems:'center',gap:10,transition:'all 0.1s'}}>
            <span style={{fontSize:16}}>{n.icon}</span>
            {n.label}
            {n.key==='import'&&<span style={{marginLeft:'auto',background:C.accent,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99}}>NEW</span>}
          </button>
        ))}
        <div style={{marginTop:'auto',padding:'0 16px'}}>
          <button onClick={load} style={{width:'100%',background:'#fff',border:`1px solid ${C.border}`,color:C.sub,padding:'9px',borderRadius:9,cursor:'pointer',fontSize:13,marginBottom:12}}>↺ Refresh</button>
          {stats.alerts>0&&<div style={{background:C.redBg,border:`1px solid #FCA5A5`,borderRadius:10,padding:'11px 14px',fontSize:14,marginBottom:12}}><div style={{color:C.red,fontWeight:700}}>⚠ {stats.alerts} Alerts</div><div style={{color:C.red,opacity:0.7,fontSize:13,marginTop:2}}>Lease / Halal expiring</div></div>}
          <div style={{background:C.amberBg,border:`1px solid #FCD34D`,borderRadius:10,padding:'13px 14px'}}>
            <div style={{fontSize:12,color:C.amber,fontWeight:700,marginBottom:3}}>DEPOSITS AT RISK</div>
            <div style={{fontSize:18,fontWeight:800,color:C.amber}}>RM {(stats.deps/1000000).toFixed(2)}M</div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'auto'}}>
        {/* topbar */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:C.text}}>{NAV.find(n=>n.key===view)?.label}</div>
            <div style={{fontSize:13,color:C.sub,marginTop:2}}>{new Date().toLocaleDateString('en-MY',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={exportCSV} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 18px',borderRadius:9,cursor:'pointer',fontSize:14,fontWeight:600}}>↓ Export CSV</button>
            <button onClick={()=>setEditing({...EMPTY})} style={{background:C.accent,border:'none',color:'#fff',padding:'9px 20px',borderRadius:9,cursor:'pointer',fontSize:14,fontWeight:700}}>+ Add Outlet</button>
          </div>
        </div>

        <div style={{padding:24,flex:1}}>

          {/* ─ DASHBOARD ─ */}
          {view==='dashboard'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
                {[
                  {l:'Total Outlets',   v:stats.total,  sub:`${stats.active} active`,                              c:C.accent},
                  {l:'Portfolio Sales', v:'RM '+(stats.sales/1000).toFixed(0)+'K/mo', sub:'active outlets only',   c:C.green},
                  {l:'Avg R/S Ratio',   v:stats.avgRS+'%', sub:parseFloat(stats.avgRS)>15?'Above target':'Within target', c:parseFloat(stats.avgRS)>15?C.red:C.green},
                  {l:'Compliance Alerts',v:stats.alerts, sub:'expiring within 120 days',                            c:stats.alerts>0?C.amber:C.green},
                ].map(c=>(
                  <div key={c.l} style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize:12,color:C.sub,letterSpacing:1,fontWeight:700,marginBottom:8}}>{c.l.toUpperCase()}</div>
                    <div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div>
                    <div style={{fontSize:13,color:C.sub,marginTop:5}}>{c.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
                {[
                  {l:'Total Monthly Rental', v:fRM(stats.rental)},
                  {l:'Capital in Deposits',  v:'RM '+(stats.deps/1000000).toFixed(2)+'M', c:C.amber},
                  {l:'Monthly SC + A&P',     v:fRM(outlets.reduce((s,o)=>s+(Number(o.serviceCharge)||0)+(Number(o.apFees)||0),0))},
                ].map(c=>(
                  <div key={c.l} style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,padding:'15px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize:14,color:C.sub}}>{c.l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:c.c||C.text}}>{c.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:16}}>
                <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.sub,marginBottom:16,letterSpacing:1}}>BRAND NETWORK</div>
                  {BRANDS.slice(1).map(b=>{
                    const bos=outlets.filter(o=>o.brand===b)
                    const bSales=bos.filter(o=>o.status==='Active').reduce((s,o)=>s+(Number(o.monthlySales)||0),0)
                    const pct=stats.total?Math.round((bos.length/stats.total)*100):0
                    return(
                      <div key={b} style={{marginBottom:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                          <span style={{fontSize:14,fontWeight:700,color:BRAND_COLOR[b]||C.text}}>{b}</span>
                          <span style={{fontSize:13,color:C.sub}}>{bos.length} outlets · {fRM(bSales)}/mo</span>
                        </div>
                        <div style={{height:6,background:'#F1F5F9',borderRadius:99}}><div style={{width:pct+'%',height:'100%',background:BRAND_COLOR[b]||C.accent,borderRadius:99}}/></div>
                      </div>
                    )
                  })}
                </div>
                <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.sub,marginBottom:16,letterSpacing:1}}>UPCOMING ALERTS</div>
                  {outlets.flatMap(o=>{
                    const items=[]
                    const ld=days(o.leaseExpiry),hd=days(o.halalExpiry)
                    if(ld!==null&&ld<120) items.push({name:o.outletName,code:o.outletCode,brand:o.brand,type:'Lease',d:ld})
                    if(hd!==null&&hd<120) items.push({name:o.outletName,code:o.outletCode,brand:o.brand,type:'Halal',d:hd})
                    return items
                  }).sort((a,b)=>a.d-b.d).slice(0,6).map((a,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:C.text}}>{a.name} <span style={{color:C.sub,fontSize:12}}>({a.code})</span></div>
                        <div style={{fontSize:12,color:BRAND_COLOR[a.brand]||C.sub}}>{a.brand} · {a.type}</div>
                      </div>
                      <DaysBadge d={a.d}/>
                    </div>
                  ))}
                  {stats.alerts===0&&<div style={{color:C.sub,fontSize:14}}>All compliance dates on track ✓</div>}
                </div>
              </div>
            </div>
          )}

          {/* ─ OUTLETS ─ */}
          {view==='outlets'&&(
            <div>
              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search outlet, code, address, landlord...' style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 13px',borderRadius:9,fontSize:14,outline:'none',width:280}}/>
                <select value={filterBrand} onChange={e=>setFilterBrand(e.target.value)} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 13px',borderRadius:9,fontSize:14,outline:'none'}}>
                  {BRANDS.map(b=><option key={b}>{b}</option>)}
                </select>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:'#fff',border:`1px solid ${C.border}`,color:C.text,padding:'9px 13px',borderRadius:9,fontSize:14,outline:'none'}}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
                <button onClick={()=>setAlertsOnly(!alertsOnly)} style={{background:alertsOnly?C.redBg:'#fff',border:`1px solid ${alertsOnly?'#FCA5A5':C.border}`,color:alertsOnly?C.red:C.sub,padding:'9px 14px',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer'}}>⚠ Alerts Only</button>
                <div style={{marginLeft:'auto',color:C.sub,fontSize:14}}>{filtered.length} outlets</div>
              </div>
              <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        {[['outletCode','Code'],['outletFormat','Format'],['brand','Brand'],['outletName','Outlet Name'],['state','State'],['type','Type'],['model','Model'],['status','Status'],['sqft','Sqft'],['monthlyRental','Rental'],['monthlySales','Sales'],['_rs','R/S'],['leaseExpiry','Lease'],['halalExpiry','Halal'],['franchisee','PIC']].map(([k,l])=>(
                          <th key={k} onClick={()=>!k.startsWith('_')&&sortBy(k)} style={{...TH,cursor:'pointer',color:sortK===k?C.accent:C.sub}}>{l}{sortK===k?(sortAsc?' ↑':' ↓'):''}</th>
                        ))}
                        <th style={TH}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o,i)=>{
                        const rs=rsr(o.monthlyRental,o.monthlySales)
                        const ld=days(o.leaseExpiry), hd=days(o.halalExpiry)
                        const isExp=expanded===o.id
                        return [
                          <tr key={o.id} onClick={()=>setExpanded(isExp?null:o.id)} style={{background:isExp?C.accentBg:i%2===0?'#fff':'#FAFBFD',cursor:'pointer'}}>
                            <td style={{...TD,fontFamily:'monospace',color:C.accent,fontWeight:700}}>{o.outletCode}</td>
                            <td style={{...TD,color:C.sub}}>{o.outletFormat||'—'}</td>
                            <td style={TD}><span style={{background:BRAND_BG[o.brand]||'#F3F4F6',color:BRAND_COLOR[o.brand]||C.text,padding:'2px 9px',borderRadius:99,fontSize:13,fontWeight:700}}>{o.brand}</span></td>
                            <td style={{...TD,fontWeight:600}}>{o.outletName}</td>
                            <td style={{...TD,color:C.sub}}>{o.state}</td>
                            <td style={{...TD,color:C.sub}}>{o.type}</td>
                            <td style={{...TD,color:C.sub}}>{o.model}</td>
                            <td style={TD}><StatusPill status={o.status}/></td>
                            <td style={{...TD,color:C.sub}}>{o.sqft||'—'}</td>
                            <td style={TD}>{o.monthlyRental?'RM '+Number(o.monthlyRental).toLocaleString():'—'}</td>
                            <td style={{...TD,fontWeight:600}}>{o.monthlySales?'RM '+Number(o.monthlySales).toLocaleString():'—'}</td>
                            <td style={TD}><RSB ratio={rs}/></td>
                            <td style={TD}><DaysBadge d={ld}/></td>
                            <td style={TD}><DaysBadge d={hd}/></td>
                            <td style={{...TD,color:C.sub}}>{o.franchisee||'—'}</td>
                            <td style={TD} onClick={e=>e.stopPropagation()}>
                              <div style={{display:'flex',gap:6}}>
                                <button onClick={()=>setEditing({...o})} style={{background:C.accentBg,border:`1px solid #BFDBFE`,color:C.accent,padding:'5px 12px',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:600}}>Edit</button>
                                <button onClick={()=>setDelTarget(o)} style={{background:C.redBg,border:`1px solid #FCA5A5`,color:C.red,padding:'5px 12px',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:600}}>Delete</button>
                              </div>
                            </td>
                          </tr>,
                          isExp&&(
                            <tr key={o.id+'-x'}>
                              <td colSpan={16} style={{padding:'18px 20px',background:'#F0F6FF',borderBottom:`1px solid ${C.border}`}}>
                                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:14}}>
                                  {[['Opening Date',o.openingDate||'—'],['Storage Sqft',o.storageSizeSqft?o.storageSizeSqft+' sqft':'—'],['Coordinates',(o.lat&&o.lng)?`${o.lat}, ${o.lng}`:'—'],['GTO Annual',fRM(o.gto)],['Service Charge',fRM(o.serviceCharge)+'/mo'],['A&P Fees',fRM(o.apFees)+'/mo'],['Security Dep',fRM(o.securityDeposit)],['Utilities Dep',fRM(o.utilitiesDeposit)],['Fitout Dep',fRM(o.fitoutDeposit)],['Restoration Dep',fRM(o.restorationDeposit)],['Mailbox Dep',fRM(o.mailboxDeposit)],['Total Deposits',fRM(dep(o)),true],['Landlord',o.landlordName||'—'],['Tenant',o.tenantName||'—'],['LAD Rate',o.lad||'—']].map(([l,v,hi])=>(
                                    <div key={l}><div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:3}}>{l.toUpperCase()}</div><div style={{fontSize:14,color:hi?C.amber:C.text,fontWeight:hi?700:400}}>{v}</div></div>
                                  ))}
                                </div>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                                  {[['OUTLET ADDRESS',o.outletAddress],['STORAGE ADDRESS',o.storageAddress],['LAD REMARKS',o.ladRemarks]].map(([l,v])=>(
                                    <div key={l}><div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:3}}>{l}</div><div style={{fontSize:14,color:C.text}}>{v||'—'}</div></div>
                                  ))}
                                  {o.notes&&<div style={{gridColumn:'1/-1'}}><div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:3}}>NOTES</div><div style={{fontSize:14,color:C.text}}>{o.notes}</div></div>}
                                </div>
                              </td>
                            </tr>
                          )
                        ]
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{marginTop:8,fontSize:13,color:C.sub}}>↓ Click any row to expand full details</div>
            </div>
          )}

          {/* ─ LEASE ─ */}
          {view==='lease'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:20}}>
                {[['Security Deposits','securityDeposit'],['Utilities Deposits','utilitiesDeposit'],['Fitout Deposits','fitoutDeposit'],['Restoration Deps','restorationDeposit'],['Mailbox Deposits','mailboxDeposit']].map(([l,k])=>{
                  const t=outlets.reduce((s,o)=>s+(Number(o[k])||0),0)
                  return <div key={l} style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}><div style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>{l.toUpperCase()}</div><div style={{fontSize:18,fontWeight:800,color:C.amber}}>RM {(t/1000).toFixed(0)}K</div></div>
                })}
              </div>
              <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>{['Code','Brand','Outlet','Landlord','Tenant','Lease Expiry','Status','LAD','Sec','Util','Fitout','Rest','MBX','TOTAL'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...outlets].sort((a,b)=>(days(a.leaseExpiry)??9999)-(days(b.leaseExpiry)??9999)).map((o,i)=>(
                        <tr key={o.id} style={{background:i%2===0?'#fff':'#FAFBFD'}}>
                          <td style={{...TD,fontFamily:'monospace',color:C.accent,fontWeight:700}}>{o.outletCode}</td>
                          <td style={TD}><span style={{color:BRAND_COLOR[o.brand],fontWeight:700,fontSize:13}}>{o.brand}</span></td>
                          <td style={{...TD,fontWeight:600}}>{o.outletName}</td>
                          <td style={{...TD,color:C.sub}}>{o.landlordName||'—'}</td>
                          <td style={{...TD,color:C.sub}}>{o.tenantName||'—'}</td>
                          <td style={{...TD,color:C.sub}}>{o.leaseExpiry||'—'}</td>
                          <td style={TD}><DaysBadge d={days(o.leaseExpiry)}/></td>
                          <td style={{...TD,color:C.sub}}>{o.lad||'—'}</td>
                          <td style={TD}>{fRM(o.securityDeposit)}</td>
                          <td style={TD}>{fRM(o.utilitiesDeposit)}</td>
                          <td style={TD}>{fRM(o.fitoutDeposit)}</td>
                          <td style={TD}>{fRM(o.restorationDeposit)}</td>
                          <td style={TD}>{fRM(o.mailboxDeposit)}</td>
                          <td style={{...TD,color:C.amber,fontWeight:700}}>{fRM(dep(o))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'#F8FAFC',borderTop:`2px solid ${C.border}`}}>
                        <td colSpan={8} style={{...TD,fontWeight:700,color:C.sub}}>PORTFOLIO TOTAL</td>
                        {['securityDeposit','utilitiesDeposit','fitoutDeposit','restorationDeposit','mailboxDeposit'].map(k=>(
                          <td key={k} style={{...TD,color:C.amber,fontWeight:700}}>{fRM(outlets.reduce((s,o)=>s+(Number(o[k])||0),0))}</td>
                        ))}
                        <td style={{...TD,color:C.amber,fontWeight:800,fontSize:15}}>{fRM(outlets.reduce((s,o)=>s+dep(o),0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─ COMPLIANCE ─ */}
          {view==='compliance'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
                {[[C.red,C.redBg,'Critical (<60 days)'],[C.amber,C.amberBg,'Warning (60–120 days)'],[C.green,C.greenBg,'On Track (>120 days)']].map(([c,bg,l],i)=>{
                  const cnt=outlets.filter(o=>{const mn=Math.min(days(o.leaseExpiry)??9999,days(o.halalExpiry)??9999);return i===0?mn<60:i===1?mn>=60&&mn<120:mn>=120}).length
                  return <div key={l} style={{background:bg,border:`1px solid ${c}44`,borderRadius:14,padding:'20px 22px'}}><div style={{fontSize:13,color:c,letterSpacing:1,fontWeight:700}}>{l.toUpperCase()}</div><div style={{fontSize:36,fontWeight:800,color:c,marginTop:8}}>{cnt}</div></div>
                })}
              </div>
              <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Code','Brand','Outlet','State','Lease Expiry','Lease','Halal Expiry','Halal','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...outlets].sort((a,b)=>Math.min(days(a.leaseExpiry)??9999,days(a.halalExpiry)??9999)-Math.min(days(b.leaseExpiry)??9999,days(b.halalExpiry)??9999)).map((o,i)=>(
                      <tr key={o.id} style={{background:i%2===0?'#fff':'#FAFBFD'}}>
                        <td style={{...TD,fontFamily:'monospace',color:C.accent,fontWeight:700}}>{o.outletCode}</td>
                        <td style={TD}><span style={{color:BRAND_COLOR[o.brand],fontWeight:700,fontSize:13}}>{o.brand}</span></td>
                        <td style={{...TD,fontWeight:600}}>{o.outletName}</td>
                        <td style={{...TD,color:C.sub}}>{o.state}</td>
                        <td style={{...TD,color:C.sub}}>{o.leaseExpiry||'—'}</td>
                        <td style={TD}><DaysBadge d={days(o.leaseExpiry)}/></td>
                        <td style={{...TD,color:C.sub}}>{o.halalExpiry||'—'}</td>
                        <td style={TD}><DaysBadge d={days(o.halalExpiry)}/></td>
                        <td style={TD}><StatusPill status={o.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ PERFORMANCE ─ */}
          {view==='performance'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
                {BRANDS.slice(1).map(b=>{
                  const bos=outlets.filter(o=>o.brand===b&&o.status==='Active')
                  const s=bos.reduce((s,o)=>s+(Number(o.monthlySales)||0),0)
                  const r=bos.reduce((s,o)=>s+(Number(o.monthlyRental)||0),0)
                  const rs=s?((r/s)*100).toFixed(1):null
                  return(
                    <div key={b} style={{background:'#fff',border:`1px solid ${C.border}`,borderLeft:`4px solid ${BRAND_COLOR[b]||C.accent}`,borderRadius:14,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                      <div style={{color:BRAND_COLOR[b],fontWeight:800,fontSize:15,marginBottom:12}}>{b}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                        {[['Active',bos.length,null],['Sales/mo','RM '+(s/1000).toFixed(0)+'K',C.green],['Rental/mo','RM '+(r/1000).toFixed(0)+'K',null],['R/S',rs?rs+'%':'—',rs&&parseFloat(rs)>15?C.red:rs?C.green:C.sub]].map(([l,v,c])=>(
                          <div key={l}><div style={{fontSize:12,color:C.sub}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:c||C.text}}>{v}</div></div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:700,color:C.sub,letterSpacing:1}}>OUTLET RANKING — Active, by Monthly Sales</div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>{['#','Code','Brand','Outlet','State','Sqft','Sales/mo','Rental/mo','SC','A&P','R/S','Sales/sqft','ATV','GTO/yr'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {outlets.filter(o=>o.status==='Active'&&o.monthlySales).sort((a,b)=>Number(b.monthlySales)-Number(a.monthlySales)).map((o,i)=>{
                        const rs=rsr(o.monthlyRental,o.monthlySales)
                        const spsf=o.sqft?(Number(o.monthlySales)/Number(o.sqft)).toFixed(0):null
                        return(
                          <tr key={o.id} style={{background:i%2===0?'#fff':'#FAFBFD'}}>
                            <td style={{...TD,color:C.sub,fontWeight:700}}>#{i+1}</td>
                            <td style={{...TD,fontFamily:'monospace',color:C.accent,fontWeight:700}}>{o.outletCode}</td>
                            <td style={TD}><span style={{color:BRAND_COLOR[o.brand],fontWeight:700,fontSize:13}}>{o.brand}</span></td>
                            <td style={{...TD,fontWeight:600}}>{o.outletName}</td>
                            <td style={{...TD,color:C.sub}}>{o.state}</td>
                            <td style={{...TD,color:C.sub}}>{o.sqft||'—'}</td>
                            <td style={{...TD,color:C.green,fontWeight:700}}>RM {Number(o.monthlySales).toLocaleString()}</td>
                            <td style={TD}>RM {Number(o.monthlyRental).toLocaleString()}</td>
                            <td style={{...TD,color:C.sub}}>{fRM(o.serviceCharge)}</td>
                            <td style={{...TD,color:C.sub}}>{fRM(o.apFees)}</td>
                            <td style={TD}><RSB ratio={rs}/></td>
                            <td style={{...TD,color:C.sub}}>{spsf?'RM '+spsf:'—'}</td>
                            <td style={{...TD,color:C.sub}}>{o.atv?'RM '+o.atv:'—'}</td>
                            <td style={{...TD,color:C.sub}}>{fRM(o.gto)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─ IMPORT ─ */}
          {view==='import'&&(
            <ImportView isLive={isLive} showToast={toast$} onImported={rows=>{setOutlets(p=>[...p,...rows]); toast$(rows.length+' outlets imported'); setView('outlets')}}/>
          )}

        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editing&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div style={{background:'#fff',borderRadius:16,width:820,maxHeight:'92vh',overflowY:'auto',padding:28,boxShadow:'0 8px 40px rgba(0,0,0,0.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:C.text}}>{editing.id?'Edit Outlet':'New Outlet'}</div>
                {editing.outletCode&&<div style={{fontSize:14,color:C.accent,marginTop:3,fontWeight:600}}>{editing.outletCode} · {editing.brand}</div>}
              </div>
              <button onClick={()=>setEditing(null)} style={{background:'none',border:'none',color:C.sub,fontSize:22,cursor:'pointer'}}>✕</button>
            </div>
            <OutletForm initial={editing} onSave={save} onCancel={()=>setEditing(null)} saving={saving}/>
          </div>
        </div>
      )}
    </div>
  )
}
