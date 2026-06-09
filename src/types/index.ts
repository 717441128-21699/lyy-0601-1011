export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  resumeUrl?: string;
  education: string;
  workExperience: number;
  skills: string[];
  expectedSalary: string;
  status: CandidateStatus;
  appliedDate: string;
  source: string;
  tags: string[];
  currentStage: InterviewStage;
}

export type CandidateStatus = 'pending' | 'interviewing' | 'passed' | 'rejected' | 'hired';

export type InterviewStage = 'resume_screen' | 'phone_interview' | 'tech_interview' | 'hr_interview' | 'final_interview' | 'offer';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  interviewer: string;
  interviewerId: string;
  startTime: string;
  endTime: string;
  date: string;
  stage: InterviewStage;
  location: string;
  type: 'onsite' | 'online' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  evaluation?: InterviewEvaluation;
}

export interface InterviewEvaluation {
  overallScore: number;
  technicalSkills: number;
  communication: number;
  teamwork: number;
  problemSolving: number;
  comments: string;
  strengths: string[];
  weaknesses: string[];
  suggestedSalary?: string;
  recommendation: 'strong_hire' | 'hire' | 'borderline' | 'no_hire';
  completedAt: string;
}

export interface Interviewer {
  id: string;
  name: string;
  department: string;
  title: string;
  email: string;
  phone: string;
  busySlots: TimeSlot[];
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'interview_invite' | 'rejection' | 'offer' | 'reminder' | 'feedback';
  subject: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  templateId: string;
  templateName: string;
  type: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'draft' | 'sent' | 'failed';
  channel: 'email' | 'sms' | 'system';
}

export interface CommunicationRecord {
  id: string;
  candidateId: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Position {
  id: string;
  name: string;
  department: string;
  hiringManager: string;
  headcount: number;
  hiredCount: number;
  status: 'open' | 'closed' | 'on_hold';
}
