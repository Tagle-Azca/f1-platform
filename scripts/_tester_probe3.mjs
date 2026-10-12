import { chromium } from '@playwright/test'
const S='/Users/tagle/Documents/pitwall/.agentteam/scratch/tester/'
const b = await chromium.launch({ channel:'chrome' })
const ctx=await b.newContext({viewport:{width:375,height:812},colorScheme:'dark'}); const p=await ctx.newPage()
for (const [n,u] of [['429-hub','/encyclopedia'],['429-driver','/drivers/norris'],['429-ctor','/constructors/mclaren']]) {
 await p.goto('http://localhost:5173'+u); await p.waitForTimeout(4000)
 console.log(n, JSON.stringify((await p.evaluate(()=>document.querySelector('main').innerText)).slice(0,300)), await p.evaluate(()=>document.documentElement.scrollWidth))
 await p.screenshot({path:S+n+'.png'})
}
await b.close()
