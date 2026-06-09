import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { stageLabels, stageColors, interviewTypeLabels, weekDays, statusLabels, statusColors } from '../utils/constants';
import { Interview, InterviewStage } from '../types';

export default function Schedule() {
  const {
    interviews, interviewers, candidates, getInterviewsByDate,
    getInterviewerFreeSlots, isTimeSlotAvailable, addInterview,
    updateInterview, deleteInterview, rescheduleInterview, getUpcomingInterviews
  } = useStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [showFreeSlots, setShowFreeSlots] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [editingInterview, setEditingInterview] = useState<Partial<Interview>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [draggedInterview, setDraggedInterview] = useState<Interview | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = firstDay.getDay(); i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [currentDate]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = getUpcomingInterviews();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleDragStart = (interview: Interview) => {
    setDraggedInterview(interview);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: string, timeSlot: string) => {
    e.preventDefault();
    if (!draggedInterview) return;

    const [startTime, endTime] = timeSlot.split('-');
    const isSameInterviewer = draggedInterview.interviewerId;
    const dateChanged = draggedInterview.date !== date;
    const timeChanged = draggedInterview.startTime !== startTime || draggedInterview.endTime !== endTime;

    if (dateChanged || timeChanged) {
      if (isTimeSlotAvailable(isSameInterviewer, date, startTime, endTime)) {
        rescheduleInterview(draggedInterview.id, date, startTime, endTime);
        if (dateChanged) {
          setSelectedDate(date);
        }
      } else {
        alert('该时段面试官已有安排，请选择其他时间');
      }
    }
    setDraggedInterview(null);
  };

  const handleAddInterview = (candidateId?: string) => {
    const candidate = candidateId ? candidates.find((c) => c.id === candidateId) : null;
    setEditingInterview({
      candidateId: candidate?.id || '',
      candidateName: candidate?.name || '',
      position: candidate?.position || '',
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00',
      interviewerId: interviewers[0]?.id || '',
      interviewer: interviewers[0]?.name || '',
      stage: candidate?.currentStage || 'phone_interview',
      location: '会议室A',
      type: 'onsite',
      status: 'scheduled',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview({ ...interview });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!editingInterview.candidateId || !editingInterview.interviewerId) {
      alert('请选择候选人和面试官');
      return;
    }

    const interviewer = interviewers.find((i) => i.id === editingInterview.interviewerId);
    const candidate = candidates.find((c) => c.id === editingInterview.candidateId);

    if (isEditing && editingInterview.id) {
      const originalInterview = interviews.find((i) => i.id === editingInterview.id);
      const timeChanged = originalInterview && (
        originalInterview.date !== editingInterview.date ||
        originalInterview.startTime !== editingInterview.startTime ||
        originalInterview.endTime !== editingInterview.endTime ||
        originalInterview.interviewerId !== editingInterview.interviewerId
      );

      if (timeChanged && !isTimeSlotAvailable(
        editingInterview.interviewerId!,
        editingInterview.date!,
        editingInterview.startTime!,
        editingInterview.endTime!
      )) {
        alert('该时段面试官已有安排，请选择其他时间');
        return;
      }

      updateInterview(editingInterview.id, {
        ...editingInterview,
        interviewer: interviewer?.name,
        candidateName: candidate?.name,
      });
    } else {
      if (!isTimeSlotAvailable(
        editingInterview.interviewerId!,
        editingInterview.date!,
        editingInterview.startTime!,
        editingInterview.endTime!
      )) {
        alert('该时段面试官已有安排，请选择其他时间');
        return;
      }

      addInterview({
        candidateId: editingInterview.candidateId!,
        candidateName: candidate?.name || '',
        position: candidate?.position || '',
        interviewer: interviewer?.name || '',
        interviewerId: editingInterview.interviewerId!,
        date: editingInterview.date!,
        startTime: editingInterview.startTime!,
        endTime: editingInterview.endTime!,
        stage: editingInterview.stage as InterviewStage || 'phone_interview',
        location: editingInterview.location || '',
        type: editingInterview.type as 'onsite' | 'online' | 'phone' || 'onsite',
        status: 'scheduled',
      });
    }

    setShowModal(false);
    setEditingInterview({});
  };

  const handleMarkComplete = (interview: Interview) => {
    if (confirm('确定要将此面试标记为已完成吗？完成后将进入待评价列表。')) {
      updateInterview(interview.id, { status: 'completed' });
    }
  };

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '13:30-14:30', '14:30-15:30', '15:30-16:30', '16:30-17:30',
  ];

  const getInterviewForSlot = (date: string, slot: string) => {
    const dayInterviews = getInterviewsByDate(date);
    const [slotStart, slotEnd] = slot.split('-');
    return dayInterviews.find((i) => {
      return i.startTime < slotEnd && i.endTime > slotStart;
    });
  };

  const getInterviewsForCalendar = (date: string) => {
    return getInterviewsByDate(date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const freeSlots = selectedInterviewer ? getInterviewerFreeSlots(selectedInterviewer, selectedDate) : [];

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <h2 style={styles.title}>日程排布</h2>
          <span style={styles.countBadge}>今日 {getInterviewsByDate(today).length} 场</span>
        </div>
        <div style={styles.toolbarRight}>
          <button style={styles.secondaryBtn} onClick={() => setShowFreeSlots(true)}>
            🕐 查看空闲时间
          </button>
          <button style={styles.primaryBtn} onClick={() => handleAddInterview()}>
            ➕ 安排面试
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.calendarHeader}>
            <button style={styles.navBtn} onClick={handlePrevMonth}>◀</button>
            <h3 style={styles.monthTitle}>
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </h3>
            <button style={styles.navBtn} onClick={handleNextMonth}>▶</button>
            <button style={styles.todayBtn} onClick={handleToday}>今天</button>
          </div>

          <div style={styles.calendarGrid}>
            {weekDays.map((day) => (
              <div key={day} style={styles.weekDayHeader}>{day}</div>
            ))}
            {calendarDays.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayInterviews = getInterviewsForCalendar(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const isOtherMonth = !isCurrentMonth(date);

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.dayCell,
                    ...(isToday ? styles.todayCell : {}),
                    ...(isSelected ? styles.selectedCell : {}),
                    ...(isOtherMonth ? styles.otherMonthCell : {}),
                  }}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div style={styles.dayNumber}>{date.getDate()}</div>
                  {dayInterviews.slice(0, 2).map((interview) => (
                    <div
                      key={interview.id}
                      style={{
                        ...styles.miniInterview,
                        backgroundColor: stageColors[interview.stage] + '30',
                        borderLeftColor: stageColors[interview.stage],
                        opacity: interview.status === 'cancelled' ? 0.4 : 1,
                        textDecoration: interview.status === 'cancelled' ? 'line-through' : 'none',
                      }}
                      title={`${interview.candidateName} - ${interview.startTime} [${statusLabels[interview.status]}]`}
                    >
                      {interview.startTime} {interview.candidateName}
                      {interview.status !== 'scheduled' && (
                        <span style={{ marginLeft: 4, color: statusColors[interview.status] }}>●</span>
                      )}
                    </div>
                  ))}
                  {dayInterviews.length > 2 && (
                    <div style={styles.moreLabel}>+{dayInterviews.length - 2} 更多</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>{selectedDate} 日程安排</h3>
          </div>

          <div style={styles.timelineContainer}>
            {timeSlots.map((slot) => {
              const interview = getInterviewForSlot(selectedDate, slot);
              const [startTime] = slot.split('-');

              return (
                <div
                  key={slot}
                  style={styles.timeSlot}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, selectedDate, slot)}
                >
                  <div style={styles.timeLabel}>{startTime}</div>
                  {interview ? (
                    <div
                      style={{
                        ...styles.interviewCard,
                        borderLeftColor: stageColors[interview.stage],
                        backgroundColor: stageColors[interview.stage] + '15',
                        opacity: interview.status === 'cancelled' ? 0.5 : 1,
                      }}
                      draggable={interview.status === 'scheduled'}
                      onDragStart={() => interview.status === 'scheduled' && handleDragStart(interview)}
                    >
                      <div style={styles.interviewHeader}>
                        <span style={{
                          ...styles.stageBadge,
                          backgroundColor: stageColors[interview.stage] + '30',
                          color: stageColors[interview.stage],
                        }}>
                          {stageLabels[interview.stage]}
                        </span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: statusColors[interview.status] + '20',
                          color: statusColors[interview.status],
                        }}>
                          {statusLabels[interview.status]}
                        </span>
                      </div>
                      <div style={styles.interviewTitle}>{interview.candidateName}</div>
                      <div style={styles.interviewSubtitle}>
                        {interview.position} · {interview.interviewer}
                      </div>
                      <div style={styles.interviewTimeRow}>
                        <span style={styles.interviewTime}>
                          ⏰ {interview.startTime} - {interview.endTime}
                        </span>
                      </div>
                      <div style={styles.interviewFooter}>
                        <span style={styles.locationTag}>📍 {interview.location}</span>
                        <span style={styles.typeTag}>{interviewTypeLabels[interview.type]}</span>
                      </div>
                      <div style={styles.interviewActions}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleEditInterview(interview)}
                        >
                          编辑
                        </button>
                        {interview.status === 'scheduled' && (
                          <button
                            style={styles.completeBtn}
                            onClick={() => handleMarkComplete(interview)}
                          >
                            ✓ 完成
                          </button>
                        )}
                        {interview.status === 'scheduled' && (
                          <button
                            style={styles.deleteBtn}
                            onClick={() => {
                              if (confirm('确定要取消此面试安排吗？')) {
                                updateInterview(interview.id, { status: 'cancelled' });
                              }
                            }}
                          >
                            取消
                          </button>
                        )}
                        {interview.status === 'completed' && !interview.evaluation && (
                          <button
                            style={styles.evaluateBtn}
                            onClick={() => {
                              const { setActiveTab, setSelectedInterview } = useStore.getState();
                              setSelectedInterview(interview);
                              setActiveTab('evaluation');
                            }}
                          >
                            📝 去评价
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={styles.emptySlot}
                      onClick={() => {
                        const [start, end] = slot.split('-');
                        setEditingInterview(prev => ({
                          ...prev,
                          date: selectedDate,
                          startTime: start,
                          endTime: end,
                        }));
                        setShowModal(true);
                        setIsEditing(false);
                      }}
                    >
                      <span style={styles.plusIcon}>+</span>
                      <span>添加面试</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div style={styles.upcomingPanel}>
          <h4 style={styles.upcomingTitle}>⏰ 即将开始的面试</h4>
          <div style={styles.upcomingList}>
            {upcoming.slice(0, 3).map((interview) => (
              <div key={interview.id} style={styles.upcomingItem}>
                <span style={{
                  ...styles.upcomingStage,
                  backgroundColor: stageColors[interview.stage] + '20',
                  color: stageColors[interview.stage],
                }}>
                  {stageLabels[interview.stage]}
                </span>
                <span style={styles.upcomingName}>{interview.candidateName}</span>
                <span style={styles.upcomingTime}>
                  {interview.date} {interview.startTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{isEditing ? '编辑面试' : '安排面试'}</h3>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>候选人 *</label>
                  <select
                    style={styles.input}
                    value={editingInterview.candidateId || ''}
                    onChange={(e) => {
                      const candidate = candidates.find((c) => c.id === e.target.value);
                      setEditingInterview({
                        ...editingInterview,
                        candidateId: e.target.value,
                        candidateName: candidate?.name,
                        position: candidate?.position,
                        stage: candidate?.currentStage,
                      });
                    }}
                  >
                    <option value="">请选择</option>
                    {candidates.filter(c => c.status !== 'rejected' && c.status !== 'hired').map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.position}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>面试官 *</label>
                  <select
                    style={styles.input}
                    value={editingInterview.interviewerId || ''}
                    onChange={(e) => {
                      const interviewer = interviewers.find((i) => i.id === e.target.value);
                      setEditingInterview({
                        ...editingInterview,
                        interviewerId: e.target.value,
                        interviewer: interviewer?.name,
                      });
                    }}
                  >
                    <option value="">请选择</option>
                    {interviewers.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} - {i.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>面试阶段</label>
                  <select
                    style={styles.input}
                    value={editingInterview.stage || ''}
                    onChange={(e) => setEditingInterview({ ...editingInterview, stage: e.target.value as InterviewStage })}
                  >
                    {Object.entries(stageLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>面试形式</label>
                  <select
                    style={styles.input}
                    value={editingInterview.type || 'onsite'}
                    onChange={(e) => setEditingInterview({ ...editingInterview, type: e.target.value as any })}
                  >
                    {Object.entries(interviewTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>日期</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editingInterview.date || ''}
                    onChange={(e) => setEditingInterview({ ...editingInterview, date: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>时间段</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="time"
                      style={{ ...styles.input, flex: 1 }}
                      value={editingInterview.startTime || ''}
                      onChange={(e) => setEditingInterview({ ...editingInterview, startTime: e.target.value })}
                    />
                    <span style={{ padding: '8px 4px' }}>至</span>
                    <input
                      type="time"
                      style={{ ...styles.input, flex: 1 }}
                      value={editingInterview.endTime || ''}
                      onChange={(e) => setEditingInterview({ ...editingInterview, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>地点</label>
                  <input
                    style={styles.input}
                    value={editingInterview.location || ''}
                    onChange={(e) => setEditingInterview({ ...editingInterview, location: e.target.value })}
                    placeholder="如：会议室A / 腾讯会议ID..."
                  />
                </div>
              </div>
              {editingInterview.interviewerId && editingInterview.date && (
                <div style={styles.availabilityCheck}>
                  <span style={{ color: '#666' }}>面试官空闲时段：</span>
                  {getInterviewerFreeSlots(editingInterview.interviewerId, editingInterview.date).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {getInterviewerFreeSlots(editingInterview.interviewerId, editingInterview.date).map((slot, idx) => (
                        <span
                          key={idx}
                          style={styles.freeSlotTag}
                          onClick={() => setEditingInterview({
                            ...editingInterview,
                            startTime: slot.start,
                            endTime: slot.end,
                          })}
                        >
                          {slot.start} - {slot.end}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#f44336' }}>该日暂无空闲时段</span>
                  )}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setEditingInterview({}); }}>取消</button>
              <button style={styles.primaryBtn} onClick={handleSubmit}>{isEditing ? '保存' : '安排'}</button>
            </div>
          </div>
        </div>
      )}

      {showFreeSlots && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '500px' }}>
            <h3 style={styles.modalTitle}>查看面试官空闲时间</h3>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>选择面试官</label>
                  <select
                    style={styles.input}
                    value={selectedInterviewer}
                    onChange={(e) => setSelectedInterviewer(e.target.value)}
                  >
                    <option value="">请选择</option>
                    {interviewers.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} - {i.title}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>选择日期</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
              {selectedInterviewer && (
                <div style={styles.freeSlotsResult}>
                  <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px' }}>
                    {interviewers.find(i => i.id === selectedInterviewer)?.name} 的空闲时段
                  </h4>
                  {freeSlots.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {freeSlots.map((slot, idx) => (
                        <div key={idx} style={styles.freeSlotCard}>
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>
                      该日无空闲时段
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowFreeSlots(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  countBadge: {
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '12px',
    fontSize: '13px',
  },
  toolbarRight: {
    display: 'flex',
    gap: '8px',
  },
  primaryBtn: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  secondaryBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    minHeight: 0,
  },
  leftPanel: {
    flex: 1.2,
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  navBtn: {
    width: '32px',
    height: '32px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '14px',
  },
  monthTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    minWidth: '140px',
    textAlign: 'center',
  },
  todayBtn: {
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '6px',
    fontSize: '13px',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    flex: 1,
    minHeight: 0,
  },
  weekDayHeader: {
    padding: '8px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  },
  dayCell: {
    minHeight: '90px',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
    overflow: 'hidden',
  },
  todayCell: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  selectedCell: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  otherMonthCell: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  miniInterview: {
    fontSize: '11px',
    padding: '2px 6px',
    marginBottom: '2px',
    borderRadius: '3px',
    borderLeft: '3px solid',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  moreLabel: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px',
  },
  panelHeader: {
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
  timelineContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  timeSlot: {
    display: 'flex',
    marginBottom: '12px',
    minHeight: '100px',
  },
  timeLabel: {
    width: '60px',
    fontSize: '13px',
    color: '#666',
    paddingTop: '8px',
  },
  interviewCard: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    borderLeft: '4px solid',
    cursor: 'move',
    transition: 'transform 0.2s',
  },
  interviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  stageBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  interviewTitle: {
    fontSize: '15px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  interviewSubtitle: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  },
  interviewTimeRow: {
    marginBottom: '6px',
  },
  interviewFooter: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  locationTag: {
    fontSize: '12px',
    color: '#666',
  },
  typeTag: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  interviewActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '4px 10px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderRadius: '4px',
    fontSize: '12px',
  },
  completeBtn: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '4px',
    fontSize: '12px',
  },
  evaluateBtn: {
    padding: '4px 10px',
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    borderRadius: '4px',
    fontSize: '12px',
  },
  deleteBtn: {
    padding: '4px 10px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '12px',
  },
  emptySlot: {
    flex: 1,
    border: '2px dashed #ddd',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#aaa',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  plusIcon: {
    fontSize: '18px',
    fontWeight: 500,
  },
  upcomingPanel: {
    marginTop: '16px',
    backgroundColor: '#fff8e1',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  upcomingTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  upcomingList: {
    display: 'flex',
    gap: '16px',
  },
  upcomingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
  },
  upcomingStage: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  upcomingName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  upcomingTime: {
    fontSize: '13px',
    color: '#666',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    padding: '16px 20px',
    margin: 0,
    borderBottom: '1px solid #eee',
    fontSize: '16px',
    fontWeight: 600,
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderRadius: '6px',
    fontSize: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    flex: 1,
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  availabilityCheck: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    marginTop: '8px',
  },
  freeSlotTag: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  freeSlotsResult: {
    marginTop: '8px',
  },
  freeSlotCard: {
    padding: '10px 16px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
};
