import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Candidate, Interview, Interviewer, NotificationTemplate, NotificationRecord,
  Position, CommunicationRecord, InterviewEvaluation, CandidateStatus, InterviewStage
} from '../types';
import {
  mockCandidates, mockInterviews, mockInterviewers, mockTemplates,
  mockNotificationRecords, mockPositions, mockCommunicationRecords
} from '../data/mockData';

interface AppState {
  candidates: Candidate[];
  interviews: Interview[];
  interviewers: Interviewer[];
  templates: NotificationTemplate[];
  notificationRecords: NotificationRecord[];
  positions: Position[];
  communicationRecords: CommunicationRecord[];
  activeTab: string;
  searchKeyword: string;
  filterPosition: string;
  filterStatus: string;
  selectedCandidate: Candidate | null;
  selectedInterview: Interview | null;

  setActiveTab: (tab: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilterPosition: (position: string) => void;
  setFilterStatus: (status: string) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setSelectedInterview: (interview: Interview | null) => void;

  addCandidate: (candidate: Omit<Candidate, 'id'>) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  updateCandidateStatus: (id: string, status: CandidateStatus, stage?: InterviewStage) => void;
  deleteCandidate: (id: string) => void;
  importCandidates: (candidates: Omit<Candidate, 'id'>[]) => void;

  addInterview: (interview: Omit<Interview, 'id'>) => void;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  deleteInterview: (id: string) => void;
  updateInterviewEvaluation: (interviewId: string, evaluation: InterviewEvaluation) => void;
  rescheduleInterview: (id: string, date: string, startTime: string, endTime: string) => void;

  addTemplate: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  deleteTemplate: (id: string) => void;

  addNotificationRecord: (record: Omit<NotificationRecord, 'id'>) => void;
  addCommunicationRecord: (record: Omit<CommunicationRecord, 'id'>) => void;

  getFilteredCandidates: () => Candidate[];
  getInterviewsByDate: (date: string) => Interview[];
  getInterviewsByCandidate: (candidateId: string) => Interview[];
  getUpcomingInterviews: () => Interview[];
  getInterviewerFreeSlots: (interviewerId: string, date: string) => { start: string; end: string }[];
  isTimeSlotAvailable: (interviewerId: string, date: string, startTime: string, endTime: string) => boolean;
  searchCommunications: (keyword: string) => CommunicationRecord[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      candidates: mockCandidates,
      interviews: mockInterviews,
      interviewers: mockInterviewers,
      templates: mockTemplates,
      notificationRecords: mockNotificationRecords,
      positions: mockPositions,
      communicationRecords: mockCommunicationRecords,
      activeTab: 'candidates',
      searchKeyword: '',
      filterPosition: '',
      filterStatus: '',
      selectedCandidate: null,
      selectedInterview: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setFilterPosition: (position) => set({ filterPosition: position }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
      setSelectedInterview: (interview) => set({ selectedInterview: interview }),

      addCandidate: (candidate) =>
        set((state) => ({
          candidates: [...state.candidates, { ...candidate, id: generateId() }],
        })),

      updateCandidate: (id, updates) =>
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      updateCandidateStatus: (id, status, stage) =>
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, status, currentStage: stage || c.currentStage } : c
          ),
        })),

      deleteCandidate: (id) =>
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
          interviews: state.interviews.filter((i) => i.candidateId !== id),
        })),

      importCandidates: (candidates) =>
        set((state) => ({
          candidates: [...state.candidates, ...candidates.map((c) => ({ ...c, id: generateId() }))],
        })),

      addInterview: (interview) =>
        set((state) => ({
          interviews: [...state.interviews, { ...interview, id: generateId() }],
        })),

      updateInterview: (id, updates) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      deleteInterview: (id) =>
        set((state) => ({
          interviews: state.interviews.filter((i) => i.id !== id),
        })),

      updateInterviewEvaluation: (interviewId, evaluation) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === interviewId ? { ...i, evaluation, status: 'completed' } : i
          ),
        })),

      rescheduleInterview: (id, date, startTime, endTime) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, date, startTime, endTime } : i
          ),
        })),

      addTemplate: (template) => {
        const now = new Date().toISOString().split('T')[0];
        set((state) => ({
          templates: [...state.templates, { ...template, id: generateId(), createdAt: now, updatedAt: now }],
        }));
      },

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      addNotificationRecord: (record) =>
        set((state) => ({
          notificationRecords: [...state.notificationRecords, { ...record, id: generateId() }],
        })),

      addCommunicationRecord: (record) =>
        set((state) => ({
          communicationRecords: [...state.communicationRecords, { ...record, id: generateId() }],
        })),

      getFilteredCandidates: () => {
        const { candidates, searchKeyword, filterPosition, filterStatus } = get();
        return candidates.filter((c) => {
          const matchSearch = !searchKeyword ||
            c.name.includes(searchKeyword) ||
            c.phone.includes(searchKeyword) ||
            c.email.includes(searchKeyword) ||
            c.position.includes(searchKeyword);
          const matchPosition = !filterPosition || c.position === filterPosition;
          const matchStatus = !filterStatus || c.status === filterStatus;
          return matchSearch && matchPosition && matchStatus;
        });
      },

      getInterviewsByDate: (date) => {
        return get().interviews.filter((i) => i.date === date && i.status !== 'cancelled');
      },

      getInterviewsByCandidate: (candidateId) => {
        return get().interviews.filter((i) => i.candidateId === candidateId);
      },

      getUpcomingInterviews: () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        return get().interviews
          .filter((i) => i.date >= today && i.status === 'scheduled')
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
          });
      },

      getInterviewerFreeSlots: (interviewerId, date) => {
        const interviewer = get().interviewers.find((i) => i.id === interviewerId);
        const interviews = get().interviews.filter(
          (i) => i.interviewerId === interviewerId && i.date === date && i.status !== 'cancelled'
        );

        const busySlots = [
          ...(interviewer?.busySlots.filter((s) => s.date === date) || []),
          ...interviews.map((i) => ({ date, startTime: i.startTime, endTime: i.endTime })),
        ].sort((a, b) => a.startTime.localeCompare(b.startTime));

        const freeSlots: { start: string; end: string }[] = [];
        let lastEnd = '09:00';

        for (const slot of busySlots) {
          if (slot.startTime > lastEnd) {
            freeSlots.push({ start: lastEnd, end: slot.startTime });
          }
          lastEnd = slot.endTime > lastEnd ? slot.endTime : lastEnd;
        }

        if (lastEnd < '18:00') {
          freeSlots.push({ start: lastEnd, end: '18:00' });
        }

        return freeSlots.filter((s) => {
          const start = parseInt(s.start.replace(':', ''));
          const end = parseInt(s.end.replace(':', ''));
          return end - start >= 100;
        });
      },

      isTimeSlotAvailable: (interviewerId, date, startTime, endTime) => {
        const freeSlots = get().getInterviewerFreeSlots(interviewerId, date);
        const start = parseInt(startTime.replace(':', ''));
        const end = parseInt(endTime.replace(':', ''));

        return freeSlots.some((slot) => {
          const slotStart = parseInt(slot.start.replace(':', ''));
          const slotEnd = parseInt(slot.end.replace(':', ''));
          return start >= slotStart && end <= slotEnd;
        });
      },

      searchCommunications: (keyword) => {
        if (!keyword) return get().communicationRecords;
        const lowerKeyword = keyword.toLowerCase();
        return get().communicationRecords.filter(
          (c) =>
            c.content.toLowerCase().includes(lowerKeyword) ||
            c.createdBy.toLowerCase().includes(lowerKeyword)
        );
      },
    }),
    {
      name: 'hr-assistant-storage',
      partialize: (state) => ({
        candidates: state.candidates,
        interviews: state.interviews,
        templates: state.templates,
        notificationRecords: state.notificationRecords,
        communicationRecords: state.communicationRecords,
      }),
    }
  )
);
