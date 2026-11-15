// Test-only local adapters. Never import this module from the application entry point.
const { createServer } = require('node:http');
const { randomBytes, randomUUID } = require('node:crypto');
const database = process.env.TEST_DATABASE_URL;
if (!database || process.env.ALLOW_TEST_DATABASE_RESET !== '1') throw new Error('Browser tests require an explicitly disposable TEST_DATABASE_URL');
const target = new URL(database);
if (!['localhost','127.0.0.1','[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Refusing to reset a non-local or non-test database');
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: database, JWT_SECRET: randomBytes(48).toString('hex'), OPENAI_ROUTER_KEY: 'local-test-provider-value', AUTH_RATE_LIMIT:'1000', API_RATE_LIMIT:'1000', DOCUMENT_RATE_LIMIT:'1000' });
delete process.env.TWOFACTOR_API_KEY;
const mail = new Map(); let providerMode = 'ok';
const emailPath = require.resolve('../../backend/services/emailService');
require.cache[emailPath] = { id:emailPath, filename:emailPath, loaded:true, exports:{ sendEmail:async (email, code)=>{mail.set(email,code);return{success:true};} } };
const sms=require('../../backend/services/otpService');
sms.sendOTP=async()=>({success:true,sessionId:randomUUID()});
sms.verifyOTP=async(sessionId, code)=>({success:code==='654321'});
const pool=require('../../backend/config/database');
const fixture = {
 summary:'Test fixture: this service agreement contains a 30-day payment obligation and a termination provision.', documentType:'service agreement',
 clauses:[{title:'Payment terms',originalText:'Payment is due in 30 days.',explanation:'The payment period is 30 days.',riskLevel:'low',importance:'high',keyTerms:['30 days'],riskAssessment:'The test excerpt states the payment period.',legalImplications:'Review the actual agreement with counsel.'}],
 redFlags:[],keyDates:[],overallRiskLevel:'low',recommendations:['Confirm the invoice date.'],missingClauses:[],favorability:{forParty1:'unknown',forParty2:'unknown',explanation:'The test excerpt is insufficient to assess overall favorability.'},
};
let api, provider;
function listen(server, port){return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));}
(async()=>{
 await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
 await require('../../backend/database/init').initializeDatabase();
 provider=await listen(createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');res.setHeader('Content-Type','application/json');
  if(url.pathname==='/test/otp'){res.end(JSON.stringify({code:mail.get(url.searchParams.get('email'))}));return;}
  let text='';for await(const chunk of req)text+=chunk;
  if(url.pathname==='/test/provider-mode'){providerMode=JSON.parse(text).mode;res.end('{}');return;}
  if(providerMode==='error'){res.statusCode=503;res.end('{}');return;}
  const prompt=JSON.parse(text).messages.at(-1).content;
  res.end(JSON.stringify({choices:[{message:{content:prompt.startsWith('Analyze the complete document')?JSON.stringify(fixture):prompt.includes('Payment is due in 30 days.')?'Test-only answer: the document states a 30-day payment period.':'Test-only answer: insufficient document context.'}}]}));
 }),Number(process.env.TEST_PROVIDER_PORT||5051));
 process.env.OPENROUTER_BASE_URL=`http://127.0.0.1:${provider.address().port}/v1`;
 api=await listen(require('../../backend/app').createApp(),Number(process.env.TEST_API_PORT||5050));
 console.log('Local browser-test API and isolated provider adapters are ready');
})().catch(()=>{console.error('Browser-test server setup failed');process.exitCode=1;pool.end();});
async function shutdown(){if(api)api.close();if(provider)provider.close();await pool.end();process.exit(0);}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
