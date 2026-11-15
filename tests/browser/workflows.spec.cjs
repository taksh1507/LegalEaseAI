const {test,expect}=require('@playwright/test');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs/promises');
const password='Browser-test-password1!';
async function navigation(page,name){
 const target=page.getByRole('navigation').getByRole('button',{name,exact:true});
 if(!(await target.isVisible()))await page.getByRole('button',{name:'Toggle navigation'}).click();
 await target.click();
}
async function signup(page,request){
 const email=`browser-${randomUUID()}@example.test`;
 await navigation(page,'Sign Up');
 const dialog=page.getByRole('dialog',{name:'Authentication'});
 await dialog.getByRole('textbox',{name:'Full Name',exact:true}).fill('Browser Test Reviewer');
 await dialog.getByRole('textbox',{name:'Email or Phone Number'}).fill(email);
 await dialog.getByLabel('Password',{exact:true}).fill(password);
 await dialog.getByRole('button',{name:'Send OTP',exact:true}).click();
 await expect(dialog.getByRole('heading',{name:'Verify OTP'})).toBeVisible();
 const code=(await(await request.get('http://127.0.0.1:5051/test/otp?email='+encodeURIComponent(email))).json()).code;
 expect(code).toMatch(/^\d{6}$/);
 await dialog.getByRole('textbox',{name:'Verification code'}).fill(code);
 await dialog.getByRole('button',{name:/Verify.*Create|Verify.*OTP|Verify.*Register/i}).click();
 await expect(dialog).toBeHidden();
 return email;
}
test('signup, review, saved history, chat, PDF export and logout work together',async({page,request},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Read the fine print/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.screenshot({path:testInfo.outputPath('workspace.png'),fullPage:true});
 await signup(page,request);
 await page.getByRole('button',{name:'Paste Text',exact:true}).click();
 await page.getByRole('textbox',{name:'Legal document text'}).fill('Service agreement for this browser test. Payment is due in 30 days. Either party may terminate with written notice.');
 await page.getByRole('button',{name:'Simplify Document',exact:true}).click();
 await expect(page.getByRole('heading',{name:/Document Analysis:/})).toBeVisible();
 await page.getByRole('button',{name:/Payment terms/}).click();
 await expect(page.getByText('The payment period is 30 days.').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:testInfo.outputPath('review.png'),fullPage:true});
 await navigation(page,'History');
 await expect(page.getByRole('heading',{name:'Analysis history'})).toBeVisible();
 await expect(page.getByRole('cell',{name:'Text analysis',exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Review',exact:true}).click();
 await page.getByRole('button',{name:'Open document chat'}).click();
 await page.getByRole('textbox',{name:'Message to legal assistant'}).fill('When is payment due?');
 await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.getByText('Test-only answer: the document states a 30-day payment period.')).toBeVisible();
 await page.getByRole('button',{name:'Close document chat'}).click();
 const summaryDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download Summary',exact:true}).click();
 expect(await fs.readFile(await(await summaryDownload).path(),'utf8')).toContain('30-day payment obligation');
 await page.getByRole('button',{name:/Export.*PDF|Export Report|Download Report|Generate PDF/i}).first().click();
 const preview=page.getByRole('dialog',{name:'Report preview'});await expect(preview).toBeVisible();
 const downloadPromise=page.waitForEvent('download');
 await preview.getByRole('button',{name:/Export PDF|Download PDF|Generate PDF/i}).click();
 const download=await downloadPromise;
 const file=await download.path();expect((await fs.readFile(file)).subarray(0,5).toString()).toBe('%PDF-');
 if(testInfo.project.name==='desktop'){
   for(const format of ['simple','html','server']){
     await page.getByRole('button',{name:/Export.*PDF|Export Report|Download Report|Generate PDF/i}).first().click();
     const modal=page.getByRole('dialog',{name:'Report preview'});
     if(format==='server')await modal.getByText('Server Generation',{exact:true}).click();
     else await modal.locator(`input[type="radio"][value="${format}"]`).check();
     const downloading=page.waitForEvent('download');await modal.getByRole('button',{name:'Export PDF',exact:true}).click();
     expect((await fs.readFile(await(await downloading).path())).subarray(0,5).toString()).toBe('%PDF-');
   }
 }
 await navigation(page,'Profile');
 await page.getByRole('dialog',{name:'Your profile'}).getByRole('button',{name:/Sign Out|Log Out|Logout/i}).click();
 await expect(page.getByRole('heading',{name:/Read the fine print/})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('sign-in mode, keyboard dismissal, theme persistence and support navigation are usable',async({page})=>{
 await page.goto('/');await navigation(page,'Sign In');
 const dialog=page.getByRole('dialog',{name:'Authentication'});await expect(dialog.getByRole('heading',{name:'Sign In',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 const toggle=page.getByRole('button',{name:'Switch to dark theme'}).first();
 if(!(await toggle.isVisible()))await page.getByRole('button',{name:'Toggle navigation'}).click();
 await page.getByRole('button',{name:'Switch to dark theme'}).first().click();
 await expect(page.locator('html')).toHaveClass(/dark/);await page.reload();await expect(page.locator('html')).toHaveClass(/dark/);
 await page.getByRole('button',{name:'Privacy Policy',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Information'})).toContainText('configured AI provider');await page.keyboard.press('Escape');
});
