// Builds the full UPSC Prelims + Mains + Optional (Sociology) syllabus with unique topic IDs.
// Each topic has { id, name, completed }. Sections can have topicGroups for sub-headings.

function topicId(sectionId, groupSlug, i) {
  const part = groupSlug ? `${groupSlug}-${i + 1}` : String(i + 1);
  return `${sectionId}-${part}`;
}

function section(sectionId, sectionName, topicGroups) {
  return {
    id: sectionId,
    name: sectionName,
    topicGroups: topicGroups.map((g) => ({
      name: g.name,
      topics: g.topics.map((name, i) => ({
        id: topicId(sectionId, g.slug, i),
        name,
        completed: false,
      })),
    })),
  };
}

export function getPMSRoadmap() {
  return {
    papers: [
      {
        id: 'pm-intro',
        name: '🚀 1. Introduction & Foundations',
        sections: [
          section('pm-intro-core', 'Core Concepts', [
            { name: '', topics: ['What is Product Management?', 'Product vs Project Management', 'Roles and Responsibilities', 'Key Skills'] },
            { name: 'Idea Generation', slug: 'idea', topics: ['Mind Mapping', 'Brainstorming', 'SCAMPER', 'Brainstorming Techniques'] },
          ]),
          section('pm-lifecycle', 'Product Development Lifecycle', [
            { name: '', topics: ['Development', 'Introduction', 'Growth', 'Maturity', 'Decline'] },
          ]),
        ],
      },
      {
        id: 'pm-research',
        name: '🔍 2. Market & User Research',
        sections: [
          section('pm-identification', 'Product Identification', [
            { name: '', topics: ['Blue Ocean Strategy', 'TRIZ (Theory of Inventive Problem Solving)', 'Problem Framing'] },
            { name: 'Iterative Process', slug: 'iter', topics: ['Discovery', 'Selection', 'Validation', 'Execution'] },
          ]),
          section('pm-market', 'Market Analysis', [
            { name: '', topics: ['Identifying Market Needs', 'Competitive Analysis', 'Emerging Market Trends'] },
          ]),
          section('pm-user', 'User Research', [
            { name: '', topics: ['User Personas', 'User Interviews', 'Surveys and Questionnaires', 'Ethnographic Research'] },
          ]),
        ],
      },
      {
        id: 'pm-strategy',
        name: '🎯 3. Product Strategy',
        sections: [
          section('pm-positioning', 'Positioning & Value', [
            { name: 'Positioning', slug: 'pos', topics: ['USP (Unique Selling Point)', 'Market Segmentation', 'Case Studies'] },
            { name: 'Value Proposition', slug: 'val', topics: ['Defining Value Proposition', 'Value Proposition Canvas'] },
          ]),
          section('pm-vision', 'Vision & Mission', [
            { name: '', topics: ['Statement', 'Proposition', 'Capabilities', 'Solved Constraints', 'Future Constraints', 'Reference Materials', 'Narrative'] },
          ]),
          section('pm-goals', 'Defining Goals', [
            { name: 'Goal Types', slug: 'goals', topics: ['Target', 'Baseline', 'Trend', 'Timeframe'] },
          ]),
        ],
      },
      {
        id: 'pm-planning',
        name: '📅 4. Product Planning & Requirements',
        sections: [
          section('pm-reqs', 'Requirements', [
            { name: '', topics: ['Writing PRDs', 'User Stories', 'Job Stories'] },
          ]),
          section('pm-roadmap-detail', 'Product Roadmap', [
            { name: '', topics: ['Creating a Roadmap', 'Prioritizing Features', 'Continuous Roadmapping', 'Outcome-Based Roadmaps', 'Communicating the Roadmap'] },
          ]),
        ],
      },
      {
        id: 'pm-design-agile',
        name: '🎨 5. Product Design & Agile',
        sections: [
          section('pm-backlog', 'Backlog Management', [
            { name: '', topics: ['Prioritization Techniques', 'Grooming Sessions', 'User Story Mapping'] },
          ]),
          section('pm-design-ui', 'UX / UI Design', [
            { name: '', topics: ['Principles of UX Design', 'Wireframing and Prototyping', 'Design Thinking'] },
          ]),
          section('pm-testing', 'User Testing', [
            { name: '', topics: ['Usability Testing', 'A/B Testing', 'Remote User Testing'] },
          ]),
          section('pm-agile-core', 'Agile Methodology', [
            { name: '', topics: ['Scrum Basics', 'Kanban Basics'] },
            { name: 'Engineering Collaboration', slug: 'eng', topics: ['Sprint Planning', 'Daily Standups', 'Retrospectives', 'Minimum Viable Product (MVP)'] },
          ]),
        ],
      },
      {
        id: 'pm-launch-metrics',
        name: '🚀 6. Launch & Metrics',
        sections: [
          section('pm-release', 'Release Strategies', [
            { name: '', topics: ['Feature Toggles', 'Phased Rollouts', 'Dark Launches'] },
          ]),
          section('pm-gtm', 'Go-to-Market Strategy', [
            { name: '', topics: ['Launch Planning', 'Marketing Strategies', 'Growth Hacking'] },
          ]),
          section('pm-metrics-core', 'Product Metrics', [
            { name: 'Key Metrics', slug: 'keys', topics: ['DAU / MAU', 'Conversion Rate', 'Retention Rate', 'Churn Rate', 'LTV / CAC', 'North Star Metric'] },
            { name: 'Analysis', slug: 'anal', topics: ['A/B Testing', 'Cohort Analysis', 'Predictive Analytics', 'Feedback Loops'] },
          ]),
        ],
      },
      {
        id: 'pm-stakeholders',
        name: '🤝 7. Stakeholder Management & Risk',
        sections: [
          section('pm-comm', 'Communication Skills', [
            { name: '', topics: ['Interpersonal', 'Communication Techniques', 'Difficult Conversations', 'Active Listening', 'Conflict Resolution'] },
          ]),
          section('pm-manage', 'Managing Stakeholders', [
            { name: '', topics: ['Identifying Stakeholders', 'Stakeholder Mapping', 'Stakeholder Engagement', 'Remote Stakeholders'] },
          ]),
          section('pm-risk', 'Risk Management', [
            { name: 'Assessment', slug: 'assess', topics: ['Risk Identification Techniques', 'Risk Register', 'Qualitative Risk Assessment', 'Quantitative Risk Assessment'] },
            { name: 'Mitigation', slug: 'mit', topics: ['Mitigation Strategies', 'Contingency Planning', 'Monitoring and Controlling Risks', 'Risk Monitoring Tools', 'Risk Audits'] },
          ]),
        ],
      },
      {
        id: 'pm-advanced',
        name: '🌟 8. Advanced Topics',
        sections: [
          section('pm-tools-list', 'Product Management Tools', [
            { name: '', topics: ['Roadmapping Tools', 'Project Management Tools', 'Analytics Tools', 'Communication Tools'] },
          ]),
          section('pm-scaling', 'Scaling & Portfolio', [
            { name: 'Scaling', slug: 'scale', topics: ['Growth Strategies', 'Internationalization', 'Platform Thinking'] },
            { name: 'Analysis', slug: 'adv-anal', topics: ['Portfolio Management', 'Predictive Analytics', 'ML in Product Mgmt.', 'AI in Product Mgmt.'] },
          ]),
          section('pm-leadership', 'Leadership', [
            { name: '', topics: ['Building and Leading Teams', 'Influencing without Authority', 'Emotional Intelligence'] },
          ]),
        ],
      },
    ],
  };
}

