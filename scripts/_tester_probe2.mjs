import { chromium } from '@playwright/test'
const S='/Users/tagle/Documents/pitwall/.agentteam/scratch/tester/'
const b = await chromium.launch({ channel:'chrome' })
const L=(...a)=>console.log(...a)
async function mk(w=375, opts={}){const ctx=await b.newContext({viewport:{width:w,height:812},colorScheme:'dark',...opts});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));return p}
// h1 DOM + race pace
let p=await mk()
await p.goto('http://localhost:5173/drivers/norris'); await p.waitForTimeout(3000)
L('h1 html', await p.$eval('h1',e=>e.innerHTML.slice(0,300)), '| acc text', await p.$eval('h1',e=>e.innerText))
await p.goto('http://localhost:5173/constructors/mclaren'); await p.waitForTimeout(2000)
await p.evaluate(()=>window.scrollTo(0,1400)); await p.waitForTimeout(3000)
await p.screenshot({path:S+'ctor-pace-375.png'})
L('pace section text', (await p.evaluate(()=>document.querySelector('#cp-pace')?.parentElement?.innerText||document.body.innerText.match(/Race pace[\s\S]{0,300}/)?.[0])))
// long name search, a long query
p=await mk()
await p.goto('http://localhost:5173/encyclopedia'); await p.waitForTimeout(2500)
const inp=p.locator('#enc-search'); await inp.click(); await inp.fill('ver'); await p.waitForTimeout(1200)
L('options', await p.getByRole('option').allInnerTexts())
await p.screenshot({path:S+'search-375.png'})
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown')
L('activedesc', await inp.getAttribute('aria-activedescendant'), await inp.getAttribute('aria-expanded'))
await p.keyboard.press('Escape'); L('after esc expanded', await inp.getAttribute('aria-expanded'), 'val', await inp.inputValue())
await inp.fill('ver'); await p.waitForTimeout(1000); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500); L('enter ->', p.url())
await p.goBack(); await p.waitForTimeout(1500); L('back ->', p.url())
for (const q of ['<script>alert(1)</script>','a'.repeat(500),'日本']) { await p.goto('http://localhost:5173/encyclopedia'); await p.waitForTimeout(1200); const i=p.locator('#enc-search'); await i.fill(q); await p.waitForTimeout(1200); L('q',JSON.stringify(q.slice(0,12)), (await p.getByRole('option').count()), (await p.locator('[role=status],[aria-live]').allInnerTexts()).join('|').slice(0,80), 'sw',await p.evaluate(()=>document.documentElement.scrollWidth), p.errs.join()) }
// slash key
await p.goto('http://localhost:5173/encyclopedia'); await p.waitForTimeout(1500); await p.locator('body').click({position:{x:5,y:300}}); await p.keyboard.press('/'); L('slash focus', await p.evaluate(()=>document.activeElement?.getAttribute('role')))
// back/forward tabs/season
await p.goto('http://localhost:5173/encyclopedia'); await p.waitForTimeout(2000)
await p.getByRole('tab',{name:'Constructors'}).or(p.getByRole('radio',{name:'Constructors'})).first().click(); await p.waitForTimeout(800)
L('tab url', p.url()); await p.goBack(); await p.waitForTimeout(800); L('back', p.url()); await p.goForward(); await p.waitForTimeout(800); L('fwd', p.url()); await p.reload(); await p.waitForTimeout(2000); L('reload', p.url(), await p.locator('[data-hub-grid]').getAttribute('data-hub-grid'))
// keyboard tab order on the hub
await p.goto('http://localhost:5173/encyclopedia'); await p.waitForTimeout(2000)
const seq=[]; for(let i=0;i<14;i++){await p.keyboard.press('Tab'); seq.push(await p.evaluate(()=>{const e=document.activeElement;const cs=getComputedStyle(e);return (e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,22)+(cs.outlineStyle==='none'&&cs.boxShadow==='none'?' [NO RING]':'')}))}
L('tab seq',seq)
// reduced motion
const r=await mk(375,{reducedMotion:'reduce'})
for(const u of ['/encyclopedia','/drivers/norris','/constructors/mclaren']){await r.goto('http://localhost:5173'+u); await r.waitForTimeout(2500); L('RM',u, await r.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations===Infinity||false).map(a=>a.animationName||a.constructor.name).slice(0,5)), await r.evaluate(()=>document.getAnimations().length))}
// team colour as text: scan text elements whose color equals a team colour
const t=await mk(1440)
for(const u of ['/encyclopedia','/drivers/norris','/constructors/mclaren','/constructors/ferrari','/constructors/red_bull','/drivers/hamilton']){await t.goto('http://localhost:5173'+u); await t.waitForTimeout(3000)
 L('COLOR',u, JSON.stringify(await t.evaluate(()=>{const m={};for(const e of document.querySelectorAll('main *')){if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const c=getComputedStyle(e).color;m[c]=(m[c]||0)+1}return m})))}
await b.close()
