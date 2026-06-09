import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { stageLabels, stageColors, recommendationLabels, recommendationColors, timelineTypeLabels, timelineTypeColors, nextActionTypeLabels, nextActionTypeColors } from '../utils/constants';
import { InterviewEvaluation, CandidateStatus, InterviewStage, NextActionType } from '../types';

export default function Evaluation() {
  const {
    interviews, candidates, updateInterviewEvaluation,
    updateCandidateStatus, addCommunicationRecord,
    selectedInterview, setSelectedInterview, getInterviewsByCandidate,
    addTimelineEvent, addNextAction, getTimelineByCandidate, getNextActionsByCandidate,
    updateNextAction, completeNextAction, getPendingNextActions,
    setActiveTab, setSelectedCandidateForDetail, setNotificationDraft, setScheduleDraft,
  } = useStore();

  const normalizeSalary = (salary: string | undefined): string => {
    if (!salary) return '';
    const s = String(salary).trim();
    if (!s) return '';
    if (s.toLowerCase().includes('k')) {
      return s;
    }
    const numMatch = s.match(/\d+(\.\d+)?/);
    if (numMatch) {
      return `${numMatch[0]}K`;
    }
    return s;
  };

  const formatSalaryDisplay = (salary: string | undefined): string => {
    const normalized = normalizeSalary(salary);
    if (!normalized) return '';
    if (normalized.toLowerCase().includes('k')) {
      return normalized;
    }
    return `${normalized}K`;
  };

  const [showModal, setShowModal] = useState(false);
  const [evaluation, setEvaluation] = useState<Partial<InterviewEvaluation>>({
    overallScore: 7,
    technicalSkills: 7,
    communication: 7,
    teamwork: 7,
    problemSolving: 7,
    comments: '',
    strengths: [],
    weaknesses: [],
    suggestedSalary: '',
    recommendation: 'hire',
  });
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showTodoPanel, setShowTodoPanel] = useState(true);

  const pendingInterviews = interviews.filter((i) => i.status === 'completed' && !i.evaluation);
  const completedInterviews = interviews.filter((i) => i.evaluation);

  const displayInterviews = filterStatus === 'all'
    ? interviews.filter((i) => i.status !== 'cancelled')
    : filterStatus === 'pending'
      ? pendingInterviews
      : completedInterviews;

  const handleEvaluate = (interview: any) => {
    setSelectedInterview(interview);
    const candidate = candidates.find((c) => c.id === interview.candidateId);
    let defaultSalary = '';
    if (candidate?.expectedSalary) {
      const salaryNum = candidate.expectedSalary.split('-')[0].replace(/[^0-9.]/g, '');
      if (salaryNum) {
        defaultSalary = `${salaryNum}K`;
      }
    }
    setEvaluation({
      overallScore: 7,
      technicalSkills: 7,
      communication: 7,
      teamwork: 7,
      problemSolving: 7,
      comments: '',
      strengths: [],
      weaknesses: [],
      suggestedSalary: defaultSalary,
      recommendation: 'hire',
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (selectedInterview && !showModal) {
      handleEvaluate(selectedInterview);
    }
  }, [selectedInterview]);

  const handleAddStrength = () => {
    if (strengthInput.trim() && !evaluation.strengths?.includes(strengthInput.trim())) {
      setEvaluation({ ...evaluation, strengths: [...(evaluation.strengths || []), strengthInput.trim()] });
      setStrengthInput('');
    }
  };

  const handleAddWeakness = () => {
    if (weaknessInput.trim() && !evaluation.weaknesses?.includes(weaknessInput.trim())) {
      setEvaluation({ ...evaluation, weaknesses: [...(evaluation.weaknesses || []), weaknessInput.trim()] });
      setWeaknessInput('');
    }
  };

  const handleRemoveStrength = (index: number) => {
    setEvaluation({
      ...evaluation,
      strengths: evaluation.strengths?.filter((_, i) => i !== index),
    });
  };

  const handleRemoveWeakness = (index: number) => {
    setEvaluation({
      ...evaluation,
      weaknesses: evaluation.weaknesses?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!selectedInterview) return;

    if (!evaluation.comments?.trim()) {
      alert('请填写面试评价');
      return;
    }

    const normalizedSalary = normalizeSalary(evaluation.suggestedSalary);

    const fullEvaluation: InterviewEvaluation = {
      overallScore: evaluation.overallScore || 0,
      technicalSkills: evaluation.technicalSkills || 0,
      communication: evaluation.communication || 0,
      teamwork: evaluation.teamwork || 0,
      problemSolving: evaluation.problemSolving || 0,
      comments: evaluation.comments || '',
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      suggestedSalary: normalizedSalary,
      recommendation: evaluation.recommendation as any,
      completedAt: new Date().toISOString().replace('T', ' ').substr(0, 16),
    };

    updateInterviewEvaluation(selectedInterview.id, fullEvaluation);

    let newStatus: CandidateStatus = 'interviewing';
    let newStage: InterviewStage = selectedInterview.stage;

    if (evaluation.recommendation === 'strong_hire' || evaluation.recommendation === 'hire') {
      const stages: InterviewStage[] = ['resume_screen', 'phone_interview', 'tech_interview', 'hr_interview', 'final_interview', 'offer'];
      const currentIndex = stages.indexOf(selectedInterview.stage);
      if (currentIndex < stages.length - 1) {
        newStage = stages[currentIndex + 1];
        newStatus = 'interviewing';
      } else {
        newStatus = 'passed';
        newStage = 'offer';
      }
    } else if (evaluation.recommendation === 'no_hire') {
      newStatus = 'rejected';
    } else if (evaluation.recommendation === 'borderline') {
      newStatus = 'interviewing';
    }

    updateCandidateStatus(selectedInterview.candidateId, newStatus, newStage);

    const candidate = candidates.find((c) => c.id === selectedInterview.candidateId);
    const salaryText = normalizedSalary ? `，建议薪资：${normalizedSalary}` : '';
    const stageText = newStatus === 'passed' ? '，进入Offer阶段' :
      newStatus === 'rejected' ? '，已淘汰' :
      newStage !== selectedInterview.stage ? `，进入下一阶段：${stageLabels[newStage]}` : '';

    const now = new Date().toISOString().replace('T', ' ').substr(0, 16);

    addCommunicationRecord({
      candidateId: selectedInterview.candidateId,
      type: 'note',
      content: `【${stageLabels[selectedInterview.stage]}】面试完成。评分：${evaluation.overallScore}/10（技术${evaluation.technicalSkills}，沟通${evaluation.communication}，协作${evaluation.teamwork}，问题解决${evaluation.problemSolving}）。建议：${recommendationLabels[evaluation.recommendation || 'hire']}${salaryText}${stageText}。评价：${evaluation.comments}`,
      createdAt: now,
      createdBy: '招聘负责人',
    });

    addTimelineEvent({
      candidateId: selectedInterview.candidateId,
      type: 'evaluation',
      title: `${stageLabels[selectedInterview.stage]}面试评价完成`,
      content: `评分：${evaluation.overallScore}/10，建议：${recommendationLabels[evaluation.recommendation || 'hire']}${salaryText}`,
      createdAt: now,
      createdBy: '招聘负责人',
      metadata: {
        stage: selectedInterview.stage,
        score: evaluation.overallScore,
        recommendation: evaluation.recommendation,
      },
    });

    if (newStatus === 'rejected') {
      addCommunicationRecord({
        candidateId: selectedInterview.candidateId,
        type: 'note',
        content: `候选人已淘汰。原因：${evaluation.weaknesses?.join('、') || '综合评估未通过'}`,
        createdAt: now,
        createdBy: '招聘负责人',
      });
      addTimelineEvent({
        candidateId: selectedInterview.candidateId,
        type: 'rejection',
        title: '候选人已淘汰',
        content: `原因：${evaluation.weaknesses?.join('、') || '综合评估未通过'}`,
        createdAt: now,
        createdBy: '招聘负责人',
      });
      addNextAction({
        candidateId: selectedInterview.candidateId,
        type: 'send_rejection',
        title: '发送淘汰通知',
        description: `向${candidate?.name || selectedInterview.candidateName}发送淘汰通知邮件/短信`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
        createdBy: '招聘负责人',
      });
    } else if (newStatus === 'passed' || newStage === 'offer') {
      addTimelineEvent({
        candidateId: selectedInterview.candidateId,
        type: 'stage_change',
        title: '进入Offer阶段',
        content: '面试通过，准备发放Offer',
        createdAt: now,
        createdBy: '招聘负责人',
        metadata: { newStage: 'offer' },
      });
      addNextAction({
        candidateId: selectedInterview.candidateId,
        type: 'send_offer',
        title: '发送Offer',
        description: `向${candidate?.name || selectedInterview.candidateName}发送Offer，建议薪资：${normalizedSalary}`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        status: 'pending',
        createdBy: '招聘负责人',
      });
    } else if (newStage !== selectedInterview.stage) {
      addTimelineEvent({
        candidateId: selectedInterview.candidateId,
        type: 'stage_change',
        title: '进入下一阶段',
        content: `从${stageLabels[selectedInterview.stage]}进入${stageLabels[newStage]}`,
        createdAt: now,
        createdBy: '招聘负责人',
        metadata: { oldStage: selectedInterview.stage, newStage },
      });
      addNextAction({
        candidateId: selectedInterview.candidateId,
        type: 'schedule_interview',
        title: `安排${stageLabels[newStage]}面试`,
        description: `与面试官协调时间，为${candidate?.name || selectedInterview.candidateName}安排${stageLabels[newStage]}`,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        status: 'pending',
        createdBy: '招聘负责人',
      });
    } else if (evaluation.recommendation === 'borderline') {
      addNextAction({
        candidateId: selectedInterview.candidateId,
        type: 'review',
        title: '重新评估候选人',
        description: `${candidate?.name || selectedInterview.candidateName}评估结果为待定，需要进一步讨论`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
        createdBy: '招聘负责人',
      });
    }

    setShowModal(false);
    setSelectedInterview(null);
    alert('评价已保存，已自动生成下一步动作');
  };

  const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={styles.scoreItem}>
      <div style={styles.scoreItemLabel}>
        <span>{label}</span>
        <span style={styles.scoreValue}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={styles.slider}
      />
    </div>
  );

  const pendingNextActions = getPendingNextActions();

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <h2 style={styles.title}>评价记录</h2>
          <span style={styles.countBadge}>待评价 {pendingInterviews.length} 场</span>
          {pendingNextActions.length > 0 && (
            <span style={{ ...styles.countBadge, backgroundColor: '#fff3e0', color: '#f57c00' }}>
              待办 {pendingNextActions.length} 项
            </span>
          )}
        </div>
        <div style={styles.toolbarRight}>
          <button
            style={{
              ...styles.secondaryBtn,
              ...(showTodoPanel ? { backgroundColor: '#e3f2fd', color: '#1976d2' } : {}),
            }}
            onClick={() => setShowTodoPanel(!showTodoPanel)}
          >
            {showTodoPanel ? '隐藏待办' : '显示待办'}
          </button>
        </div>
        <div style={styles.filterTabs}>
          {[
            { key: 'pending', label: '待评价', count: pendingInterviews.length },
            { key: 'completed', label: '已评价', count: completedInterviews.length },
            { key: 'all', label: '全部', count: interviews.filter(i => i.status !== 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tabBtn,
                ...(filterStatus === tab.key ? styles.tabBtnActive : {}),
              }}
              onClick={() => setFilterStatus(tab.key as any)}
            >
              {tab.label}
              <span style={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {showTodoPanel && pendingNextActions.length > 0 && (
        <div style={styles.todoPanel}>
          <div style={styles.todoPanelHeader}>
            <h4 style={styles.todoPanelTitle}>📋 待办事项</h4>
            <span style={{ fontSize: '12px', color: '#999' }}>
              由评价结果自动生成
            </span>
          </div>
          <div style={styles.todoList}>
            {pendingNextActions.map((action) => {
              const candidate = candidates.find((c) => c.id === action.candidateId);
              const isOverdue = new Date(action.dueDate) < new Date() && action.status === 'pending';
              const typeColor = nextActionTypeColors[action.type] || '#999';
              return (
                <div key={action.id} style={{
                  ...styles.todoItem,
                  ...(isOverdue ? styles.todoItemOverdue : {}),
                }}>
                  <div style={styles.todoItemMain}>
                    <div style={styles.todoItemHeader}>
                      <span style={{
                        ...styles.todoTypeBadge,
                        backgroundColor: typeColor + '20',
                        color: typeColor,
                      }}>
                        {nextActionTypeLabels[action.type]}
                      </span>
                      <span style={{
                        ...styles.priorityBadge,
                        backgroundColor: action.priority === 'high' ? '#ffebee' : '#fff3e0',
                        color: action.priority === 'high' ? '#f44336' : '#f57c00',
                      }}>
                        {action.priority === 'high' ? '高优先级' : action.priority === 'low' ? '低优先级' : '中优先级'}
                      </span>
                    </div>
                    <div style={styles.todoItemTitle}>
                      {candidate?.name || '未知候选人'} - {action.title}
                    </div>
                    <div style={styles.todoItemDesc}>{action.description}</div>
                    <div style={styles.todoItemMeta}>
                      <span style={{ color: isOverdue ? '#f44336' : '#999' }}>
                        📅 截止：{action.dueDate}
                      </span>
                      <span style={{ color: '#999' }}>👤 {action.createdBy}</span>
                    </div>
                  </div>
                  <div style={styles.todoItemActions}>
                    <button
                      style={styles.todoCompleteBtn}
                      onClick={() => {
                        completeNextAction(action.id);
                        addTimelineEvent({
                          candidateId: action.candidateId,
                          type: 'next_action',
                          title: '待办已完成',
                          content: action.title,
                          createdAt: new Date().toISOString().replace('T', ' ').substr(0, 16),
                          createdBy: '招聘负责人',
                        });
                        alert('已标记为完成');
                      }}
                    >
                      ✓ 完成
                    </button>
                    {(action.type === 'send_offer' || action.type === 'send_rejection') && (
                      <button
                        style={{ ...styles.todoActionBtn, background: '#4caf50' }}
                        onClick={() => {
                          if (candidate) {
                            const templateType = action.type === 'send_offer' ? 'offer' : 'rejection';
                            setNotificationDraft({ candidateId: candidate.id, templateType });
                            setActiveTab('notifications');
                          }
                        }}
                      >
                        ✉️ 生成通知
                      </button>
                    )}
                    {action.type === 'schedule_interview' && (
                      <button
                        style={{ ...styles.todoActionBtn, background: '#2196f3' }}
                        onClick={() => {
                          if (candidate) {
                            const stage = action.description.includes('电话面试') ? 'phone_interview'
                              : action.description.includes('技术面试') ? 'tech_interview'
                              : action.description.includes('HR面试') ? 'hr_interview'
                              : action.description.includes('终面') ? 'final_interview'
                              : 'tech_interview';
                            setScheduleDraft({ candidateId: candidate.id, stage: stage as InterviewStage });
                            setActiveTab('schedule');
                          }
                        }}
                      >
                        📅 去排班
                      </button>
                    )}
                    <button
                      style={styles.todoViewBtn}
                      onClick={() => {
                        if (candidate) {
                          setSelectedCandidateForDetail(candidate.id);
                          setActiveTab('candidates');
                        }
                      }}
                    >
                      👁️ 查看候选人
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.listContainer}>
        {displayInterviews.length > 0 ? (
          <div style={styles.interviewList}>
            {displayInterviews.map((interview) => {
              const candidate = candidates.find((c) => c.id === interview.candidateId);
              const hasEvaluation = !!interview.evaluation;

              return (
                <div key={interview.id} style={styles.interviewCard}>
                  <div style={styles.cardHeader}>
                    <div style={styles.candidateInfo}>
                      <div style={styles.avatar}>{interview.candidateName.charAt(0)}</div>
                      <div>
                        <div style={styles.candidateName}>{interview.candidateName}</div>
                        <div style={styles.candidatePosition}>
                          {interview.position} · {interview.interviewer}
                        </div>
                      </div>
                    </div>
                    <div style={styles.stageBadgeWrap}>
                      <span style={{
                        ...styles.stageBadge,
                        backgroundColor: stageColors[interview.stage] + '20',
                        color: stageColors[interview.stage],
                      }}>
                        {stageLabels[interview.stage]}
                      </span>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.interviewMeta}>
                      <span style={styles.metaItem}>📅 {interview.date}</span>
                      <span style={styles.metaItem}>⏰ {interview.startTime} - {interview.endTime}</span>
                      <span style={styles.metaItem}>📍 {interview.location}</span>
                    </div>

                    {interview.remarks && (
                      <div style={styles.remarksBox}>
                        📝 {interview.remarks}
                      </div>
                    )}

                    {hasEvaluation && interview.evaluation ? (
                      <div style={styles.evaluationPreview}>
                        <div style={styles.evaluationHeader}>
                          <div style={styles.overallScore}>
                            <span style={styles.scoreNumber}>{interview.evaluation.overallScore}</span>
                            <span style={styles.scoreLabel}>/10</span>
                          </div>
                          <span style={{
                            ...styles.recommendationBadge,
                            backgroundColor: recommendationColors[interview.evaluation.recommendation] + '20',
                            color: recommendationColors[interview.evaluation.recommendation],
                          }}>
                            {recommendationLabels[interview.evaluation.recommendation]}
                          </span>
                        </div>
                        {interview.evaluation.suggestedSalary && (
                          <div style={styles.salarySuggestion}>
                            💡 建议薪资：{formatSalaryDisplay(interview.evaluation.suggestedSalary)}
                          </div>
                        )}
                        <p style={styles.commentsPreview}>{interview.evaluation.comments}</p>
                        <div style={styles.tagsRow}>
                          {interview.evaluation.strengths.map((s, i) => (
                            <span key={i} style={styles.strengthTag}>+ {s}</span>
                          ))}
                          {interview.evaluation.weaknesses.map((w, i) => (
                            <span key={i} style={styles.weaknessTag}>- {w}</span>
                          ))}
                        </div>
                        <div style={styles.evaluationFooter}>
                          <button style={styles.viewDetailBtn} onClick={() => {
                            setSelectedInterview(interview);
                            setEvaluation(interview.evaluation || {});
                            setShowModal(true);
                          }}>
                            查看详情
                          </button>
                          <span style={styles.evaluationTime}>
                            评价于 {interview.evaluation.completedAt}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.pendingEvaluation}>
                        <div style={styles.pendingText}>⏳ 等待面试评价</div>
                        <button
                          style={styles.evaluateBtn}
                          onClick={() => handleEvaluate(interview)}
                        >
                          立即评价
                        </button>
                      </div>
                    )}
                  </div>

                  {candidate && (
                    <div style={styles.cardFooter}>
                      <div style={styles.candidateStats}>
                        <span>学历：{candidate.education}</span>
                        <span>经验：{candidate.workExperience}年</span>
                        <span>期望薪资：{candidate.expectedSalary}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div>暂无{filterStatus === 'pending' ? '待评价' : filterStatus === 'completed' ? '已评价' : ''}面试记录</div>
          </div>
        )}
      </div>

      {showModal && selectedInterview && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '700px' }}>
            <h3 style={styles.modalTitle}>
              {selectedInterview.evaluation ? '查看评价详情' : '面试评价'} - {selectedInterview.candidateName}
            </h3>
            <div style={styles.modalBody}>
              <div style={styles.evaluationInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>候选人：</span>
                  <span>{selectedInterview.candidateName}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>面试岗位：</span>
                  <span>{selectedInterview.position}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>面试阶段：</span>
                  <span style={{
                    ...styles.stageBadge,
                    backgroundColor: stageColors[selectedInterview.stage] + '20',
                    color: stageColors[selectedInterview.stage],
                  }}>
                    {stageLabels[selectedInterview.stage]}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>面试官：</span>
                  <span>{selectedInterview.interviewer}</span>
                </div>
              </div>

              <div style={styles.scoresSection}>
                <h4 style={styles.sectionTitle}>能力评分（1-10分）</h4>
                <div style={styles.scoresGrid}>
                  <ScoreSlider
                    label="综合评分"
                    value={evaluation.overallScore || 7}
                    onChange={(v) => setEvaluation({ ...evaluation, overallScore: v })}
                  />
                  <ScoreSlider
                    label="技术能力"
                    value={evaluation.technicalSkills || 7}
                    onChange={(v) => setEvaluation({ ...evaluation, technicalSkills: v })}
                  />
                  <ScoreSlider
                    label="沟通能力"
                    value={evaluation.communication || 7}
                    onChange={(v) => setEvaluation({ ...evaluation, communication: v })}
                  />
                  <ScoreSlider
                    label="团队协作"
                    value={evaluation.teamwork || 7}
                    onChange={(v) => setEvaluation({ ...evaluation, teamwork: v })}
                  />
                  <ScoreSlider
                    label="问题解决"
                    value={evaluation.problemSolving || 7}
                    onChange={(v) => setEvaluation({ ...evaluation, problemSolving: v })}
                  />
                </div>
              </div>

              <div style={styles.strengthsSection}>
                <h4 style={styles.sectionTitle}>优势</h4>
                <div style={styles.inputWithBtn}>
                  <input
                    style={styles.tagInput}
                    placeholder="输入候选人优势..."
                    value={strengthInput}
                    onChange={(e) => setStrengthInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStrength()}
                  />
                  <button style={styles.addTagBtn} onClick={handleAddStrength}>添加</button>
                </div>
                <div style={styles.tagsContainer}>
                  {evaluation.strengths?.map((s, i) => (
                    <span key={i} style={styles.strengthTag}>
                      {s}
                      <span style={styles.removeTag} onClick={() => handleRemoveStrength(i)}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              <div style={styles.weaknessesSection}>
                <h4 style={styles.sectionTitle}>待改进</h4>
                <div style={styles.inputWithBtn}>
                  <input
                    style={styles.tagInput}
                    placeholder="输入待改进方面..."
                    value={weaknessInput}
                    onChange={(e) => setWeaknessInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddWeakness()}
                  />
                  <button style={styles.addTagBtn} onClick={handleAddWeakness}>添加</button>
                </div>
                <div style={styles.tagsContainer}>
                  {evaluation.weaknesses?.map((w, i) => (
                    <span key={i} style={styles.weaknessTag}>
                      {w}
                      <span style={styles.removeTag} onClick={() => handleRemoveWeakness(i)}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              <div style={styles.commentsSection}>
                <h4 style={styles.sectionTitle}>面试评价 *</h4>
                <textarea
                  style={styles.textarea}
                  rows={5}
                  placeholder="请详细描述候选人的面试表现、技术水平、沟通能力等..."
                  value={evaluation.comments || ''}
                  onChange={(e) => setEvaluation({ ...evaluation, comments: e.target.value })}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>建议薪资（K）</label>
                  <input
                    style={styles.input}
                    placeholder="如：25"
                    value={evaluation.suggestedSalary || ''}
                    onChange={(e) => setEvaluation({ ...evaluation, suggestedSalary: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>录用建议 *</label>
                  <select
                    style={styles.input}
                    value={evaluation.recommendation || 'hire'}
                    onChange={(e) => setEvaluation({ ...evaluation, recommendation: e.target.value as any })}
                  >
                    {Object.entries(recommendationLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setSelectedInterview(null); }}>
                {selectedInterview.evaluation ? '关闭' : '取消'}
              </button>
              {!selectedInterview.evaluation && (
                <button style={styles.primaryBtn} onClick={handleSubmit}>
                  提交评价
                </button>
              )}
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
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    borderRadius: '12px',
    fontSize: '13px',
  },
  filterTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#fff',
    padding: '4px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tabBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#666',
    borderRadius: '6px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tabBtnActive: {
    backgroundColor: '#2196f3',
    color: '#fff',
  },
  tabCount: {
    padding: '2px 8px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: '10px',
    fontSize: '12px',
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
  },
  interviewList: {
    display: 'grid',
    gap: '16px',
  },
  interviewCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#2196f3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 500,
  },
  candidateName: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '2px',
  },
  candidatePosition: {
    fontSize: '13px',
    color: '#666',
  },
  stageBadgeWrap: {
    display: 'flex',
    gap: '8px',
  },
  stageBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  cardBody: {
    padding: '16px',
  },
  interviewMeta: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#666',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  evaluationPreview: {
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    padding: '16px',
  },
  evaluationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  overallScore: {
    display: 'flex',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2196f3',
  },
  scoreLabel: {
    fontSize: '16px',
    color: '#999',
    marginLeft: '4px',
  },
  recommendationBadge: {
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
  },
  salarySuggestion: {
    padding: '8px 12px',
    backgroundColor: '#fff8e1',
    color: '#f57c00',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  commentsPreview: {
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '12px',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  strengthTag: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '4px',
    fontSize: '12px',
  },
  weaknessTag: {
    padding: '4px 10px',
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    borderRadius: '4px',
    fontSize: '12px',
  },
  evaluationFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '12px',
  },
  viewDetailBtn: {
    padding: '6px 14px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '6px',
    fontSize: '13px',
  },
  evaluationTime: {
    fontSize: '12px',
    color: '#999',
  },
  pendingEvaluation: {
    backgroundColor: '#fff8e1',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingText: {
    color: '#f57c00',
    fontSize: '14px',
  },
  evaluateBtn: {
    padding: '10px 24px',
    backgroundColor: '#f57c00',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  cardFooter: {
    padding: '12px 16px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #f0f0f0',
  },
  candidateStats: {
    display: 'flex',
    gap: '24px',
    fontSize: '13px',
    color: '#666',
  },
  emptyState: {
    padding: '80px',
    textAlign: 'center',
    color: '#999',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
    maxHeight: '90vh',
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
  primaryBtn: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  evaluationInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },
  infoLabel: {
    width: '80px',
    color: '#666',
  },
  scoresSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  scoresGrid: {
    display: 'grid',
    gap: '16px',
  },
  scoreItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  scoreItemLabel: {
    width: '100px',
    fontSize: '14px',
    color: '#333',
  },
  scoreValue: {
    width: '30px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: '#2196f3',
  },
  slider: {
    flex: 1,
    height: '6px',
    cursor: 'pointer',
  },
  strengthsSection: {
    marginBottom: '16px',
  },
  weaknessesSection: {
    marginBottom: '16px',
  },
  inputWithBtn: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  tagInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  addTagBtn: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  removeTag: {
    marginLeft: '6px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  commentsSection: {
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
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
  remarksBox: {
    padding: '8px 10px',
    backgroundColor: '#fff8e1',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#795548',
    marginBottom: '12px',
    lineHeight: 1.5,
  },
  todoPanel: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  todoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #eee',
  },
  todoPanelTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
  },
  todoList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  todoItem: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s',
  },
  todoItemOverdue: {
    backgroundColor: '#ffebee30',
  },
  todoItemMain: {
    flex: 1,
  },
  todoItemHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
    alignItems: 'center',
  },
  todoTypeBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  todoItemTitle: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
    color: '#333',
  },
  todoItemDesc: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
    lineHeight: 1.5,
  },
  todoItemMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '11px',
  },
  todoItemActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    justifyContent: 'center',
  },
  todoCompleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
  },
  todoActionBtn: {
    padding: '6px 12px',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
  },
  todoViewBtn: {
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
  },
};
