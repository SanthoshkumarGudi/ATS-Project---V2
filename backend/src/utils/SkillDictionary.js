/**
 * SKILL DICTIONARY
 * ----------------
 * Each key is the canonical skill name (how it should be stored/displayed).
 * Each value is an array of aliases/variations used for matching.
 *
 * Matching strategy (see skillExtractor.js):
 *   1. Normalize text: lowercase, collapse whitespace, strip most punctuation.
 *   2. For each canonical skill, check if any alias appears as a whole word / phrase
 *      in the normalized resume text.
 *   3. A small set of ambiguous short tokens (e.g. "go", "r", "c") use
 *      anchor patterns to avoid false positives.
 *
 * Maintenance:
 *   - Add new skills as new top-level keys.
 *   - Add new aliases to existing arrays when you encounter a new spelling.
 *   - Aliases are lower-case; the extractor normalizes both sides before comparing.
 */

const SKILL_DICTIONARY = {
  // ─────────────────────────────────────────────
  // PROGRAMMING LANGUAGES
  // ─────────────────────────────────────────────

  JavaScript: [
    "javascript",
    "java script",
    "js",
    "ecmascript",
    "es6",
    "es7",
    "es8",
    "es2015",
    "es2016",
    "es2017",
    "es2018",
    "es2019",
    "es2020",
    "es2021",
    "es2022",
    "vanilla js",
    "vanilla javascript",
  ],

  TypeScript: ["typescript", "type script", "ts"],

  Python: ["python", "python3", "python 3", "python2", "python 2", "py"],

  Java: [
    "java",
    "core java",
    "java se",
    "java ee",
    "j2ee",
    "java 8",
    "java 11",
    "java 17",
    "java 21",
  ],

  C: [
    // Anchor required — matched only when followed by space/punctuation/end,
    // NOT when it is part of another word like "catch". See extractor for anchor logic.
    "c programming",
    "c language",
    "ansi c",
  ],

  "C++": ["c++", "cpp", "c plus plus", "cplusplus"],

  "C#": ["c#", "csharp", "c sharp", "c# .net", "dotnet csharp"],

  Go: [
    // "go" alone is too ambiguous; require context words
    "golang",
    "go language",
    "go programming",
    "go lang",
  ],

  Rust: ["rust", "rust lang", "rust language", "rustlang"],

  Swift: ["swift", "swift ui", "swiftui", "swift language"],

  Kotlin: ["kotlin", "kotlin android", "kotlin jvm"],

  Ruby: ["ruby", "ruby language"],

  PHP: ["php", "php7", "php 7", "php8", "php 8", "hypertext preprocessor"],

  Scala: ["scala", "scala language"],

  R: [
    // Anchor required — only match as a stats/data context word
    "r programming",
    "r language",
    "r studio",
    "rstudio",
    "r statistical",
  ],

  MATLAB: ["matlab", "mat lab"],

  Perl: ["perl", "perl scripting"],

  "Shell Scripting": [
    "shell scripting",
    "shell script",
    "bash scripting",
    "bash script",
    "bash",
    "zsh",
    "ksh",
    "sh scripting",
    "unix shell",
  ],

  PowerShell: ["powershell", "power shell", "ps1", "powershell scripting"],

  Dart: ["dart", "dart language"],

  Elixir: ["elixir", "elixir lang"],

  Haskell: ["haskell"],

  Lua: ["lua", "lua scripting"],

  Groovy: ["groovy", "groovy scripting", "groovy language"],

  Assembly: [
    "assembly",
    "assembly language",
    "asm",
    "x86 assembly",
    "arm assembly",
  ],

  COBOL: ["cobol"],

  Fortran: ["fortran"],

  // ─────────────────────────────────────────────
  // WEB — FRONTEND FRAMEWORKS & LIBRARIES
  // ─────────────────────────────────────────────

  React: [
    "react",
    "reactjs",
    "react js",
    "react.js",
    "react 18",
    "react hooks",
    "react native", // intentionally grouped; split into "React Native" if you need it separate
  ],

  "React Native": ["react native", "react-native", "reactnative"],

  "Next.js": ["next.js", "nextjs", "next js", "next 13", "next 14"],

  Angular: [
    "angular",
    "angularjs",
    "angular js",
    "angular.js",
    "angular 2",
    "angular 12",
    "angular 14",
    "angular 16",
    "angular 17",
    "ng",
  ],

  "Vue.js": [
    "vue",
    "vuejs",
    "vue js",
    "vue.js",
    "vue 3",
    "vue 2",
    "nuxtjs",
    "nuxt.js",
  ],

  Svelte: ["svelte", "sveltekit", "svelte kit"],

  jQuery: ["jquery", "jquery ui", "j query"],

  Redux: [
    "redux",
    "redux toolkit",
    "rtk",
    "redux-saga",
    "redux saga",
    "redux-thunk",
    "redux thunk",
  ],

  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],

  "Material UI": [
    "material ui",
    "materialui",
    "mui",
    "material-ui",
    "@mui",
    "material design",
  ],

  Bootstrap: ["bootstrap", "bootstrap 4", "bootstrap 5", "bootstrap css"],

  "Sass/SCSS": ["sass", "scss", "sass css", "scss css"],

  HTML: ["html", "html5", "html 5", "hypertext markup language"],

  CSS: ["css", "css3", "css 3", "cascading style sheets"],

  WebPack: ["webpack", "web pack"],

  Vite: ["vite", "vite.js", "vitejs"],

  Storybook: ["storybook", "storybook.js"],

  "Three.js": ["three.js", "threejs", "three js", "webgl"],

  "D3.js": ["d3", "d3.js", "d3js", "data driven documents"],

  GraphQL: [
    "graphql",
    "graph ql",
    "apollo graphql",
    "apollo client",
    "apollo server",
  ],

  // ─────────────────────────────────────────────
  // WEB — BACKEND FRAMEWORKS
  // ─────────────────────────────────────────────

  "Node.js": ["node", "node.js", "nodejs", "node js", "node.js server"],

  "Express.js": [
    "express",
    "expressjs",
    "express.js",
    "express js",
    "express framework",
  ],

  NestJS: ["nestjs", "nest.js", "nest js"],

  Django: ["django", "django rest framework", "drf", "django framework"],

  Flask: ["flask", "flask api", "flask framework"],

  FastAPI: ["fastapi", "fast api"],

  "Spring Boot": [
    "spring boot",
    "springboot",
    "spring framework",
    "spring mvc",
    "spring security",
    "spring data",
    "spring cloud",
  ],

  Laravel: ["laravel", "laravel php", "laravel framework"],

  "Ruby on Rails": ["rails", "ruby on rails", "ror", "ruby rails"],

  "ASP.NET Core": [
    "asp.net core",
    "asp net core",
    "aspnet core",
    "asp.net",
    "aspnet",
    "dotnet core",
    ".net core",
    "dot net core",
    ".net 6",
    ".net 7",
    ".net 8",
  ],

  ".NET": [".net", "dotnet", "dot net", "microsoft .net"],

  Gin: ["gin framework", "gin golang", "gin-gonic"],

  Fiber: ["fiber framework", "fiber golang", "gofiber"],

  gRPC: ["grpc", "grpc api", "protocol buffers", "protobuf"],

  // ─────────────────────────────────────────────
  // MOBILE DEVELOPMENT
  // ─────────────────────────────────────────────

  Flutter: ["flutter", "flutter dart", "flutter sdk"],

  "iOS Development": [
    "ios development",
    "ios dev",
    "xcode",
    "uikit",
    "swiftui",
    "objective-c",
    "objective c",
  ],

  "Android Development": [
    "android development",
    "android dev",
    "android studio",
    "android sdk",
    "jetpack compose",
    "compose",
  ],

  Xamarin: ["xamarin", "xamarin forms", "xamarin android", "xamarin ios"],

  Ionic: ["ionic", "ionic framework"],

  // ─────────────────────────────────────────────
  // DATABASES
  // ─────────────────────────────────────────────

  MySQL: ["mysql", "my sql", "mysql database", "mysql server"],

  PostgreSQL: ["postgresql", "postgres", "postgre sql", "pgsql", "pg"],

  MongoDB: ["mongodb", "mongo db", "mongo", "nosql mongodb"],

  Redis: ["redis", "redis cache", "redis db", "redis cluster"],

  SQLite: ["sqlite", "sqlite3", "sqlite database"],

  "Oracle Database": [
    "oracle",
    "oracle db",
    "oracle database",
    "oracle sql",
    "pl/sql",
    "plsql",
  ],

  "Microsoft SQL Server": [
    "sql server",
    "mssql",
    "ms sql",
    "microsoft sql",
    "t-sql",
    "tsql",
    "transact sql",
  ],

  Cassandra: ["cassandra", "apache cassandra", "cassandra db"],

  DynamoDB: ["dynamodb", "dynamo db", "aws dynamodb"],

  Firebase: [
    "firebase",
    "firestore",
    "firebase realtime database",
    "firebase db",
  ],

  Elasticsearch: [
    "elasticsearch",
    "elastic search",
    "elk stack",
    "elastic stack",
  ],

  Neo4j: ["neo4j", "neo4j graph", "graph database"],

  InfluxDB: ["influxdb", "influx db"],

  Supabase: ["supabase"],

  // ─────────────────────────────────────────────
  // SQL / QUERY SKILLS
  // ─────────────────────────────────────────────

  SQL: [
    "sql",
    "structured query language",
    "sql queries",
    "sql query",
    "advanced sql",
    "sql joins",
    "stored procedures",
  ],

  NoSQL: ["nosql", "no sql", "nosql databases"],

  // ─────────────────────────────────────────────
  // CLOUD PLATFORMS
  // ─────────────────────────────────────────────

  AWS: [
    "aws",
    "amazon web services",
    "amazon aws",
    "aws cloud",
    "ec2",
    "s3",
    "lambda",
    "aws lambda",
    "aws ec2",
    "aws s3",
    "cloudfront",
    "aws cloudfront",
    "rds",
    "aws rds",
    "ecs",
    "eks",
    "aws ecs",
    "aws eks",
    "sqs",
    "sns",
    "aws sqs",
    "aws sns",
    "api gateway",
    "aws api gateway",
    "cloudwatch",
    "aws cloudwatch",
    "iam",
    "aws iam",
    "vpc",
    "aws vpc",
  ],

  "Microsoft Azure": [
    "azure",
    "microsoft azure",
    "azure cloud",
    "azure devops",
    "azure functions",
    "azure blob",
    "azure app service",
    "azure sql",
    "azure kubernetes",
    "aks",
    "azure container",
  ],

  "Google Cloud Platform": [
    "gcp",
    "google cloud",
    "google cloud platform",
    "gke",
    "google kubernetes engine",
    "bigquery",
    "google bigquery",
    "cloud run",
    "google cloud run",
    "pub/sub",
    "google pub/sub",
    "app engine",
    "google app engine",
    "cloud storage",
    "google cloud storage",
  ],

  DigitalOcean: ["digitalocean", "digital ocean", "do cloud"],

  Heroku: ["heroku"],

  Vercel: ["vercel"],

  Netlify: ["netlify"],

  Cloudflare: ["cloudflare", "cloudflare workers", "cloudflare pages"],

  // ─────────────────────────────────────────────
  // DEVOPS & CI/CD
  // ─────────────────────────────────────────────

  Docker: [
    "docker",
    "docker container",
    "dockerfile",
    "docker compose",
    "docker-compose",
    "docker swarm",
  ],

  Kubernetes: [
    "kubernetes",
    "k8s",
    "kube",
    "kubectl",
    "helm",
    "helm charts",
    "kubernetes cluster",
  ],

  Terraform: ["terraform", "terraform iac", "hashicorp terraform"],

  Ansible: ["ansible", "ansible playbook", "ansible automation"],

  Jenkins: ["jenkins", "jenkins ci", "jenkins pipeline", "jenkinsfile"],

  "GitHub Actions": ["github actions", "github action", "gh actions"],

  "GitLab CI/CD": [
    "gitlab ci",
    "gitlab ci/cd",
    "gitlab pipelines",
    "gitlab cicd",
  ],

  CircleCI: ["circleci", "circle ci"],

  "Travis CI": ["travis ci", "travis"],

  ArgoCD: ["argocd", "argo cd"],

  Prometheus: ["prometheus", "prometheus monitoring"],

  Grafana: ["grafana", "grafana dashboard"],

  Nginx: ["nginx", "nginx server", "nginx proxy"],

  Apache: ["apache", "apache server", "apache http", "apache web server"],

  Linux: [
    "linux",
    "linux server",
    "ubuntu",
    "centos",
    "red hat",
    "rhel",
    "debian",
    "fedora",
    "linux administration",
    "unix",
    "unix/linux",
  ],

  Git: [
    "git",
    "git version control",
    "github",
    "gitlab",
    "bitbucket",
    "source control",
    "version control",
  ],

  Vagrant: ["vagrant", "hashicorp vagrant"],

  Puppet: ["puppet", "puppet configuration"],

  Chef: ["chef", "chef automation", "chef infra"],

  // ─────────────────────────────────────────────
  // DATA SCIENCE & ANALYTICS
  // ─────────────────────────────────────────────

  "Machine Learning": [
    "machine learning",
    "ml",
    "supervised learning",
    "unsupervised learning",
    "reinforcement learning",
    "ml algorithms",
    "ml models",
  ],

  "Deep Learning": [
    "deep learning",
    "dl",
    "neural networks",
    "neural network",
    "convolutional neural network",
    "cnn",
    "recurrent neural network",
    "rnn",
    "lstm",
    "transformer",
    "attention mechanism",
  ],

  "Natural Language Processing": [
    "nlp",
    "natural language processing",
    "text mining",
    "text classification",
    "sentiment analysis",
    "named entity recognition",
    "ner",
    "language models",
    "large language models",
    "llm",
  ],

  "Computer Vision": [
    "computer vision",
    "cv",
    "image recognition",
    "image processing",
    "object detection",
    "opencv",
    "open cv",
  ],

  TensorFlow: [
    "tensorflow",
    "tensor flow",
    "tf",
    "tensorflow 2",
    "tensorflow keras",
  ],

  PyTorch: ["pytorch", "py torch", "torch"],

  Keras: ["keras", "keras api"],

  "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn", "scikitlearn"],

  Pandas: ["pandas", "pandas dataframe", "pandas library"],

  NumPy: ["numpy", "num py"],

  Matplotlib: ["matplotlib", "plt", "matplotlib pyplot"],

  Seaborn: ["seaborn", "sns"],

  Jupyter: [
    "jupyter",
    "jupyter notebook",
    "jupyter lab",
    "jupyterlab",
    "ipython",
  ],

  "Apache Spark": [
    "spark",
    "apache spark",
    "pyspark",
    "py spark",
    "spark streaming",
    "spark sql",
  ],

  Hadoop: ["hadoop", "apache hadoop", "hdfs", "mapreduce", "map reduce"],

  Tableau: ["tableau", "tableau desktop", "tableau public", "tableau server"],

  "Power BI": ["power bi", "powerbi", "microsoft power bi", "power bi desktop"],

  Looker: ["looker", "looker studio", "google looker"],

  dbt: ["dbt", "data build tool"],

  Airflow: ["airflow", "apache airflow", "workflow orchestration"],

  Kafka: ["kafka", "apache kafka", "kafka streams", "kafka connect"],

  Statistics: [
    "statistics",
    "statistical analysis",
    "statistical modeling",
    "hypothesis testing",
    "probability",
    "regression analysis",
    "time series",
    "time series analysis",
  ],

  "Data Analysis": [
    "data analysis",
    "data analytics",
    "data analyst",
    "exploratory data analysis",
    "eda",
    "data wrangling",
    "data cleaning",
    "data manipulation",
  ],

  "Data Engineering": [
    "data engineering",
    "data pipelines",
    "etl",
    "elt",
    "data pipeline",
    "data warehouse",
    "data lake",
    "data lakehouse",
  ],

  "A/B Testing": [
    "a/b testing",
    "a/b test",
    "ab testing",
    "split testing",
    "experimentation",
    "statistical significance",
  ],

  Snowflake: ["snowflake", "snowflake data warehouse"],

  Databricks: ["databricks", "databricks spark"],

  // ─────────────────────────────────────────────
  // AI & LLM
  // ─────────────────────────────────────────────

  "Generative AI": [
    "generative ai",
    "gen ai",
    "genai",
    "llm",
    "large language model",
    "prompt engineering",
    "rag",
    "retrieval augmented generation",
    "fine tuning",
    "fine-tuning",
  ],

  LangChain: ["langchain", "lang chain"],

  "OpenAI API": [
    "openai",
    "openai api",
    "chatgpt api",
    "gpt-4",
    "gpt4",
    "gpt-3",
    "gpt3",
    "gpt api",
  ],

  "Hugging Face": ["hugging face", "huggingface", "transformers library"],

  MLOps: [
    "mlops",
    "ml ops",
    "model deployment",
    "model serving",
    "mlflow",
    "kubeflow",
    "bentoml",
    "sagemaker",
  ],

  // ─────────────────────────────────────────────
  // CYBERSECURITY
  // ─────────────────────────────────────────────

  Cybersecurity: [
    "cybersecurity",
    "cyber security",
    "information security",
    "infosec",
    "it security",
  ],

  "Penetration Testing": [
    "penetration testing",
    "pen testing",
    "pentesting",
    "ethical hacking",
    "ethical hacker",
    "vulnerability assessment",
    "vapt",
  ],

  "Network Security": [
    "network security",
    "firewall",
    "ids",
    "ips",
    "intrusion detection",
    "intrusion prevention",
    "vpn",
    "network monitoring",
  ],

  SIEM: [
    "siem",
    "security information and event management",
    "splunk",
    "arcsight",
    "qradar",
    "sentinel",
  ],

  Cryptography: [
    "cryptography",
    "encryption",
    "decryption",
    "ssl",
    "tls",
    "ssl/tls",
    "pki",
    "public key infrastructure",
    "rsa",
    "aes",
  ],

  OWASP: [
    "owasp",
    "owasp top 10",
    "web security",
    "application security",
    "appsec",
  ],

  Compliance: [
    "compliance",
    "gdpr",
    "hipaa",
    "pci dss",
    "pci-dss",
    "iso 27001",
    "sox",
    "nist",
  ],

  "Incident Response": [
    "incident response",
    "ir",
    "security incident",
    "threat hunting",
    "forensics",
    "digital forensics",
  ],

  "Burp Suite": ["burp suite", "burpsuite", "burp"],

  Metasploit: ["metasploit", "metasploit framework"],

  Wireshark: ["wireshark", "packet analysis", "network packet analysis"],

  // ─────────────────────────────────────────────
  // QUALITY ASSURANCE / TESTING
  // ─────────────────────────────────────────────

  Selenium: ["selenium", "selenium webdriver", "selenium grid"],

  Cypress: ["cypress", "cypress testing", "cypress io"],

  Playwright: ["playwright", "microsoft playwright"],

  Appium: ["appium", "appium testing", "mobile testing"],

  Jest: ["jest", "jest testing", "jest js"],

  Mocha: ["mocha", "mocha testing", "mocha chai"],

  JUnit: ["junit", "junit 5", "junit testing"],

  TestNG: ["testng", "test ng"],

  Postman: ["postman", "postman api", "api testing"],

  "Manual Testing": [
    "manual testing",
    "manual test",
    "test cases",
    "test scenarios",
    "functional testing",
    "regression testing",
    "smoke testing",
    "sanity testing",
    "exploratory testing",
    "user acceptance testing",
    "uat",
  ],

  "Automation Testing": [
    "automation testing",
    "test automation",
    "automated testing",
    "automation framework",
    "qa automation",
  ],

  "Performance Testing": [
    "performance testing",
    "load testing",
    "stress testing",
    "jmeter",
    "gatling",
    "k6",
  ],

  BDD: [
    "bdd",
    "behavior driven development",
    "behaviour driven development",
    "cucumber",
    "gherkin",
    "behave",
  ],

  TDD: ["tdd", "test driven development"],

  JIRA: ["jira", "atlassian jira", "jira software"],

  TestRail: ["testrail", "test rail"],

  // ─────────────────────────────────────────────
  // UI/UX DESIGN
  // ─────────────────────────────────────────────

  Figma: ["figma", "figma design"],

  "Adobe XD": ["adobe xd", "xd design"],

  Sketch: ["sketch", "sketch app", "sketch design"],

  InVision: ["invision", "in vision", "invision prototype"],

  "UI Design": ["ui design", "user interface design", "interface design"],

  "UX Design": [
    "ux design",
    "user experience design",
    "user experience",
    "ux research",
    "usability testing",
    "user research",
  ],

  Wireframing: [
    "wireframing",
    "wireframes",
    "wireframe",
    "prototyping",
    "prototype",
  ],

  "Design Systems": [
    "design system",
    "design systems",
    "component library",
    "storybook",
  ],

  "Adobe Photoshop": ["photoshop", "adobe photoshop", "ps"],

  "Adobe Illustrator": ["illustrator", "adobe illustrator", "ai design"],

  Canva: ["canva"],

  // ─────────────────────────────────────────────
  // PRODUCT MANAGEMENT
  // ─────────────────────────────────────────────

  "Product Management": [
    "product management",
    "product manager",
    "pm",
    "product owner",
    "product roadmap",
    "roadmap",
    "product strategy",
  ],

  Agile: [
    "agile",
    "agile methodology",
    "agile development",
    "scrum",
    "scrum master",
    "sprint planning",
    "sprint",
    "kanban",
    "safe agile",
    "scaled agile",
  ],

  "Product Discovery": [
    "product discovery",
    "user stories",
    "user story",
    "epics",
    "backlog",
    "backlog grooming",
    "backlog refinement",
  ],

  OKRs: [
    "okr",
    "okrs",
    "objectives and key results",
    "kpis",
    "kpi",
    "key performance indicators",
  ],

  Confluence: ["confluence", "atlassian confluence"],

  Notion: ["notion"],

  // ─────────────────────────────────────────────
  // MARKETING
  // ─────────────────────────────────────────────

  "Digital Marketing": [
    "digital marketing",
    "online marketing",
    "internet marketing",
  ],

  SEO: [
    "seo",
    "search engine optimization",
    "on-page seo",
    "off-page seo",
    "technical seo",
    "link building",
    "keyword research",
  ],

  SEM: [
    "sem",
    "search engine marketing",
    "paid search",
    "ppc",
    "google ads",
    "google adwords",
  ],

  "Social Media Marketing": [
    "social media marketing",
    "social media management",
    "smm",
    "social media",
    "facebook ads",
    "instagram ads",
    "linkedin ads",
  ],

  "Content Marketing": [
    "content marketing",
    "content strategy",
    "content creation",
    "blog writing",
    "copywriting",
    "email marketing",
  ],

  Analytics: [
    "google analytics",
    "ga4",
    "google analytics 4",
    "web analytics",
    "mixpanel",
    "amplitude",
    "segment",
  ],

  CRM: [
    "crm",
    "customer relationship management",
    "salesforce",
    "hubspot",
    "zoho crm",
  ],

  // ─────────────────────────────────────────────
  // FINANCE & ACCOUNTING
  // ─────────────────────────────────────────────

  "Financial Analysis": [
    "financial analysis",
    "financial modeling",
    "financial planning",
    "fp&a",
    "financial reporting",
    "financial statements",
  ],

  Accounting: [
    "accounting",
    "bookkeeping",
    "accounts payable",
    "accounts receivable",
    "general ledger",
    "journal entries",
    "trial balance",
  ],

  Excel: [
    "excel",
    "microsoft excel",
    "ms excel",
    "advanced excel",
    "vlookup",
    "pivot table",
    "pivot tables",
    "excel macros",
    "vba",
  ],

  SAP: [
    "sap",
    "sap erp",
    "sap fi",
    "sap co",
    "sap mm",
    "sap sd",
    "sap hana",
    "sap s/4hana",
  ],

  QuickBooks: ["quickbooks", "quick books", "qbo"],

  Tally: ["tally", "tally erp", "tally prime"],

  "Risk Management": [
    "risk management",
    "risk assessment",
    "risk analysis",
    "credit risk",
    "operational risk",
    "market risk",
  ],

  "Investment Analysis": [
    "investment analysis",
    "portfolio management",
    "equity research",
    "valuation",
    "dcf",
    "discounted cash flow",
  ],

  // ─────────────────────────────────────────────
  // HUMAN RESOURCES
  // ─────────────────────────────────────────────

  Recruitment: [
    "recruitment",
    "talent acquisition",
    "headhunting",
    "sourcing",
    "hiring",
    "recruiting",
    "talent sourcing",
  ],

  "HR Management": [
    "hr management",
    "human resource management",
    "hrm",
    "hris",
    "hr operations",
    "people operations",
  ],

  Payroll: ["payroll", "payroll processing", "payroll management"],

  "Performance Management": [
    "performance management",
    "performance appraisal",
    "performance review",
    "kra",
    "goal setting",
    "360 feedback",
  ],

  "Employee Relations": [
    "employee relations",
    "employee engagement",
    "hr policies",
    "labor law",
    "labour law",
    "industrial relations",
  ],

  "Training & Development": [
    "training and development",
    "learning and development",
    "l&d",
    "employee training",
    "onboarding",
    "coaching",
    "mentoring",
  ],

  Workday: ["workday", "workday hcm"],

  BambooHR: ["bamboohr", "bamboo hr"],

  // ─────────────────────────────────────────────
  // HEALTHCARE
  // ─────────────────────────────────────────────

  "Clinical Research": [
    "clinical research",
    "clinical trials",
    "gcp",
    "good clinical practice",
    "protocol",
    "clinical data management",
  ],

  "Electronic Health Records": [
    "ehr",
    "emr",
    "electronic health records",
    "electronic medical records",
    "epic",
    "cerner",
  ],

  "Medical Coding": [
    "medical coding",
    "icd-10",
    "cpt coding",
    "hcpcs",
    "medical billing",
  ],

  Pharmacovigilance: [
    "pharmacovigilance",
    "drug safety",
    "adverse event reporting",
    "pv",
    "signal detection",
  ],

  "Healthcare Analytics": [
    "healthcare analytics",
    "health informatics",
    "clinical analytics",
    "population health",
  ],

  // ─────────────────────────────────────────────
  // SALES
  // ─────────────────────────────────────────────

  Sales: [
    "sales",
    "business development",
    "bd",
    "b2b sales",
    "b2c sales",
    "enterprise sales",
    "inside sales",
    "field sales",
  ],

  "Account Management": [
    "account management",
    "account manager",
    "client management",
    "client relations",
    "customer success",
  ],

  "Sales CRM": ["salesforce crm", "hubspot crm", "pipedrive", "zoho"],

  Negotiation: [
    "negotiation",
    "deal closing",
    "contract negotiation",
    "proposal writing",
  ],

  // ─────────────────────────────────────────────
  // PROJECT MANAGEMENT
  // ─────────────────────────────────────────────

  "Project Management": [
    "project management",
    "pmp",
    "prince2",
    "project planning",
    "project coordination",
    "project delivery",
    "project execution",
  ],

  "MS Project": ["ms project", "microsoft project"],

  Asana: ["asana"],

  Trello: ["trello"],

  "Monday.com": ["monday.com", "monday", "monday com"],

  Lean: [
    "lean",
    "lean methodology",
    "lean six sigma",
    "six sigma",
    "lean manufacturing",
  ],

  // ─────────────────────────────────────────────
  // SOFT SKILLS (selective — only include if you want to detect them)
  // ─────────────────────────────────────────────

  Communication: [
    "communication skills",
    "verbal communication",
    "written communication",
    "presentation skills",
    "public speaking",
  ],

  Leadership: [
    "leadership",
    "team leadership",
    "people management",
    "team management",
  ],

  "Problem Solving": [
    "problem solving",
    "problem-solving",
    "analytical thinking",
    "critical thinking",
  ],

  // ─────────────────────────────────────────────
  // API & INTEGRATION
  // ─────────────────────────────────────────────

  "REST APIs": [
    "rest",
    "rest api",
    "restful",
    "restful api",
    "restful apis",
    "rest services",
    "http api",
  ],

  WebSockets: ["websocket", "websockets", "socket.io", "socketio"],

  Microservices: [
    "microservices",
    "microservice architecture",
    "micro services",
    "service mesh",
    "istio",
  ],

  "Message Queues": [
    "rabbitmq",
    "rabbit mq",
    "sqs",
    "message queue",
    "message broker",
    "event driven",
    "event-driven",
    "pub/sub",
  ],

  // ─────────────────────────────────────────────
  // BLOCKCHAIN
  // ─────────────────────────────────────────────

  Blockchain: [
    "blockchain",
    "ethereum",
    "solidity",
    "web3",
    "web 3",
    "nft",
    "smart contracts",
    "defi",
    "hyperledger",
  ],

  // ─────────────────────────────────────────────
  // EMBEDDED & HARDWARE
  // ─────────────────────────────────────────────

  "Embedded Systems": [
    "embedded systems",
    "embedded c",
    "embedded software",
    "rtos",
    "real time operating system",
    "firmware",
    "microcontroller",
    "arduino",
    "raspberry pi",
    "stm32",
    "esp32",
  ],

  IoT: ["iot", "internet of things", "iot devices", "mqtt", "edge computing"],

  // ─────────────────────────────────────────────
  // GAME DEVELOPMENT
  // ─────────────────────────────────────────────

  Unity: ["unity", "unity 3d", "unity game", "unity engine"],

  "Unreal Engine": [
    "unreal engine",
    "unreal",
    "ue4",
    "ue5",
    "unreal 4",
    "unreal 5",
  ],

  // ─────────────────────────────────────────────
  // AGILE TOOLS & METHODOLOGIES (additional)
  // ─────────────────────────────────────────────

  Waterfall: ["waterfall", "waterfall methodology", "sdlc"],

  DevOps: [
    "devops",
    "dev ops",
    "devsecops",
    "dev sec ops",
    "site reliability",
    "sre",
    "platform engineering",
  ],
};

module.exports = SKILL_DICTIONARY;
