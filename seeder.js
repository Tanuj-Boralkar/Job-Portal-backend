const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");

dotenv.config({ path: require("path").join(__dirname, ".env") });

const users = [
  { name: "Portal Admin", email: "admin@jobportal.com", password: "admin123", role: "admin", phone: "9000000001" },
  {
    name: "Riya Sharma",
    email: "recruiter@jobportal.com",
    password: "recruiter123",
    role: "recruiter",
    phone: "9000000002",
    companyName: "Nimbus Technologies",
    companyDescription: "A product company building developer tools for Indian startups.",
    location: "Pune, Maharashtra",
  },
  {
    name: "Arjun Patil",
    email: "candidate@jobportal.com",
    password: "candidate123",
    role: "candidate",
    phone: "9000000003",
    skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
    experience: "1 year as a MERN stack intern",
    education: "B.E. Computer Engineering, SPPU",
    location: "Pune, Maharashtra",
  },
];

const jobTemplates = [
  { title: "MERN Stack Developer", category: "Software Development", location: "Pune, Maharashtra", jobType: "Full Time", workMode: "Hybrid", salary: "4 - 7 LPA", experienceLevel: "0-1 Years", skills: ["React", "Node.js", "MongoDB", "Express"], vacancies: 3 },
  { title: "Frontend Developer (React)", category: "Software Development", location: "Bengaluru, Karnataka", jobType: "Full Time", workMode: "Remote", salary: "6 - 10 LPA", experienceLevel: "1-3 Years", skills: ["React", "Redux", "Bootstrap", "REST API"], vacancies: 2 },
  { title: "Backend Developer (Node.js)", category: "Software Development", location: "Hyderabad, Telangana", jobType: "Full Time", workMode: "On-site", salary: "7 - 12 LPA", experienceLevel: "3-5 Years", skills: ["Node.js", "Express", "MongoDB", "Docker"], vacancies: 1 },
  { title: "UI/UX Design Intern", category: "Design", location: "Mumbai, Maharashtra", jobType: "Internship", workMode: "Hybrid", salary: "15,000/month", experienceLevel: "Fresher", skills: ["Figma", "Wireframing", "Prototyping"], vacancies: 4 },
  { title: "Data Analyst", category: "Data Science", location: "Pune, Maharashtra", jobType: "Full Time", workMode: "On-site", salary: "5 - 9 LPA", experienceLevel: "1-3 Years", skills: ["SQL", "Python", "Power BI", "Excel"], vacancies: 2 },
  { title: "QA Automation Engineer", category: "Quality Assurance", location: "Chennai, Tamil Nadu", jobType: "Contract", workMode: "Remote", salary: "6 - 8 LPA", experienceLevel: "1-3 Years", skills: ["Selenium", "Java", "TestNG", "Jenkins"], vacancies: 2 },
  { title: "DevOps Engineer", category: "Cloud & DevOps", location: "Noida, Uttar Pradesh", jobType: "Full Time", workMode: "Hybrid", salary: "10 - 16 LPA", experienceLevel: "3-5 Years", skills: ["AWS", "Kubernetes", "Terraform", "CI/CD"], vacancies: 1 },
  { title: "Digital Marketing Executive", category: "Marketing", location: "Delhi", jobType: "Full Time", workMode: "On-site", salary: "3 - 5 LPA", experienceLevel: "0-1 Years", skills: ["SEO", "Google Ads", "Content Writing"], vacancies: 3 },
  { title: "Technical Content Writer", category: "Content", location: "Remote", jobType: "Freelance", workMode: "Remote", salary: "2 - 4 per article", experienceLevel: "0-1 Years", skills: ["Writing", "SEO", "Developer Tools"], vacancies: 5 },
  { title: "Android Developer (Kotlin)", category: "Mobile Development", location: "Ahmedabad, Gujarat", jobType: "Part Time", workMode: "Hybrid", salary: "4 - 6 LPA", experienceLevel: "1-3 Years", skills: ["Kotlin", "Android SDK", "Firebase"], vacancies: 1 },
  { title: "HR Executive", category: "Human Resources", location: "Pune, Maharashtra", jobType: "Full Time", workMode: "On-site", salary: "3 - 5 LPA", experienceLevel: "0-1 Years", skills: ["Recruitment", "Onboarding", "Communication"], vacancies: 2 },
  { title: "Machine Learning Intern", category: "Data Science", location: "Bengaluru, Karnataka", jobType: "Internship", workMode: "Remote", salary: "25,000/month", experienceLevel: "Fresher", skills: ["Python", "Pandas", "scikit-learn"], vacancies: 3 },
];

const importData = async () => {
  await connectDB();

  const occupied = await Promise.all([User.exists({}), Job.exists({}), Application.exists({})]);
  if (occupied.some(Boolean)) throw new Error("Seed requires an empty database. Your existing data has not been changed. Use a separate database for demo data.");

  // create() runs the pre-save hook so passwords get hashed
  const created = await User.create(users);
  const recruiter = created.find((u) => u.role === "recruiter");

  const jobs = jobTemplates.map((job, index) => ({
    ...job,
    company: recruiter.companyName,
    recruiter: recruiter._id,
    description: `We are hiring a ${job.title} to join our team in ${job.location}. You will work closely with product and engineering to ship features end to end, write maintainable code, review pull requests and take ownership of the modules you build.\n\nWhat you will do:\n- Build and maintain production features\n- Collaborate in an agile team\n- Write tests and documentation\n\nWhat we look for:\n- Strong fundamentals in ${job.skills.slice(0, 2).join(" and ")}\n- Willingness to learn and clear communication`,
    deadline: new Date(Date.now() + (20 + index) * 24 * 60 * 60 * 1000),
    status: index === 11 ? "closed" : "active",
  }));

  await Job.insertMany(jobs);

  console.log("Seed data imported.");
  console.log("Admin      -> admin@jobportal.com / admin123");
  console.log("Recruiter  -> recruiter@jobportal.com / recruiter123");
  console.log("Candidate  -> candidate@jobportal.com / candidate123");
  process.exit(0);
};

const destroyData = async () => {
  if (!process.argv.includes("--confirm-delete-all")) throw new Error("To delete all portal data, add --confirm-delete-all explicitly.");
  await connectDB();
  await Application.deleteMany();
  await Job.deleteMany();
  await User.deleteMany();
  console.log("All data removed.");
  process.exit(0);
};

if (process.argv.includes("--destroy")) {
  destroyData().catch((error) => { console.error(error.message); process.exit(1); });
} else {
  importData().catch((error) => { console.error(error.message); process.exit(1); });
}