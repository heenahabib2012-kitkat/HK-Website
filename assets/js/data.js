/**
 * Single source of truth for all site content.
 * Everything here is drawn from HK Business Consultancy's own reference
 * material — nothing fabricated. Add/edit entries here to update the site.
 */

export const brand = {
  name: 'HK Business Consultancy',
  short: 'HK',
  founded: 2015,
  hqEstablished: 2021,
  tagline: 'Turn your hobby into a profession.',
  mission: 'We grow when you grow.',
  email: 'info@honestandkeen.com',
  website: 'www.hkbusinessconsultancy.com',
  websiteUrl: 'https://www.hkbusinessconsultancy.com',
  phones: {
    uae: ['+971 5858 15229', '+971 585822086'],
    india: ['+91 7829 500009', '+91 9544 392026'],
  },
  whatsapp: 'https://wa.me/971585815229',
  social: {
    instagram: '#',
    linkedin: '#',
  },
  stats: [
    { n: '10+', l: 'Years' },
    { n: '15+', l: 'Countries' },
    { n: '50+', l: 'Clients' },
    { n: '7', l: 'Companies' },
  ],
};

/* The nine service lines, verbatim from HK's own material — presented here
   as an interconnected discipline system rather than a flat list. `related`
   defines which other disciplines the interface highlights together. */
export const disciplines = [
  {
    id: 'business-setup',
    n: '01',
    name: 'Business Setup',
    short: 'Market Entry',
    description: 'End-to-end company formation across UAE mainland and free zones — licensing, documentation, compliance, and strategic launch support.',
    related: ['legal', 'startup-consulting', 'franchise'],
  },
  {
    id: 'franchise',
    n: '02',
    name: 'Franchise Development & Expansion',
    short: 'Franchise',
    description: 'Franchise creation, documentation, brand adaptation, and international rollout support for emerging and established brands.',
    related: ['brand', 'business-setup'],
  },
  {
    id: 'brand',
    n: '03',
    name: 'Brand Strategy & Expansion',
    short: 'Brand',
    description: 'Identity design, market positioning, storytelling, and digital presence — building brands that speak and sell across borders.',
    related: ['franchise', 'growth', 'technology'],
  },
  {
    id: 'legal',
    n: '04',
    name: 'Legal Advisory',
    short: 'Legal',
    description: 'Expert legal guidance: corporate structuring, contracts, intellectual property rights, and regulatory filings across jurisdictions.',
    related: ['business-setup', 'investment'],
  },
  {
    id: 'growth',
    n: '05',
    name: 'Growth Hacking & Digital Marketing',
    short: 'Growth',
    description: 'Data-driven strategies via Maplitho — generating MQLs, SQLs, and social media growth through Big Data and growth hacking techniques.',
    related: ['brand', 'technology'],
  },
  {
    id: 'technology',
    n: '06',
    name: 'Technology Solutions',
    short: 'Technology',
    description: 'Bespoke web & mobile development, AI & machine learning, blockchain technology, and custom software by RaSynth.',
    related: ['growth', 'brand'],
  },
  {
    id: 'investment',
    n: '07',
    name: 'Investment & Wealth Management',
    short: 'Investment',
    description: 'Investment advisory services helping you identify and invest in optimal assets for sustainable wealth growth in the GCC and India.',
    related: ['trading', 'legal'],
  },
  {
    id: 'trading',
    n: '08',
    name: 'Trading',
    short: 'Trading',
    description: 'Strategic trading of FMCG, construction materials, and agricultural goods across UAE, India, and GCC — connecting reliable suppliers with high-demand markets.',
    related: ['investment', 'business-setup'],
  },
  {
    id: 'startup-consulting',
    n: '09',
    name: 'Startup Consulting',
    short: 'Strategy',
    description: 'Without the right planning, even great products fail. We help you establish your venture the right way from day one.',
    related: ['business-setup', 'legal', 'brand'],
  },
];

/* "Where are you going?" — client objectives, each resolved into the real
   HK disciplines that serve it. */
