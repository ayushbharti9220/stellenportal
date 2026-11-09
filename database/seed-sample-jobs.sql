-- 14 jobs for testing search, filters and Load More (6 per page).
-- Run in Supabase > SQL Editor. Safe to run twice: duplicates are skipped.
-- Values for employment_type: Internship, Full-time, Part-time, Contract.
INSERT INTO public.jobs
  (job_title, company_name, location, description, salary, experience, employment_type, source_name, source_job_id, source_url, apply_url, is_active)
VALUES
('Full Stack Development Intern','Neuralbits Technologies Private Limited','Mumbai, Maharashtra',
'Responsibilities:
- Develop responsive pages using HTML5, CSS3 and JavaScript.
- Build UI using React.
- Work with PHP or Node.js for server-side development.
- Work with SQL and MySQL databases.
- Write Python scripts and perform data processing.
- Test applications and fix bugs.
- Participate in code reviews and documentation.

Skills: Bootstrap, CSS3, HTML5, JavaScript, MySQL, Node.js, PHP, Python, React, SQL, Tailwind CSS.

Internship details:
Duration: 3 months.
Start: Immediately.
Work arrangement: Full-time, in-office.
Application deadline: 3 December 2026.
Openings: 9.
PPO opportunity: 2.4-3 LPA, subject to performance and company requirements.

Perks: Certificate, recommendation letter, flexible hours, free snacks and beverages, potential job opportunity.',
'8000-10000 INR/month','Relevant skills and interests; specific prior experience requirement not stated.','Internship','Internshala','1793705365',
'https://internshala.com/internship/detail/full-stack-development-internship-in-mumbai-at-neuralbits-technologies-private-limited1793705365',
'https://internshala.com/internship/detail/full-stack-development-internship-in-mumbai-at-neuralbits-technologies-private-limited1793705365',TRUE),

('Frontend Developer','Pixelwave Studios','Bengaluru, Karnataka','Build accessible interfaces with React and Tailwind CSS.
Skills: React, JavaScript, Tailwind CSS, Git.','4-6 LPA','0-2 years','Full-time','LinkedIn','sample-002','https://www.linkedin.com/jobs/','https://www.linkedin.com/jobs/',TRUE),
('Python Developer Intern','DataNest Analytics','Remote','Write Python scripts to clean and analyse data.
Skills: Python, SQL, pandas.
Duration: 2 months.','10000 INR/month','Freshers welcome','Internship','Internshala','sample-003','https://internshala.com/','https://internshala.com/',TRUE),
('Backend Engineer (Node.js)','CloudKart','Hyderabad, Telangana','Build REST APIs for an e-commerce platform.
Skills: Node.js, Express, PostgreSQL, Docker.','7-10 LPA','2-4 years','Full-time','Indeed','sample-004','https://in.indeed.com/','https://in.indeed.com/',TRUE),
('UI/UX Design Intern','Craftline Design','Delhi, NCR','Create wireframes and prototypes.
Skills: Figma, UI design, HTML, CSS.','6000-8000 INR/month','Portfolio required','Internship','Internshala','sample-005','https://internshala.com/','https://internshala.com/',TRUE),
('Junior Data Analyst','Insightly Consulting','Pune, Maharashtra','Analyse business data and build dashboards.
Skills: SQL, Excel, Power BI, Python.','3.5-5 LPA','0-1 year','Full-time','Naukri','sample-006','https://www.naukri.com/','https://www.naukri.com/',TRUE),
('Content Writer','Wordsmith Media','Remote','Write blog posts for tech clients, about 20 hours per week.
Skills: Writing, SEO basics.','12000-15000 INR/month','Writing samples required','Part-time','Indeed','sample-007','https://in.indeed.com/','https://in.indeed.com/',TRUE),
('Web Development Intern','BrightPath Solutions','Delhi, NCR','Build pages for client websites.
Skills: HTML, CSS, JavaScript.
Duration: 3 months.','5000-7000 INR/month','Freshers welcome','Internship','Internshala','sample-008','https://internshala.com/','https://internshala.com/',TRUE),
('QA Tester','Testrite Labs','Bengaluru, Karnataka','Test web applications for a 6-month project.
Skills: Manual testing, Jira, SQL.','25000 INR/month','1-2 years','Contract','LinkedIn','sample-009','https://www.linkedin.com/jobs/','https://www.linkedin.com/jobs/',TRUE),
('React Developer','Appforge Labs','Remote','Build dashboards for SaaS customers.
Skills: React, TypeScript, REST APIs.','6-9 LPA','1-3 years','Full-time','LinkedIn','sample-010','https://www.linkedin.com/jobs/','https://www.linkedin.com/jobs/',TRUE),
('Digital Marketing Intern','GrowthLoop','Mumbai, Maharashtra','Help run social media and email campaigns.
Skills: SEO, social media, Canva.','7000 INR/month','Freshers welcome','Internship','Internshala','sample-011','https://internshala.com/','https://internshala.com/',TRUE),
('Java Developer','Finserve Technologies','Pune, Maharashtra','Maintain banking APIs.
Skills: Java, Spring Boot, MySQL.','5-8 LPA','1-3 years','Full-time','Naukri','sample-012','https://www.naukri.com/','https://www.naukri.com/',TRUE),
('Graphic Designer','Craftline Design','Delhi, NCR','Design social posts and brand material, 25 hours per week.
Skills: Photoshop, Illustrator.','15000 INR/month','Portfolio required','Part-time','Indeed','sample-013','https://in.indeed.com/','https://in.indeed.com/',TRUE),
('Machine Learning Intern','DataNest Analytics','Bengaluru, Karnataka','Train and test simple models.
Skills: Python, scikit-learn, pandas.
Duration: 4 months.','12000 INR/month','Basic ML knowledge','Internship','Internshala','sample-014','https://internshala.com/','https://internshala.com/',TRUE)
ON CONFLICT (source_name, source_job_id) DO NOTHING;

-- Make sure your first job uses a clean type (matches the filter buttons):
UPDATE public.jobs SET employment_type = 'Internship' WHERE source_job_id = '1793705365';
