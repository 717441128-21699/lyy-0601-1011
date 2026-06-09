import { useState } from 'react';
import { useStore } from '../store/useStore';
import { NotificationTemplate, NotificationRecord, Candidate, Interview } from '../types';

const typeLabels: Record<string, string> = {
  interview_invite: '面试邀请',
  reminder: '面试提醒',
  rejection: '未通过通知',
  offer: '录用通知',
  feedback: '面试反馈',
};

const typeColors: Record<string, string> = {
  interview_invite: '#2196f3',
  reminder: '#ff9800',
  rejection: '#f44336',
  offer: '#4caf50',
  feedback: '#9c27b0',
};

const channelLabels: Record<string, string> = {
  email: '邮件',
  sms: '短信',
  system: '系统通知',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  sent: '已发送',
  failed: '发送失败',
};

export default function Notifications() {
  const {
    templates, candidates, interviews, notificationRecords, communicationRecords,
    addTemplate, updateTemplate, deleteTemplate, addNotificationRecord,
    searchCommunications,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'templates' | 'generate' | 'history' | 'search'>('templates');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [selectedType, setSelectedType] = useState<string>('interview_invite');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedSubject, setGeneratedSubject] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState({ name: 'XX科技', phone: '400-888-8888', email: 'hr@company.com' });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const templateTypeOptions = [
    { value: 'interview_invite', label: '面试邀请' },
    { value: 'reminder', label: '面试提醒' },
    { value: 'rejection', label: '未通过通知' },
    { value: 'offer', label: '录用通知' },
    { value: 'feedback', label: '面试反馈' },
  ];

  const filteredTemplates = selectedType
    ? templates.filter((t) => t.type === selectedType)
    : templates;

  const handleNewTemplate = () => {
    setEditingTemplate({
      name: '',
      type: 'interview_invite',
      subject: '',
      content: '',
      variables: [],
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.content) {
      alert('请填写完整的模板信息');
      return;
    }

    const variables = editingTemplate.content?.match(/\{([^}]+)\}/g)?.map((v) => v.slice(1, -1)) || [];

    if (isEditing && editingTemplate.id) {
      updateTemplate(editingTemplate.id, {
        ...editingTemplate,
        variables,
      });
    } else {
      addTemplate({
        name: editingTemplate.name!,
        type: editingTemplate.type as any,
        subject: editingTemplate.subject!,
        content: editingTemplate.content!,
        variables,
      });
    }

    setShowModal(false);
    setEditingTemplate({});
  };

  const handleGenerateNotifications = () => {
    if (!selectedTemplateId || selectedCandidates.length === 0) {
      alert('请选择模板和候选人');
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    setGeneratedContent(template.content);
    setGeneratedSubject(template.subject);

    const interview = selectedInterview
      ? interviews.find((i) => i.id === selectedInterview)
      : null;

    const candidate = selectedCandidates.length === 1
      ? candidates.find((c) => c.id === selectedCandidates[0])
      : null;

    let content = template.content;
    let subject = template.subject;

    const replacements: Record<string, string> = {
      '公司名': companyInfo.name,
      '联系电话': companyInfo.phone,
      '联系邮箱': companyInfo.email,
      '候选人姓名': candidate?.name || '{候选人姓名}',
      '岗位名称': candidate?.position || '{岗位名称}',
      '面试日期': interview?.date || '{面试日期}',
      '开始时间': interview?.startTime || '{开始时间}',
      '结束时间': interview?.endTime || '{结束时间}',
      '面试形式': interview?.type === 'onsite' ? '现场面试' : interview?.type === 'online' ? '视频面试' : '电话面试' || '{面试形式}',
      '面试地点': interview?.location || '{面试地点}',
      '面试官姓名': interview?.interviewer || '{面试官姓名}',
      '面试时间': interview ? `${interview.date} ${interview.startTime}` : '{面试时间}',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replaceAll(`{${key}}`, value);
      subject = subject.replaceAll(`{${key}}`, value);
    });

    setGeneratedContent(content);
    setGeneratedSubject(subject);
  };

  const handleSendNotifications = () => {
    if (selectedCandidates.length === 0) {
      alert('请选择要发送的候选人');
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const now = new Date().toISOString().replace('T', ' ').substr(0, 16);

    selectedCandidates.forEach((candidateId) => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      let content = generatedContent;
      let subject = generatedSubject;

      content = content.replaceAll('{候选人姓名}', candidate.name);
      content = content.replaceAll('{岗位名称}', candidate.position);
      subject = subject.replaceAll('{候选人姓名}', candidate.name);
      subject = subject.replaceAll('{岗位名称}', candidate.position);

      addNotificationRecord({
        candidateId: candidate.id,
        candidateName: candidate.name,
        templateId: template.id,
        templateName: template.name,
        type: template.type,
        subject,
        content,
        sentAt: now,
        status: 'sent',
        channel: 'email',
      });
    });

    alert(`已生成 ${selectedCandidates.length} 条通知记录`);
    setSelectedCandidates([]);
    setGeneratedContent('');
    setGeneratedSubject('');
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    const commResults = searchCommunications(searchKeyword);
    const notificationResults = notificationRecords.filter(
      (n) =>
        n.subject.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        n.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        n.candidateName.includes(searchKeyword)
    );

    setSearchResults([
      ...commResults.map((c) => ({ ...c, _type: 'communication' })),
      ...notificationResults.map((n) => ({ ...n, _type: 'notification' })),
    ]);
  };

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const toggleSelectAll = () => {
    const availableCandidates = candidates.filter((c) => c.status !== 'rejected');
    if (selectedCandidates.length === availableCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(availableCandidates.map((c) => c.id));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <h2 style={styles.title}>通知模板</h2>
        <div style={styles.tabs}>
          {[
            { key: 'templates', label: '模板管理' },
            { key: 'generate', label: '批量生成' },
            { key: 'history', label: '发送记录' },
            { key: 'search', label: '沟通搜索' },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.key ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'templates' && (
        <div style={styles.content}>
          <div style={styles.subToolbar}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>类型筛选：</span>
              <select
                style={styles.select}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">全部类型</option>
                {templateTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button style={styles.primaryBtn} onClick={handleNewTemplate}>
              ➕ 新建模板
            </button>
          </div>

          <div style={styles.templatesGrid}>
            {filteredTemplates.map((template) => (
              <div key={template.id} style={styles.templateCard}>
                <div style={styles.templateHeader}>
                  <div style={styles.templateTitleRow}>
                    <h3 style={styles.templateName}>{template.name}</h3>
                    <span style={{
                      ...styles.typeBadge,
                      backgroundColor: typeColors[template.type] + '20',
                      color: typeColors[template.type],
                    }}>
                      {typeLabels[template.type]}
                    </span>
                  </div>
                  <div style={styles.templateSubject}>📝 {template.subject}</div>
                </div>
                <div style={styles.templatePreview}>
                  {template.content.substring(0, 100)}...
                </div>
                <div style={styles.templateFooter}>
                  <div style={styles.variables}>
                    变量：{template.variables.slice(0, 5).map((v, i) => (
                      <span key={i} style={styles.varTag}>{v}</span>
                    ))}
                    {template.variables.length > 5 && <span>+{template.variables.length - 5}</span>}
                  </div>
                  <div style={styles.templateActions}>
                    <button style={styles.actionBtn} onClick={() => handleEditTemplate(template)}>编辑</button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => {
                        if (confirm('确定要删除此模板吗？')) {
                          deleteTemplate(template.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <div style={styles.generateContent}>
          <div style={styles.generateLeft}>
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>选择模板</h4>
              <select
                style={styles.fullSelect}
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">请选择通知模板</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({typeLabels[t.type]})</option>
                ))}
              </select>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>公司信息</h4>
              <div style={styles.formRow}>
                <input
                  style={styles.halfInput}
                  placeholder="公司名称"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                />
                <input
                  style={styles.halfInput}
                  placeholder="联系电话"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                />
              </div>
              <input
                style={styles.fullInput}
                placeholder="联系邮箱"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
              />
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>关联面试（可选）</h4>
              <select
                style={styles.fullSelect}
                value={selectedInterview}
                onChange={(e) => setSelectedInterview(e.target.value)}
              >
                <option value="">不关联</option>
                {interviews.filter(i => i.status === 'scheduled').map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.candidateName} - {i.date} {i.startTime}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h4 style={styles.sectionTitle}>选择候选人</h4>
                <button style={styles.selectAllBtn} onClick={toggleSelectAll}>
                  {selectedCandidates.length === candidates.filter(c => c.status !== 'rejected').length ? '取消全选' : '全选'}
                </button>
              </div>
              <div style={styles.candidatesList}>
                {candidates.filter(c => c.status !== 'rejected').map((candidate) => (
                  <label key={candidate.id} style={styles.candidateCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                    />
                    <span style={styles.checkboxLabel}>
                      {candidate.name} - {candidate.position}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button style={styles.generateBtn} onClick={handleGenerateNotifications}>
              预览通知内容
            </button>
          </div>

          <div style={styles.generateRight}>
            <h4 style={styles.sectionTitle}>预览</h4>
            {generatedContent ? (
              <div style={styles.previewContainer}>
                <div style={styles.previewSubject}>
                  <strong>主题：</strong>{generatedSubject}
                </div>
                <div style={styles.previewContent}>
                  <pre style={styles.previewText}>{generatedContent}</pre>
                </div>
                <div style={styles.selectedInfo}>
                  <strong>已选择 {selectedCandidates.length} 位候选人</strong>
                </div>
                <button style={styles.sendBtn} onClick={handleSendNotifications}>
                  ✉️ 批量生成通知记录
                </button>
              </div>
            ) : (
              <div style={styles.emptyPreview}>
                选择模板和候选人后，点击"预览通知内容"查看
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.content}>
          <div style={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>候选人</th>
                  <th>模板类型</th>
                  <th>模板名称</th>
                  <th>主题</th>
                  <th>发送时间</th>
                  <th>状态</th>
                  <th>渠道</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {notificationRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.candidateName}</td>
                    <td>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: typeColors[record.type] + '20',
                        color: typeColors[record.type],
                      }}>
                        {typeLabels[record.type]}
                      </span>
                    </td>
                    <td>{record.templateName}</td>
                    <td style={styles.subjectCell}>{record.subject}</td>
                    <td>{record.sentAt}</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: record.status === 'sent' ? '#e8f5e9' : record.status === 'failed' ? '#ffebee' : '#fff3e0',
                        color: record.status === 'sent' ? '#388e3c' : record.status === 'failed' ? '#d32f2f' : '#f57c00',
                      }}>
                        {statusLabels[record.status]}
                      </span>
                    </td>
                    <td>{channelLabels[record.channel]}</td>
                    <td>
                      <button style={styles.actionBtn}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div style={styles.content}>
          <div style={styles.searchBar}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="搜索沟通记录、通知内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button style={styles.searchBtn} onClick={handleSearch}>搜索</button>
          </div>

          <div style={styles.searchResults}>
            {searchResults.length > 0 ? (
              <div>
                <h4 style={styles.sectionTitle}>找到 {searchResults.length} 条记录</h4>
                {searchResults.map((result, idx) => (
                  <div key={idx} style={styles.searchResultItem}>
                    <div style={styles.resultHeader}>
                      <span style={{
                        ...styles.resultType,
                        backgroundColor: result._type === 'notification' ? '#e3f2fd' : '#f3e5f5',
                        color: result._type === 'notification' ? '#1976d2' : '#7b1fa2',
                      }}>
                        {result._type === 'notification' ? '通知记录' : '沟通记录'}
                      </span>
                      <span style={styles.resultTime}>{result.createdAt || result.sentAt}</span>
                    </div>
                    <div style={styles.resultTitle}>
                      {result._type === 'notification' ? result.subject : `${result.type === 'call' ? '电话' : result.type === 'email' ? '邮件' : result.type === 'meeting' ? '会议' : '备注'} - ${result.createdBy || '系统'}`}
                    </div>
                    <div style={styles.resultContent}>{result.content}</div>
                    {result._type === 'notification' && (
                      <div style={styles.resultMeta}>
                        收件人：{result.candidateName} · 模板：{result.templateName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchKeyword ? (
              <div style={styles.emptyState}>未找到相关记录</div>
            ) : (
              <div style={styles.emptyState}>输入关键词搜索沟通记录和通知历史</div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '650px' }}>
            <h3 style={styles.modalTitle}>{isEditing ? '编辑模板' : '新建模板'}</h3>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>模板名称 *</label>
                  <input
                    style={styles.input}
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="如：技术面试邀请"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>模板类型 *</label>
                  <select
                    style={styles.input}
                    value={editingTemplate.type || 'interview_invite'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value as any })}
                  >
                    {templateTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>邮件主题 *</label>
                <input
                  style={styles.input}
                  value={editingTemplate.subject || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="使用 {变量名} 作为占位符，如：{候选人姓名}"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>模板内容 *</label>
                <textarea
                  style={styles.textarea}
                  rows={12}
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder="使用 {变量名} 作为占位符&#10;可用变量：{公司名}、{候选人姓名}、{岗位名称}、{面试日期}、{开始时间}、{结束时间}、{面试形式}、{面试地点}、{面试官姓名}、{联系电话}、{联系邮箱}等"
                />
              </div>
              <div style={styles.varHint}>
                <strong>检测到的变量：</strong>
                {editingTemplate.content?.match(/\{([^}]+)\}/g)?.map((v, i) => (
                  <span key={i} style={styles.varTag}>{v}</span>
                )) || <span style={{ color: '#999' }}>暂无</span>}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setEditingTemplate({}); }}>取消</button>
              <button style={styles.primaryBtn} onClick={handleSaveTemplate}>{isEditing ? '保存' : '创建'}</button>
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
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  tabs: {
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
  },
  tabBtnActive: {
    backgroundColor: '#2196f3',
    color: '#fff',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  subToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    color: '#666',
  },
  select: {
    padding: '6px 12px',
    border: '1px solid #ddd',
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
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
  },
  templateHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  templateTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  templateName: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  templateSubject: {
    fontSize: '13px',
    color: '#666',
  },
  templatePreview: {
    padding: '16px',
    flex: 1,
    fontSize: '13px',
    color: '#555',
    lineHeight: 1.6,
  },
  templateFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variables: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    fontSize: '12px',
    color: '#999',
  },
  varTag: {
    padding: '2px 6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666',
  },
  templateActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '4px 10px',
    backgroundColor: '#f5f5f5',
    color: '#666',
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
  generateContent: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    minHeight: 0,
  },
  generateLeft: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
  },
  generateRight: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  fullSelect: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  fullInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  halfInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  selectAllBtn: {
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
  },
  candidatesList: {
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  candidateCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '13px',
  },
  generateBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
  },
  previewContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  previewSubject: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  previewContent: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '12px',
  },
  previewText: {
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  selectedInfo: {
    padding: '10px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  sendBtn: {
    padding: '12px',
    backgroundColor: '#4caf50',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 500,
  },
  emptyPreview: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '14px',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'auto',
  },
  subjectCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  searchBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  searchBtn: {
    padding: '10px 24px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  searchResultItem: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  resultType: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  resultTime: {
    fontSize: '12px',
    color: '#999',
  },
  resultTitle: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
  },
  resultContent: {
    fontSize: '13px',
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '8px',
  },
  resultMeta: {
    fontSize: '12px',
    color: '#999',
  },
  emptyState: {
    padding: '60px',
    textAlign: 'center',
    color: '#999',
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
  formGroup: {
    marginBottom: '16px',
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
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
  },
  varHint: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '13px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  },
};