export const journeys = [
  {
    n: '01',
    id: 'enter-market',
    title: 'Enter a new market',
    summary: 'Taking a business you already run somewhere it doesn’t operate yet — across the GCC, into India, or beyond.',
    disciplineIds: ['business-setup', 'legal', 'brand', 'franchise'],
    steps: ['Idea', 'Structure', 'Market', 'Launch', 'Scale'],
  },
  {
    n: '02',
    id: 'build-business',
    title: 'Build a business',
    summary: 'Starting from a concept and needing every piece — structure, licensing, identity and technology — in place from day one.',
    disciplineIds: ['startup-consulting', 'business-setup', 'legal', 'technology'],
    steps: ['Idea', 'Structure', 'Market', 'Launch', 'Scale'],
  },
  {
    n: '03',
    id: 'scale-brand',
    title: 'Scale an existing brand',
    summary: 'Turning a working brand into a franchise system, or extending its reach through digital growth and new adaptations.',
    disciplineIds: ['franchise', 'brand', 'growth'],
    steps: ['Idea', 'Structure', 'Market', 'Launch', 'Scale'],
  },
  {
    n: '04',
    id: 'protect-structure',
    title: 'Protect and structure the business',
    summary: 'Getting the legal, corporate and financial architecture right so the business can withstand growth, scrutiny and time.',
    disciplineIds: ['legal', 'business-setup', 'investment'],
    steps: ['Idea', 'Structure', 'Market', 'Launch', 'Scale'],
  },
  {
    n: '05',
    id: 'new-opportunities',
    title: 'Find new commercial opportunities',
    summary: 'Putting capital and trade relationships to work across FMCG, construction and agricultural goods, and identifying new assets.',
    disciplineIds: ['trading', 'investment', 'growth'],
    steps: ['Idea', 'Structure', 'Market', 'Launch', 'Scale'],
  },
];

/* Market hubs. Positions are given as percentages of a stylised (not
   geographically literal) network canvas, arranged around Dubai as the
   hub — reflecting HK's actual hub-and-spoke structure from its HQ. */
export const markets = [
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    x: 30, y: 46,
    hub: true,
    role: 'Global headquarters',
    detail: 'Established as HK’s global HQ in 2021. Business structuring, GCC expansion, investment & wealth advisory, and legal & commercial advisory are directed from here.',
    capabilities: ['Business Setup', 'Legal Advisory', 'Investment & Wealth Management'],
    people: ['Habib Koya Marapatta — Chairman & Founder', 'Faizal M Khalid — CEO', 'Sadiq Ather — COO'],
    contact: { phones: ['+971 5858 15229', '+971 585822086'] },
  },
  {
    id: 'india',
    name: 'India',
    country: 'India',
    flag: '🇮🇳',
    x: 62, y: 52,
    role: 'Market entry & operations',
    detail: 'A pivotal bridge between the GCC and Indian business ecosystems — market entry, brand expansion, trading, operations and franchise development.',
    capabilities: ['Market Entry', 'Trading', 'Franchise Development & Expansion'],
    people: ['Midlaj T P — Head of Operations, India', 'Abdul Gafoor — Executive Director', 'Azharudeen — Executive Director'],
    contact: { phones: ['+91 7829 500009', '+91 9544 392026'] },
  },
  {
    id: 'kuwait',
    name: 'Kuwait',
    country: 'Kuwait',
    flag: '🇰🇼',
    x: 44, y: 22,
    role: 'Where HK began, 2015',
    detail: 'HK Consultancy’s founding market — where informal business advice among friends first became a consultancy in 2015.',
    capabilities: ['Business Setup', 'Legal Advisory'],
    people: ['Thashreef Mustafa — Executive Director', 'Elaine Hanlon — Head of Admin'],
  },
  {
    id: 'saudi',
    name: 'Saudi Arabia',
    country: 'Kingdom of Saudi Arabia',
    flag: '🇸🇦',
    x: 38, y: 34,
    role: 'GCC expansion',
    detail: 'One of the region’s most dynamic and rapidly evolving business environments, navigated for clients expanding across the Kingdom.',
    capabilities: ['Business Setup', 'Franchise Development & Expansion'],
    people: ['Showkath Ali — Executive Director'],
  },
  {
    id: 'qatar',
    name: 'Qatar',
    country: 'Qatar',
    flag: '🇶🇦',
    x: 33, y: 40,
    role: 'Regulatory & market advisory',
    detail: 'Advisory on Qatar’s business landscape, regulatory environment, and market opportunities across the Qatari economy.',
    capabilities: ['Legal Advisory', 'Business Setup'],
    people: ['Amzad Ayub Khan — Advisory Director'],
  },
  {
    id: 'oman',
    name: 'Oman',
    country: 'Sultanate of Oman',
    flag: '🇴🇲',
    x: 40, y: 52,
    role: 'Client relationships & operations',
    detail: 'Client relationships and business operations managed across the Sultanate.',
    capabilities: ['Business Setup', 'Trading'],
    people: ['Mustafa Haji — Executive Director'],
  },
  {
    id: 'malaysia',
    name: 'Malaysia',
    country: 'Malaysia',
    flag: '🇲🇾',
    x: 78, y: 62,
    role: 'Southeast Asia gateway',
    detail: 'Market entry strategy and business expansion guidance across Southeast Asia.',
    capabilities: ['Market Entry', 'Business Setup'],
    people: ['Venketeshwar — Advisory Director'],
  },
  {
    id: 'global',
    name: 'International Markets',
    country: 'Global',
    flag: '●',
    x: 12, y: 62,
    role: '15+ countries reached',
    detail: 'Beyond its core hubs, HK’s client and advisory relationships extend across 15+ countries — with international perspective represented on its own advisory board.',
    capabilities: ['Investment & Wealth Management', 'Trading'],
    people: ['Stephen — Advisory Board (International)'],
  },
];

