export type InterviewTrack = 'behavioral' | 'java' | 'python' | 'backend' | 'ai' | 'system-design'

export type InterviewQuestion = {
  id: string
  track: InterviewTrack
  prompt: string
  followUps: string[]
  sourceId?: string
}

export const interviewTracks: { id: InterviewTrack; label: string; blurb: string }[] = [
  { id: 'behavioral', label: 'Behavioral', blurb: 'Teaching, teamwork, and how he ships under deadlines.' },
  { id: 'java', label: 'Java', blurb: 'Language listed in his skills — not tied to a specific job.' },
  { id: 'python', label: 'Python', blurb: 'Teaching, UpCancer services, Headstarter, and FastAPI.' },
  { id: 'backend', label: 'Backend', blurb: 'APIs, PostgreSQL, Redis, ServiceNow, FastAPI.' },
  { id: 'ai', label: 'AI / ML', blurb: 'RAG, embeddings, Gemini, OpenAI, YOLOv8.' },
  { id: 'system-design', label: 'System design', blurb: 'Walk through DevDash or the camera investigator.' },
]

export const interviewBank: InterviewQuestion[] = [
  {
    id: 'behavioral-lutheran',
    track: 'behavioral',
    prompt:
      'You mentored 10 immigrant students in Python at Lutheran Service School, including students with limited English. Walk through how you explained a concept when language itself was the blocker.',
    followUps: [
      'What did you change after watching a student go from hesitant to presenting their own project?',
      'How does that teaching work show up when you explain a system to teammates now?',
    ],
    sourceId: 'experience:lutheran',
  },
  {
    id: 'behavioral-hackathon',
    track: 'behavioral',
    prompt:
      'You have 12 hackathon participations and 6 wins, and you have said you are proud of finishing under tight deadlines. Tell me about a time the plan broke and you still shipped.',
    followUps: [
      'How did you divide work on that team?',
      'What would you drop first if you had to cut scope again?',
    ],
    sourceId: 'activity:hackathons',
  },
  {
    id: 'java-skills',
    track: 'java',
    prompt:
      'Java is on Imani’s verified language list, but none of the internships list Java as a job technology. Where has he actually used Java, and how would he compare it to the Python and TypeScript he used at UpCancer?',
    followUps: [
      'What would you not claim about his Java experience based on the verified profile?',
      'If a role is Java-heavy, what evidence is missing from the candidate file?',
    ],
    sourceId: 'skill:languages',
  },
  {
    id: 'python-upcancer',
    track: 'python',
    prompt:
      'At UpCancer you built Python and TypeScript microservices on Redis-cached PostgreSQL and saw +15% throughput and −20% latency. Walk through the service boundaries and where Redis sat in that path.',
    followUps: [
      'What was cached, and what still had to hit PostgreSQL?',
      'How did you and frontend engineers agree on the REST contracts?',
    ],
    sourceId: 'experience:upcancer',
  },
  {
    id: 'python-fastapi',
    track: 'python',
    prompt:
      'The AI Security Camera Investigator uses FastAPI and YOLOv8. Why FastAPI for that detection service, and how does a request get from the Next.js UI to a timestamped search result?',
    followUps: [
      'Where do embeddings live relative to the detector?',
      'What happens when detection confidence is low?',
    ],
    sourceId: 'project:securitycam',
  },
  {
    id: 'backend-upcancer',
    track: 'backend',
    prompt:
      'You mentioned building DevDash — actually, start with production backend work. At UpCancer, how did Python/TypeScript services, PostgreSQL, and Redis fit together?',
    followUps: [
      'How would you have designed that if the read path grew 10×?',
      'What did you document in the REST API contracts?',
    ],
    sourceId: 'experience:upcancer',
  },
  {
    id: 'backend-wellstar',
    track: 'backend',
    prompt:
      'At Wellstar you built REST APIs through ServiceNow Integration Hub and cut an ITSM backlog from 80% to 20% across 200–300 tickets. Walk through a workflow you automated and the server-side rules involved.',
    followUps: [
      'What made a ticket eligible for automation vs human review?',
      'How did you test Script Includes and business rules safely?',
    ],
    sourceId: 'experience:wellstar',
  },
  {
    id: 'ai-devdash',
    track: 'ai',
    prompt:
      'You mentioned building DevDash. Walk me through how GitHub commits, PRs, and CI/CD events become LLM summaries and prioritized tasks. Why OpenAI for that step?',
    followUps: [
      'What did you send to the model, and what did you keep deterministic?',
      'How did you measure the 80% reduction in manual reporting time?',
    ],
    sourceId: 'project:devdash',
  },
  {
    id: 'ai-headstarter',
    track: 'ai',
    prompt:
      'During the Headstarter AI fellowship you built 5 AI projects with Pinecone, Gemini, embeddings, and RAG. Pick one and explain the retrieval path: query → embedding → Pinecone → generation.',
    followUps: [
      'What did you store in Pinecone, and what did you leave out?',
      'How did you evaluate whether the retrieved chunks were actually relevant?',
    ],
    sourceId: 'experience:headstarter',
  },
  {
    id: 'ai-camera',
    track: 'ai',
    prompt:
      'For the AI Security Camera Investigator, how do YOLOv8 detections and embedding search work together so a recruiter could ask “red backpack near the lobby” and get a timestamp?',
    followUps: [
      'What is in the metadata you embed?',
      'How are results ranked?',
    ],
    sourceId: 'project:securitycam',
  },
  {
    id: 'design-devdash',
    track: 'system-design',
    prompt:
      'You mentioned building DevDash. Walk me through the system architecture: Next.js, Prisma, GitHub APIs, and the OpenAI API. Draw the request path for “summarize what shipped this week.”',
    followUps: [
      'Why Prisma there instead of talking to GitHub on every page load?',
      'Where does this design break if GitHub rate-limits you?',
    ],
    sourceId: 'project:devdash',
  },
  {
    id: 'design-camera',
    track: 'system-design',
    prompt:
      'Design the AI Security Camera Investigator as if you were at a whiteboard: Next.js client, FastAPI, YOLOv8, embedding search. Where is state, and what is synchronous vs async?',
    followUps: [
      'Would you run detection on upload, on query, or both?',
      'How would you keep search results timestamped and ranked as footage volume grows?',
    ],
    sourceId: 'project:securitycam',
  },
]
