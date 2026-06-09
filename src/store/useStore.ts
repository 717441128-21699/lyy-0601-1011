import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Candidate, Interview, Interviewer, NotificationTemplate, NotificationRecord,
  Position, CommunicationRecord, InterviewEvaluation, CandidateStatus, InterviewStage,
  FilterPreset, TimelineEvent, NextAction, TalentPoolGroup
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
  filterPresets: FilterPreset[];
  timelineEvents: TimelineEvent[];
  nextActions: NextAction[];
  activeTab: string;
  searchKeyword: string;
  filterPosition: string;
  filterStatus: string;
  filterTalentGroup: TalentPoolGroup | '';
  selectedCandidate: Candidate | null;
  selectedInterview: Interview | null;
  selectedCandidateIds: string[];
  selectedCandidateForDetail: string | null;
  notificationDraft: { candidateId: string; templateType: string } | null;
  scheduleDraft: { candidateId: string; stage: InterviewStage } | null;

  setActiveTab: (tab: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilterPosition: (position: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterTalentGroup: (group: TalentPoolGroup | '') => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setSelectedInterview: (interview: Interview | null) => void;
  setSelectedCandidateIds: (ids: string[]) => void;
  toggleSelectedCandidateId: (id: string) => void;
  setSelectedCandidateForDetail: (id: string | null) => void;
  setNotificationDraft: (draft: { candidateId: string; templateType: string } | null) => void;
  setScheduleDraft: (draft: { candidateId: string; stage: InterviewStage } | null) => void;

  addCandidate: (candidate: Omit<Candidate, 'id'>) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  updateCandidateStatus: (id: string, status: CandidateStatus, stage?: InterviewStage) => void;
  updateCandidateTalentGroup: (id: string, group: TalentPoolGroup) => void;
  deleteCandidate: (id: string) => void;
  importCandidates: (candidates: Omit<Candidate, 'id'>[]) => void;
  batchUpdateCandidates: (ids: string[], updates: Partial<Candidate>) => void;
  batchUpdateCandidateStage: (ids: string[], stage: InterviewStage) => void;
  batchAddCommunicationRecord: (ids: string[], content: string, type?: 'call' | 'email' | 'meeting' | 'note') => void;

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
  getInterviewsByInterviewer: (interviewerId: string, date?: string) => Interview[];
  getUpcomingInterviews: () => Interview[];
  getInterviewerFreeSlots: (interviewerId: string, date: string) => { start: string; end: string }[];
  getInterviewerWorkload: (interviewerId: string, startDate: string, endDate: string) => { total: number; completed: number; scheduled: number };
  getAlternativeSlots: (interviewerId: string, date: string, durationMinutes: number, excludeSlot?: { start: string; end: string }) => { start: string; end: string }[];
  isTimeSlotAvailable: (interviewerId: string, date: string, startTime: string, endTime: string) => boolean;
  searchCommunications: (keyword: string) => CommunicationRecord[];
  addFilterPreset: (preset: Omit<FilterPreset, 'id' | 'createdAt'>) => void;
  updateFilterPreset: (id: string, updates: Partial<FilterPreset>) => void;
  deleteFilterPreset: (id: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  getTimelineByCandidate: (candidateId: string) => TimelineEvent[];
  addNextAction: (action: Omit<NextAction, 'id' | 'createdAt'>) => void;
  updateNextAction: (id: string, updates: Partial<NextAction>) => void;
  completeNextAction: (id: string) => void;
  completeNextActionByType: (candidateId: string, actionType: string, completionNote?: string) => boolean;
  getNextActionsByCandidate: (candidateId: string) => NextAction[];
  getPendingNextActions: () => NextAction[];
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
      filterPresets: [],
      timelineEvents: [],
      nextActions: [],
      activeTab: 'candidates',
      searchKeyword: '',
      filterPosition: '',
      filterStatus: '',
      filterTalentGroup: '',
      selectedCandidate: null,
      selectedInterview: null,
      selectedCandidateIds: [],
      selectedCandidateForDetail: null,
      notificationDraft: null,
      scheduleDraft: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setFilterPosition: (position) => set({ filterPosition: position }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterTalentGroup: (group) => set({ filterTalentGroup: group }),
      setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
      setSelectedInterview: (interview) => set({ selectedInterview: interview }),
      setSelectedCandidateIds: (ids) => set({ selectedCandidateIds: ids }),
      toggleSelectedCandidateId: (id) => set((state) => ({
        selectedCandidateIds: state.selectedCandidateIds.includes(id)
          ? state.selectedCandidateIds.filter((i) => i !== id)
          : [...state.selectedCandidateIds, id],
      })),
      setSelectedCandidateForDetail: (id) => set({ selectedCandidateForDetail: id }),
      setNotificationDraft: (draft) => set({ notificationDraft: draft }),
      setScheduleDraft: (draft) => set({ scheduleDraft: draft }),

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

      updateCandidateTalentGroup: (id, group) =>
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, talentPoolGroup: group } : c
          ),
        })),

      deleteCandidate: (id) =>
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
          interviews: state.interviews.filter((i) => i.candidateId !== id),
          selectedCandidateIds: state.selectedCandidateIds.filter((i) => i !== id),
        })),

      importCandidates: (candidates) =>
        set((state) => ({
          candidates: [...state.candidates, ...candidates.map((c) => ({ ...c, id: generateId(), talentPoolGroup: c.talentPoolGroup || 'normal' }))],
        })),

      batchUpdateCandidates: (ids, updates) =>
        set((state) => ({
          candidates: state.candidates.map((c) =>
            ids.includes(c.id) ? { ...c, ...updates } : c
          ),
        })),

      batchUpdateCandidateStage: (ids, stage) => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        set((state) => {
          const updatedCandidates = state.candidates.map((c) =>
            ids.includes(c.id) ? { ...c, currentStage: stage } : c
          );
          const newEvents = ids.map((id) => ({
            id: generateId(),
            candidateId: id,
            type: 'stage_change' as const,
            title: '阶段更新',
            content: `阶段已更新为 ${stage}`,
            createdAt: now,
            createdBy: '招聘负责人',
            metadata: { newStage: stage },
          }));
          return {
            candidates: updatedCandidates,
            timelineEvents: [...state.timelineEvents, ...newEvents],
          };
        });
      },

      batchAddCommunicationRecord: (ids, content, type = 'note') => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        set((state) => {
          const newCommunications = ids.map((id) => ({
            id: generateId(),
            candidateId: id,
            type,
            content,
            createdAt: now,
            createdBy: '招聘负责人',
          }));
          const newEvents = ids.map((id) => ({
            id: generateId(),
            candidateId: id,
            type: 'communication' as const,
            title: '沟通记录',
            content,
            createdAt: now,
            createdBy: '招聘负责人',
          }));
          return {
            communicationRecords: [...state.communicationRecords, ...newCommunications],
            timelineEvents: [...state.timelineEvents, ...newEvents],
          };
        });
      },

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
        const { candidates, searchKeyword, filterPosition, filterStatus, filterTalentGroup } = get();
        return candidates.filter((c) => {
          const matchSearch = !searchKeyword ||
            c.name.includes(searchKeyword) ||
            c.phone.includes(searchKeyword) ||
            c.email.includes(searchKeyword) ||
            c.position.includes(searchKeyword);
          const matchPosition = !filterPosition || c.position === filterPosition;
          const matchStatus = !filterStatus || c.status === filterStatus;
          const matchTalentGroup = !filterTalentGroup || c.talentPoolGroup === filterTalentGroup;
          return matchSearch && matchPosition && matchStatus && matchTalentGroup;
        });
      },

      getInterviewsByDate: (date) => {
        return get().interviews.filter((i) => i.date === date && i.status !== 'cancelled');
      },

      getInterviewsByCandidate: (candidateId) => {
        return get().interviews.filter((i) => i.candidateId === candidateId);
      },

      getInterviewsByInterviewer: (interviewerId, date) => {
        const interviews = get().interviews.filter((i) => i.interviewerId === interviewerId && i.status !== 'cancelled');
        if (date) {
          return interviews.filter((i) => i.date === date);
        }
        return interviews;
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

      getInterviewerWorkload: (interviewerId, startDate, endDate) => {
        const interviews = get().interviews.filter(
          (i) => i.interviewerId === interviewerId &&
            i.date >= startDate &&
            i.date <= endDate &&
            i.status !== 'cancelled'
        );
        return {
          total: interviews.length,
          completed: interviews.filter((i) => i.status === 'completed').length,
          scheduled: interviews.filter((i) => i.status === 'scheduled').length,
        };
      },

      getAlternativeSlots: (interviewerId, date, durationMinutes, excludeSlot) => {
        const freeSlots = get().getInterviewerFreeSlots(interviewerId, date);
        const duration = Math.ceil(durationMinutes / 60);
        const durationStr = duration.toString().padStart(2, '0') + ':00';

        return freeSlots.filter((slot) => {
          const slotStart = parseInt(slot.start.replace(':', ''));
          const slotEnd = parseInt(slot.end.replace(':', ''));
          const slotDuration = slotEnd - slotStart;
          const minDuration = parseInt(durationStr.replace(':', ''));

          if (excludeSlot) {
            const excludeStart = parseInt(excludeSlot.start.replace(':', ''));
            const excludeEnd = parseInt(excludeSlot.end.replace(':', ''));
            if (slotStart >= excludeStart && slotEnd <= excludeEnd) {
              return false;
            }
          }

          return slotDuration >= minDuration;
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

      addFilterPreset: (preset) => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        set((state) => ({
          filterPresets: [...state.filterPresets, { ...preset, id: generateId(), createdAt: now }],
        }));
      },

      updateFilterPreset: (id, updates) =>
        set((state) => ({
          filterPresets: state.filterPresets.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteFilterPreset: (id) =>
        set((state) => ({
          filterPresets: state.filterPresets.filter((p) => p.id !== id),
        })),

      addTimelineEvent: (event) =>
        set((state) => ({
          timelineEvents: [...state.timelineEvents, { ...event, id: generateId() }],
        })),

      getTimelineByCandidate: (candidateId) => {
        return get().timelineEvents
          .filter((e) => e.candidateId === candidateId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      addNextAction: (action) => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        set((state) => ({
          nextActions: [...state.nextActions, { ...action, id: generateId(), createdAt: now, status: 'pending' as const }],
        }));
      },

      updateNextAction: (id, updates) =>
        set((state) => ({
          nextActions: state.nextActions.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      completeNextAction: (id) => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        set((state) => ({
          nextActions: state.nextActions.map((a) =>
            a.id === id ? { ...a, status: 'completed' as const, completedAt: now } : a
          ),
        }));
      },

      completeNextActionByType: (candidateId, actionType, completionNote) => {
        const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
        const state = get();
        
        const typeMap: Record<string, string[]> = {
          'send_offer': ['send_offer', 'offer'],
          'send_rejection': ['send_rejection', 'rejection'],
          'schedule_interview': ['schedule_interview', 'next_round'],
          'notification_offer': ['send_offer', 'offer'],
          'notification_rejection': ['send_rejection', 'rejection'],
          'offer': ['send_offer', 'offer'],
          'rejection': ['send_rejection', 'rejection'],
        };
        
        const matchingTypes = typeMap[actionType] || [actionType];
        
        const pendingAction = state.nextActions.find((a) => 
          a.candidateId === candidateId && 
          a.status === 'pending' && 
          matchingTypes.includes(a.type)
        );
        
        if (pendingAction) {
          const candidate = state.candidates.find((c) => c.id === candidateId);
          const timelineEvent: Omit<TimelineEvent, 'id'> = {
            candidateId,
            type: 'next_action',
            title: `✓ 完成待办 - ${pendingAction.description}`,
            content: completionNote || pendingAction.description,
            createdAt: now,
            createdBy: '系统',
            metadata: { actionId: pendingAction.id, actionType: pendingAction.type, autoCompleted: true },
          };
          
          set((state) => ({
            nextActions: state.nextActions.map((a) =>
              a.id === pendingAction.id ? { ...a, status: 'completed' as const, completedAt: now } : a
            ),
            timelineEvents: [...state.timelineEvents, { ...timelineEvent, id: generateId() }],
          }));
          
          return true;
        }
        
        return false;
      },

      getNextActionsByCandidate: (candidateId) => {
        return get().nextActions
          .filter((a) => a.candidateId === candidateId)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      },

      getPendingNextActions: () => {
        return get().nextActions
          .filter((a) => a.status === 'pending')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
        filterPresets: state.filterPresets,
        timelineEvents: state.timelineEvents,
        nextActions: state.nextActions,
      }),
    }
  )
);