/* Selected clients. Categorised only by the evident, publicly-understood
   nature of each name (a hotel is hospitality, an embassy is government) —
   no engagement detail, sector performance or case-study narrative is
   invented, since none is provided in the source material. */
export const clients = [
  { name: 'The Terrace Hotels', category: 'Hospitality' },
  { name: 'Baniyas Spike Group', category: 'Diversified Group' },
  { name: 'Läderach', category: 'Confectionery & Retail' },
  { name: 'Freshii', category: 'Food & Beverage' },
  { name: 'Buhari', category: 'Food & Beverage' },
  { name: 'Ekkolite', category: 'Retail' },
  { name: 'Ojin', category: 'Retail' },
  { name: 'Kaffine Hub', category: 'Food & Beverage' },
  { name: 'Roll Up Ventures', category: 'Ventures' },
  { name: 'Embassy of India, Kuwait', category: 'Government' },
  { name: 'Markaz Knowledge City', category: 'Education & Development' },
  { name: 'Consolidated Contractors', category: 'Construction' },
  { name: 'Darvish Architects', category: 'Architecture' },
  { name: 'Coterra Coffee Roasters', category: 'Food & Beverage' },
  { name: 'AMR Acacia Hotel', category: 'Hospitality' },
  { name: 'Alif Global School', category: 'Education' },
  { name: 'Make Fresh', category: 'Food & Beverage' },
  { name: 'KP Chai', category: 'Food & Beverage' },
  { name: 'Fez Inn Hotel', category: 'Hospitality' },
  { name: 'Pitco', category: 'Industrial' },
  { name: 'Matajar', category: 'Retail' },
  { name: 'Nells Restaurant', category: 'Food & Beverage' },
  { name: 'Mount Aim', category: 'Ventures' },
];

/* Group of companies. Category and description are included only where
   the reference material describes the company's actual work (Maplitho,
   RaSynth) or the name itself is unambiguous (an "Engineering Co.");
   otherwise the entry stays a plain, honest node in the group. */
