import { chromium } from '@playwright/test'
const S='/Users/tagle/Documents/pitwall/.agentteam/scratch/tester/'
const b = await chromium.launch({ channel:'chrome' })
const out=[]
async function run(name, w, url, fn, opts={}) {
  const ctx = await b.newContext({ viewport:{width:w,height:w<500?812:900}, colorScheme:'dark', ...opts })
  const page = await ctx.newPage()
  const errs=[]; page.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,160)) }); page.on('pageerror',e=>errs.push('PAGEERR '+e.message))
  const reqs=[]; page.on('request',r=>{const u=new URL(r.url()); if(!['localhost'].includes(u.hostname)) reqs.push(u.host)})
  await page.goto('http://localhost:5173'+url,{waitUntil:'load'}).catch(e=>errs.push('goto '+e.message))
  await page.waitForTimeout(3500)
  if (fn) await fn(page)
  const m = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, h1:document.querySelector('h1')?.textContent, url:location.pathname+location.search, small:[...document.querySelectorAll('main a, main button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<44||r.width<44)&&!(e.tagName==='A'&&e.closest('p'))}).slice(0,8).map(e=>(e.getAttribute('aria-label')||e.textContent).trim().slice(0,25)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))}))
  await page.screenshot({path:S+name+'.png',fullPage:true})
  out.push({name,...m,errs,third:[...new Set(reqs)]})
  await ctx.close()
}
for (const w of [375,768,1440]) {
  await run('hub-'+w,w,'/encyclopedia')
  await run('hub-ctor-'+w,w,'/encyclopedia?view=constructors&season=2023')
  await run('hub-circ-'+w,w,'/encyclopedia?view=circuits&season=2025')
  await run('driver-'+w,w,'/drivers/norris')
  await run('ctor-'+w,w,'/constructors/mclaren')
}
for (const s of [2022,2023,2024,2025,2026]) await run('hub-s'+s,375,'/encyclopedia?season='+s)
for (const u of ['/encyclopedia?view=%3Cscript%3E&season=abc','/encyclopedia?season=1950','/encyclopedia?season=2099','/encyclopedia?view=drivers&view=circuits&season=2024&season=2023','/encyclopedia?season=-1','/encyclopedia?season=2024.5','/encyclopedia?season=%00','/encyclopedia?view=constructors&season=9'.repeat(1)+'9'.repeat(5000).slice(0,20)])
  await run('junk-'+out.length,375,u)
for (const u of ['/drivers/zzzzzz','/constructors/zzzzzz','/drivers/%3Cscript%3E','/constructors/%3Cscript%3E','/drivers/'+'a'.repeat(300),'/constructors/NORRIS','/constructors/red_bull','/constructors/ferrari','/drivers/max_verstappen','/drivers/hamilton','/drivers/bortoleto','/drivers/antonelli','/constructors/alpine','/constructors/sauber','/constructors/audi','/constructors/cadillac','/constructors/alphatauri','/constructors/haas','/drivers/%00','/drivers/..%2f..%2fetc'])
  await run('nf-'+out.length,375,u)
console.log(JSON.stringify(out,null,1))
await b.close()