export function getDefaultSyllabus() {
  return {
    papers: [
      {
        id: 'prelims-gs',
        name: '🟢 Paper I – General Studies (Prelims)',
        sections: [
          section('pre-ca', '1. Current Affairs', [
            { name: '', topics: ['National events & issues', 'International relations & developments', 'Government schemes & policies', 'Reports & indices (UN, World Bank, IMF, NITI, etc.)', 'Science & tech developments', 'Environmental issues & summits', 'Awards, sports, culture', 'Economic developments'] },
          ]),
          section('pre-history', '2. History of India', [
            { name: 'Ancient India', slug: 'ancient', topics: ['Prehistoric cultures', 'Indus Valley Civilization', 'Vedic age', 'Mauryan & Gupta empires', 'Religious movements (Buddhism, Jainism)'] },
            { name: 'Medieval India', slug: 'medieval', topics: ['Delhi Sultanate', 'Mughal administration', 'Bhakti & Sufi movements'] },
            { name: 'Modern India', slug: 'modern', topics: ['British expansion', 'Administrative & economic impact', 'Tribal & peasant movements', 'Socio-religious reform movements'] },
          ]),
          section('pre-inmov', '3. Indian National Movement', [
            { name: '', topics: ['1857 Revolt', 'Moderate & Extremist phases', 'Gandhian era movements', 'Revolutionary movements', 'Constituent Assembly', 'Independence & partition'] },
          ]),
          section('pre-geog', '4. Geography (India & World)', [
            { name: 'Physical Geography', slug: 'phys', topics: ['Geomorphology', 'Climatology', 'Oceanography', 'Biogeography'] },
            { name: 'Indian Geography', slug: 'ind', topics: ['Physiographic divisions', 'Rivers & drainage', 'Climate & monsoon', 'Soils', 'Natural vegetation', 'Agriculture', 'Minerals & industries'] },
            { name: 'World Geography', slug: 'world', topics: ['Continents', 'Oceans', 'Important locations'] },
          ]),
          section('pre-polity', '5. Indian Polity & Governance', [
            { name: '', topics: ['Constitution: features, amendments', 'Fundamental Rights & Duties', 'Directive Principles', 'Union & State governments', 'Panchayati Raj & municipalities', 'Judiciary', 'Constitutional bodies', 'Public policy', 'Governance issues'] },
          ]),
          section('pre-economy', '6. Economy & Social Development', [
            { name: '', topics: ['Basic macroeconomics', 'Growth vs development', 'Poverty & inequality', 'Demographics', 'Employment', 'Sustainable development', 'Social sector initiatives'] },
          ]),
          section('pre-env', '7. Environment & Ecology', [
            { name: '', topics: ['Ecosystem & biodiversity', 'Conservation efforts', 'Climate change', 'International conventions', 'Environmental laws', 'Pollution'] },
          ]),
          section('pre-science', '8. General Science', [
            { name: '', topics: ['Physics (basic concepts)', 'Chemistry (everyday applications)', 'Biology (human, plants, diseases)', 'Science & tech basics'] },
          ]),
        ],
      },
      {
        id: 'prelims-csat',
        name: 'Paper II – CSAT (Prelims)',
        sections: [
          section('csat', 'Paper II – CSAT', [
            { name: '', topics: ['Reading comprehension', 'Logical reasoning', 'Analytical reasoning', 'Decision-making', 'Mental ability', 'Numeracy (Class X)', 'Data interpretation', 'English comprehension'] },
          ]),
        ],
      },
      {
        id: 'mains-essay',
        name: '🔵 Paper I – Essay (Mains)',
        sections: [
          section('essay', 'Essay', [
            { name: '', topics: ['Philosophical topics', 'Social issues', 'Economic issues', 'Political issues', 'Ethical & moral themes', 'Contemporary issues'] },
          ]),
        ],
      },
      {
        id: 'mains-gs1',
        name: 'Paper II – GS I (Mains)',
        sections: [
          section('gs1-culture', 'Indian Culture', [
            { name: '', topics: ['Architecture', 'Sculpture', 'Painting', 'Music', 'Dance', 'Literature'] },
          ]),
          section('gs1-history', 'Modern Indian History', [
            { name: '', topics: ['British conquest', 'Administrative changes', 'Economic impact', 'National movement phases'] },
          ]),
          section('gs1-post', 'Post-Independence India', [
            { name: '', topics: ['Integration of princely states', 'Linguistic reorganization', 'Political consolidation'] },
          ]),
          section('gs1-world', 'World History', [
            { name: '', topics: ['Industrial revolution', 'World wars', 'Colonization & decolonization', 'Political ideologies'] },
          ]),
          section('gs1-society', 'Indian Society', [
            { name: '', topics: ['Diversity', 'Women issues', 'Population', 'Poverty', 'Urbanization', 'Globalization', 'Social empowerment'] },
          ]),
          section('gs1-geog', 'Geography', [
            { name: '', topics: ['Physical geography', 'Resource distribution', 'Industrial location', 'Natural hazards'] },
          ]),
        ],
      },
      {
        id: 'mains-gs2',
        name: 'Paper III – GS II (Mains)',
        sections: [
          section('gs2-polity', 'Polity', [
            { name: '', topics: ['Constitution & amendments', 'Federalism', 'Legislature', 'Executive', 'Judiciary', 'Electoral system'] },
          ]),
          section('gs2-gov', 'Governance', [
            { name: '', topics: ['Transparency', 'Accountability', 'E-governance', 'Civil services'] },
          ]),
          section('gs2-social', 'Social Justice', [
            { name: '', topics: ['Welfare schemes', 'Health', 'Education', 'Poverty & hunger'] },
          ]),
          section('gs2-ir', 'International Relations', [
            { name: '', topics: ['Neighbourhood policy', 'Global groupings', 'International institutions', 'Indian diaspora'] },
          ]),
        ],
      },
      {
        id: 'mains-gs3',
        name: 'Paper IV – GS III (Mains)',
        sections: [
          section('gs3-economy', 'Economy', [
            { name: '', topics: ['Planning', 'Budgeting', 'Agriculture', 'Industry', 'Infrastructure'] },
          ]),
          section('gs3-sci', 'Science & Technology', [
            { name: '', topics: ['IT', 'Space', 'Biotech', 'Robotics', 'IPR'] },
          ]),
          section('gs3-env', 'Environment', [
            { name: '', topics: ['Biodiversity', 'Pollution', 'Climate change', 'EIA'] },
          ]),
          section('gs3-security', 'Security', [
            { name: '', topics: ['Internal security', 'Cyber security', 'Terrorism', 'Border management'] },
          ]),
          section('gs3-disaster', 'Disaster Management', [
            { name: '', topics: ['Types of disasters', 'Mitigation', 'Preparedness', 'Response'] },
          ]),
        ],
      },
      {
        id: 'mains-gs4',
        name: 'Paper V – GS IV Ethics (Mains)',
        sections: [
          section('gs4-ethics', 'Ethics', [
            { name: '', topics: ['Ethics concepts', 'Human values', 'Attitude', 'Emotional intelligence', 'Moral thinkers', 'Ethics in administration', 'Probity', 'Case studies'] },
          ]),
        ],
      },
      {
        id: 'optional-socio',
        name: '🟣 Optional: Sociology (Mains)',
        sections: [
          section('socio-p1', 'Paper I – Sociology: Fundamentals', [
            { name: '1. Sociology – Discipline', slug: 'd', topics: ['Sociology as a science', 'Relationship with other disciplines'] },
            { name: '2. Sociological Thinkers', slug: 't', topics: ['Karl Marx', 'Historical materialism', 'Class struggle', 'Emile Durkheim', 'Social facts', 'Division of labour', 'Max Weber', 'Social action', 'Authority & bureaucracy'] },
            { name: '3. Research Methodology', slug: 'r', topics: ['Quantitative methods', 'Qualitative methods', 'Sampling', 'Hypothesis', 'Reliability & validity'] },
            { name: '4. Basic Concepts', slug: 'b', topics: ['Social structure', 'Social institutions', 'Social stratification', 'Mobility', 'Power & authority'] },
            { name: '5. Economic Systems', slug: 'e', topics: ['Work & labour', 'Capitalism & socialism', 'Informal sector'] },
            { name: '6. Political Sociology', slug: 'p', topics: ['Power', 'State', 'Elites'] },
            { name: '7. Religion', slug: 'rel', topics: ['Religion & society', 'Secularization'] },
            { name: '8. Social Change', slug: 's', topics: ['Modernization', 'Globalization', 'Development'] },
          ]),
          section('socio-p2', 'Paper II – Sociology: Indian Society', [
            { name: '1. Indian Social Structure', slug: 'i1', topics: ['Unity & diversity', 'Demographic profile'] },
            { name: '2. Caste System', slug: 'i2', topics: ['Varna vs caste', 'Features', 'Mobility', 'Dominant caste', 'Changing nature'] },
            { name: '3. Tribal Society', slug: 'i3', topics: ['Characteristics', 'Problems', 'Development'] },
            { name: '4. Religion in India', slug: 'i4', topics: ['Hinduism', 'Islam', 'Christianity', 'Secularism'] },
            { name: '5. Family & Kinship', slug: 'i5', topics: ['Types of family', 'Marriage patterns', 'Kinship systems'] },
            { name: '6. Agrarian Structure', slug: 'i6', topics: ['Land reforms', 'Peasantry'] },
            { name: '7. Industry & Urbanization', slug: 'i7', topics: ['Industrialization', 'Urban problems'] },
            { name: '8. Social Movements', slug: 'i8', topics: ['Peasant movements', 'Tribal movements', 'Dalit movements', "Women's movements"] },
            { name: '9. Population', slug: 'i9', topics: ['Population growth', 'Demographic transition'] },
            { name: '10. Social Change', slug: 'i10', topics: ['Globalization', 'Media', 'Education'] },
          ]),
        ],
      },
    ],
  };
}