export const groupCompanies = [
  {
    id: 'rbs',
    name: 'RBS Corporation',
    category: null,
    description: 'Part of the HK Business Consultancy group of companies.',
    angle: 0,
  },
  {
    id: 'maplitho',
    name: 'Maplitho',
    category: 'Growth & Digital Marketing',
    description: 'Drives HK’s data-driven growth hacking and digital marketing work — generating MQLs, SQLs, and social media growth through Big Data.',
    angle: 45,
  },
  {
    id: 'providus',
    name: 'Providus',
    category: null,
    description: 'Part of the HK Business Consultancy group of companies.',
    angle: 90,
  },
  {
    id: 'rasynth',
    name: 'RaSynth',
    category: 'Technology',
    description: 'HK’s technology arm — bespoke web & mobile development, AI & machine learning, blockchain, and custom software.',
    angle: 135,
  },
  {
    id: 'valencia-galleria',
    name: 'Valencia Galleria',
    category: null,
    description: 'Part of the HK Business Consultancy group of companies.',
    angle: 180,
  },
  {
    id: 'valencia-heritage',
    name: 'Valencia Heritage',
    category: null,
    description: 'Part of the HK Business Consultancy group of companies.',
    angle: 225,
  },
  {
    id: 'universal-engineering',
    name: 'Universal Engineering Co.',
    category: 'Engineering',
    description: 'The group’s engineering company.',
    angle: 270,
  },
  {
    id: 'kerala-conclave',
    name: 'Kerala Conclave',
    category: 'Events & Community — India',
    description: 'The group’s India-based conclave and community initiative.',
    angle: 315,
  },
];

/* People. Roles, geographies and bios are reproduced from HK's own
   material — nothing embellished or invented. */
