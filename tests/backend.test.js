const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
process.env.NODE_ENV = 'production';
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const jobs = require('../controllers/jobController');
const applications = require('../controllers/applicationController');
const admin = require('../controllers/adminController');
const auth = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
afterEach(() => mock.restoreAll());
const query = (data) => {
  const q = { then: (resolve, reject) => Promise.resolve(data).then(resolve, reject) };
  for (const key of ['populate', 'sort', 'skip', 'limit', 'lean', 'select']) q[key] = () => q;
  return q;
};
async function invoke(fn, req = {}) {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await fn({ body: {}, params: {}, query: {}, user: { _id: 'owner', role: 'recruiter' }, ...req }, res, (err) => { if (err) throw err; });
  return res;
}
test('job schema uses recruiter and experienceLevel', async () => {
  const job = new Job({ title: 'Developer', description: 'Build APIs', company: 'Example', location: 'Pune', recruiter: new User()._id, experienceLevel: '5+ Years' });
  await job.validate();
  assert.equal(job.experienceLevel, '5+ Years');
});
test('job create maps request fields and owner', async () => {
  mock.method(Job, 'create', async (data) => data);
  const r = await invoke(jobs.createJob, { body: { title:'Dev',description:'APIs',company:'Example',location:'Pune',jobType:'Internship',experienceLevel:'Fresher',skills:'React, Node' } });
  assert.equal(r.statusCode,201); assert.equal(r.body.data.recruiter,'owner'); assert.equal(r.body.data.jobType,'Internship');
});
test('job listing has independent page and pages values', async () => {
  mock.method(Job, 'find', () => query([])); mock.method(Job,'countDocuments',async()=>31);
  const r=await invoke(jobs.getJobs,{query:{page:'2',limit:'10',keyword:'C++ ['}});
  assert.equal(r.body.data.page,2); assert.equal(r.body.data.pages,4);
});
test('recruiter jobs and stats do not reference undefined variables', async () => {
  mock.method(Job,'find',()=>query([])); mock.method(Job,'countDocuments',async()=>0);
  mock.method(Application,'aggregate',async()=>[]); mock.method(Application,'find',()=>query([])); mock.method(Application,'countDocuments',async()=>0);
  assert.deepEqual((await invoke(jobs.getMyJobs)).body.data,[]);
  assert.equal((await invoke(jobs.getRecruiterStats)).body.data.stats.totalApplications,0);
});
test('job update permits owner and rejects another recruiter',async()=>{
  const job={recruiter:'owner',save:async function(){return this;}};
  mock.method(Job,'findById',()=>query(job));
  assert.equal((await invoke(jobs.updateJob,{body:{description:'Updated'}})).body.data.description,'Updated');
  assert.equal((await invoke(jobs.updateJob,{user:{_id:'other',role:'recruiter'}})).statusCode,403);
  assert.equal((await invoke(jobs.updateJobStatus,{body:{status:'active'}})).statusCode,200);
});
test('application submission returns created application; expired deadline rejects',async()=>{
  const job={_id:'job',recruiter:'owner',status:'active',deadline:new Date(Date.now()+60000)};
  mock.method(Job,'findById',()=>query(job)); mock.method(Application,'findOne',async()=>null); mock.method(Application,'create',async data=>data);
  const req={user:{_id:'candidate',resume:'/uploads/resumes/cv.pdf'}};
  assert.equal((await invoke(applications.applyToJob,req)).body.data.candidate,'candidate');
  job.deadline=new Date(0); assert.equal((await invoke(applications.applyToJob,req)).statusCode,400);
});
test('applicant list returns applications and missing withdrawal returns 404',async()=>{
  mock.method(Job,'findById',()=>query({_id:'job',recruiter:'owner'})); mock.method(Application,'find',()=>query([]));
  assert.deepEqual((await invoke(applications.getApplicationsForJob)).body.data.applications,[]);
  mock.method(Application,'findById',async()=>null);
  assert.equal((await invoke(applications.withdrawApplication)).statusCode,404);
});
test('admin user list uses the defined users variable',async()=>{
  mock.method(User,'find',()=>query([])); assert.deepEqual((await invoke(admin.getUsers)).body.data,[]);
});
test('blocked user with valid token cannot access protected routes',async()=>{
  process.env.JWT_SECRET='test-only-secret';
  mock.method(User,'findById',async()=>({isBlocked:true}));
  const token=jwt.sign({id:'user'},process.env.JWT_SECRET);
  assert.equal((await invoke(protect,{headers:{authorization:`Bearer ${token}`}})).statusCode,403);
});
test('admin setup returns token separately from message',async()=>{
  process.env.ADMIN_SETUP_KEY='test-key'; process.env.JWT_SECRET='test-only-secret';
  mock.method(User,'findOne',async()=>null); mock.method(User,'create',async data=>({...data,_id:'admin'}));
  const r=await invoke(auth.setupAdmin,{body:{name:'Admin',email:'admin@example.com',password:'test123',setupKey:'test-key'}});
  assert.equal(typeof r.body.token,'string'); assert.equal(r.statusCode,201);
});
test('password save hook hashes and comparison works without MongoDB',async()=>{
  const user=new User({name:'Test',email:'test@example.com',password:'test123'});
  await user.validate();
  await User.schema.s.hooks.execPre('save',user,[]);
  assert.notEqual(user.password,'test123'); assert.equal(await user.matchPassword('test123'),true);
  assert.equal(await user.matchPassword('wrong'),false); assert.equal(user.toJSON().password,undefined);
});
test('all routes load; HTTP health, missing token and 404 work',async()=>{
  const { app }=require('../server');
  const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    for(const [path,status] of [['/api/v1/health',200],['/api/v1/users/profile',401],['/missing',404]]) {
      const response=await fetch(base+path); assert.equal(response.status,status); assert.equal(typeof (await response.json()).success,'boolean');
    }
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('job edit clears optional salary and deadline rather than retaining old values', async () => {
  const job = { recruiter: 'owner', salary: 'Old salary', deadline: new Date(), save: async function () { return this; } };
  mock.method(Job, 'findById', () => query(job));
  const r = await invoke(jobs.updateJob, { body: { salary: '', deadline: '' } });
  assert.equal(r.body.data.salary, '');
  assert.equal(r.body.data.deadline, undefined);
});
test('login returns saved resume and company for immediate use without refreshing', async () => {
  mock.method(User, 'findOne', () => query({ _id: 'candidate', name: 'Test', role: 'candidate', resume: '/uploads/resumes/saved.pdf', companyName: 'Example', matchPassword: async () => true }));
  process.env.JWT_SECRET = 'test-only-secret';
  const r = await invoke(auth.login, { body: { email: 'test@example.com', password: 'test123' } });
  assert.equal(r.body.user.resume, '/uploads/resumes/saved.pdf');
  assert.equal(r.body.user.companyName, 'Example');
});