export const people = {
  core: [
    { name: 'Habib Koya Marapatta', role: 'Chairman & Founder', loc: 'Dubai, UAE', bio: 'The visionary behind HK Business Consultancy. Habib began his journey in Kuwait in 2015 as a Commercial Director, offering informal business advice that quickly grew into a full consultancy. In 2021 he established the Dubai global HQ. His philosophy: strategy, trust, execution, and empathy. “I don’t just help businesses grow. I grow with them.”' },
    { name: 'Faizal M Khalid', role: 'Chief Executive Officer', loc: 'UAE', bio: 'As CEO, Faizal M Khalid leads the group’s strategic direction and day-to-day operations, working closely with the Chairman to drive the group’s vision across multiple business verticals and geographies.' },
    { name: 'Sadiq Ather', role: 'Chief Operating Officer', loc: 'UAE', bio: 'Sadiq Ather oversees operations across the HK Group, ensuring seamless execution of strategies and efficient business processes — coordinating between teams and clients to deliver end-to-end business support.' },
    { name: 'Haseena Habib', role: 'Finance Director', loc: 'UAE', bio: 'Haseena Habib manages the financial health of the HK Group, overseeing accounting, financial planning, and reporting across all entities. Her expertise ensures the group’s financial integrity and supports strategic investment decisions.' },
    { name: 'Ahmad', role: 'Advisory Director — UAE', loc: 'UAE', bio: 'Ahmad serves as Advisory Director for HK Consultancy’s UAE operations, providing strategic counsel on local market dynamics, regulatory landscapes, and business development opportunities across the Emirates.' },
    { name: 'Haris Abdul Jabbar', role: 'Executive Director — UAE', loc: 'UAE', bio: 'Haris Abdul Jabbar drives business development and client engagement across the UAE market, managing key relationships and overseeing the growth of HK Consultancy’s UAE portfolio.' },
    { name: 'Heena Fathima', role: 'Head of Legal & Admin', loc: 'UAE', bio: 'Heena Fathima heads legal and administrative functions, managing compliance, contracts, documentation, and internal governance across the group. She ensures all legal frameworks are robust and client-ready.' },
    { name: 'Vyshnav N M', role: 'In-House Counsel', loc: 'UAE', bio: 'Vyshnav N M provides in-house legal counsel to the HK Group, supporting corporate structuring, contract drafting, intellectual property rights, and regulatory filings across all business verticals.' },
    { name: 'Midlaj T P', role: 'Head of Operations — India', loc: 'India', bio: 'Midlaj T P leads HK Consultancy’s India operations, overseeing client engagements, team coordination, and business execution — pivotal in bridging the GCC and Indian business ecosystems.' },
    { name: 'Sanjeed A K', role: 'Head of Trading', loc: 'UAE', bio: 'Sanjeed A K leads the trading division, managing strategic trading of FMCG, construction materials, and agricultural goods across UAE, India, and GCC — connecting reliable suppliers with high-demand markets.' },
  ],
  directors: [
    { name: 'Venketeshwar', role: 'Advisory Director', loc: 'Malaysia', bio: 'Venketeshwar serves as Advisory Director for Malaysia, guiding market entry strategies and business expansion across Southeast Asia.' },
    { name: 'Basheer Thullath', role: 'Executive Director', loc: 'UAE', bio: 'Basheer Thullath is an Executive Director in the UAE, responsible for key partnerships and business development across the Emirates.' },
    { name: 'Mustafa Haji', role: 'Executive Director', loc: 'Oman', bio: 'Mustafa Haji leads HK Consultancy’s presence in Oman, managing client relationships and business operations across the Sultanate.' },
    { name: 'Amzad Ayub Khan', role: 'Advisory Director', loc: 'Qatar', bio: 'Amzad Ayub Khan advises on Qatar’s business landscape, regulatory environment, and market opportunities across the Qatari economy.' },
    { name: 'Elaine Hanlon', role: 'Head of Admin', loc: 'Kuwait', bio: 'Elaine Hanlon heads administrative operations in Kuwait — where HK Consultancy was born in 2015. She ensures smooth organizational operations and client support.' },
    { name: 'Thashreef Mustafa', role: 'Executive Director', loc: 'Kuwait', bio: 'Thashreef Mustafa is the Executive Director for Kuwait, managing operations in the country where HK Consultancy first took root in 2015.' },
    { name: 'Showkath Ali', role: 'Executive Director', loc: 'Saudi Arabia', bio: 'Showkath Ali leads HK Consultancy’s engagements in KSA, navigating one of the region’s most dynamic and rapidly evolving business environments.' },
    { name: 'Abdul Gafoor', role: 'Executive Director', loc: 'India', bio: 'Abdul Gafoor drives HK Consultancy’s business development across India, connecting Indian enterprises with GCC opportunities and vice versa.' },
    { name: 'Azharudeen', role: 'Executive Director', loc: 'India', bio: 'Azharudeen manages HK Consultancy’s India operations, focusing on client acquisition, project delivery, and regional partnerships.' },
  ],
  advisory: [
    { name: 'Khaled Almaeena', role: 'Advisory Board Member', loc: 'GCC Region', bio: 'A respected media veteran and thought leader in the GCC region. Brings decades of experience in public affairs, communications, and regional business advisory.' },
    { name: 'Hammed Al Hamadi', role: 'Advisory Board Member', loc: 'UAE', bio: 'A prominent Emirati business figure advising on UAE market dynamics, regulatory frameworks, and government relations — providing invaluable local insight.' },
    { name: 'Dr. Bu Abdullah', role: 'Advisory Board Member', loc: 'UAE', bio: 'A distinguished UAE leader advising on strategic business development, public sector engagement, and economic diversification initiatives across the Emirates.' },
    { name: 'Ghanim Jabir', role: 'Advisory Board Member', loc: 'GCC Region', bio: 'Brings a wealth of business and investment expertise, supporting HK Consultancy’s growth strategy across the GCC and international markets.' },
    { name: 'Stephen', role: 'Advisory Board Member', loc: 'International', bio: 'Provides global business perspective, cross-border investment insight, and strategic guidance on HK Consultancy’s international expansion.' },
    { name: 'Kamyar Vathankhater', role: 'Advisory Board Member', loc: 'GCC Region', bio: 'Advises on investment strategy and business development, leveraging regional expertise to guide HK Consultancy’s portfolio companies and client engagements.' },
    { name: 'Salama Al Mazroui', role: 'Advisory Board Member', loc: 'UAE', bio: 'A trailblazing Emirati professional bringing expertise in leadership development, women empowerment, and UAE economic strategy.' },
    { name: 'Dr. Ganapathy Arumugam', role: 'Advisory Board Member', loc: 'India', bio: 'A distinguished academic and business advisor supporting HK Consultancy’s India strategy, education sector initiatives, and cross-border development.' },
    { name: 'Abdul Majeed', role: 'Advisory Board Member', loc: 'India / GCC', bio: 'Provides strategic advisory on South Asian markets, trade corridors, and business development between India and the GCC region.' },
  ],
};

export const timeline = [
  {
    year: '2015',
    place: 'Kuwait',
    title: 'Coffee-table beginnings',
    text: 'Habib Koya Marapatta, then a Commercial Director, casually offers business advice to friends. Their consistent success leads to one line: “Turn your hobby into a profession.”',
  },
  {
    year: '2017',
    place: 'Cross-border',
    title: 'Brands begin to move',
    text: 'Habib starts helping brands expand across borders, taking the first informal consultancy toward structured, cross-market work.',
  },
  {
    year: '2021',
    place: 'Dubai',
    title: 'A global headquarters',
    text: 'HK Consultancy’s global HQ is established in Dubai — becoming a new-generation firm blending legal strategy, branding, franchising, and operational support under one roof.',
  },
  {
    year: 'Today',
    place: 'GCC · India · Beyond',
    title: 'A group, not a single firm',
    text: 'A presence spanning the UAE, India, Kuwait, KSA, Qatar, Oman, Malaysia and beyond — a group of companies now working across 15+ countries.',
  },
];

export const founder = {
  name: 'Habib Koya Marapatta',
  role: 'Chairman & Founder',
  paragraphs: [
    'What began as simple coffee conversations in Kuwait quickly evolved into something much bigger. I was fortunate to have friends who believed in my ideas more than I did. Their encouragement is what sparked HK Consultancy.',
    'Over the years, I’ve learned that success is never built in isolation. It takes strategy, trust, execution, and empathy. At HK Consultancy, our mission is to walk with you through every challenge, every pivot, and every breakthrough.',
    'We don’t just give you a plan. We build your future with you.',
  ],
  signature: 'I don’t just help businesses grow. I grow with them.',
};

export const insightCategories = [
  'Market Entry',
  'Business Strategy',
  'Legal',
  'Franchising',
  'Brand Growth',
  'GCC',
  'India',
];

export const contactOptions = [
  { id: 'market-entry', label: 'Market Entry' },
  { id: 'business-setup', label: 'Business Setup' },
  { id: 'legal', label: 'Legal & Structuring' },
  { id: 'franchise', label: 'Franchise' },
  { id: 'brand', label: 'Brand Growth' },
  { id: 'investment', label: 'Investment' },
  { id: 'trading', label: 'Trading' },
  { id: 'other', label: 'Other' },
];

export const offices = [
  { flag: '🇦🇪', country: 'UAE — Global HQ', detail: 'Dubai, United Arab Emirates<br>+971 5858 15229 / +971 585822086' },
  { flag: '🇮🇳', country: 'India', detail: '+91 7829 500009 / +91 9544 392026<br>Head of Ops: Midlaj T P' },
  { flag: '🇰🇼', country: 'Kuwait', detail: 'Where HK began, 2015<br>Exec. Director: Thashreef Mustafa' },
  { flag: '🇸🇦', country: 'Saudi Arabia', detail: 'Exec. Director: Showkath Ali' },
  { flag: '🇶🇦', country: 'Qatar', detail: 'Advisory Director: Amzad Ayub Khan' },
  { flag: '🇴🇲', country: 'Oman', detail: 'Exec. Director: Mustafa Haji' },
  { flag: '🇲🇾', country: 'Malaysia', detail: 'Advisory Director: Venketeshwar' },
];

export const nav = [
  { id: 'approach', label: 'Approach' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'markets', label: 'Markets' },
  { id: 'people', label: 'People' },
  { id: 'group', label: 'Group' },
  { id: 'insights', label: 'Insights' },
  { id: 'contact', label: 'Contact' },
];
