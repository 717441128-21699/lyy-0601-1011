import { useState } from 'react';
import { useStore } from '../store/useStore';
import { statusLabels, statusColors, stageLabels, stageColors, sourceOptions, educationOptions, departmentOptions } from '../utils/constants';
import { Candidate, CandidateStatus, InterviewStage } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function CandidateList() {
  const {
    candidates, positions, getFilteredCandidates, searchKeyword, setSearchKeyword,
    filterPosition, setFilterPosition, filterStatus, setFilterStatus,
    selectedCandidate, setSelectedCandidate, addCandidate, updateCandidate,
    updateCandidateStatus, deleteCandidate, importCandidates, getInterviewsByCandidate
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate>>({});
  const [isEditing, setIsEditing] = useState(false);

  const positionOptions = [...new Set(candidates.map((c) => c.position))];

  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    return String(phone)
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/\+86/g, '')
      .replace(/\(|\)/g, '')
      .trim();
  };

  const normalizeWorkExperience = (value: any): number => {
    if (!value && value !== 0) return 0;
    const str = String(value).trim();
    const numMatch = str.match(/\d+/);
    if (numMatch) {
      return parseInt(numMatch[0], 10);
    }
    if (str.includes('应届') || str.includes('毕业') || str.includes('0')) return 0;
    if (str.includes('一') || str.includes('1')) return 1;
    if (str.includes('二') || str.includes('两') || str.includes('2')) return 2;
    if (str.includes('三') || str.includes('3')) return 3;
    if (str.includes('四') || str.includes('4')) return 4;
    if (str.includes('五') || str.includes('5')) return 5;
    return 0;
  };

  const normalizeSkills = (value: any): string[] => {
    if (!value) return [];
    const str = String(value).trim();
    if (!str) return [];
    return str
      .split(/[,，;；、\s/\|]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  const normalizeTags = (value: any): string[] => {
    if (!value) return [];
    const str = String(value).trim();
    if (!str) return [];
    return str
      .split(/[,，;；、\s/\|]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  const normalizeDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    const str = String(value).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    if (str.includes('-') && str.length >= 8) {
      return str;
    }
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {}
    return new Date().toISOString().split('T')[0];
  };

  const normalizeEmail = (email: string): string => {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  };

  const getFieldValue = (row: any, fieldNames: string[]): string => {
    for (const name of fieldNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }
    return '';
  };

  const parseCandidateRow = (row: any): Omit<Candidate, 'id'> | null => {
    const name = getFieldValue(row, ['name', '姓名', 'Name', 'NAME', '名字', '候选人姓名']);
    const phone = normalizePhone(getFieldValue(row, ['phone', '电话', '手机号码', '手机号', '手机', 'Tel', 'tel', 'Phone', 'PHONE', '联系电话']));
    const email = normalizeEmail(getFieldValue(row, ['email', '邮箱', '电子邮箱', '邮件', 'Email', 'EMAIL', 'e-mail']));
    const position = getFieldValue(row, ['position', '岗位', '应聘岗位', '职位', '申请职位', 'Position', 'POSITION']);
    const department = getFieldValue(row, ['department', '部门', 'Department', 'DEPARTMENT', '所属部门']) || '技术部';
    const education = getFieldValue(row, ['education', '学历', '最高学历', 'Education', 'EDUCATION', '文凭']) || '本科';
    const workExperience = normalizeWorkExperience(getFieldValue(row, ['workExperience', '工作经验', '工作年限', '经验', '年限', '工龄', 'Experience', 'EXPERIENCE']));
    const skills = normalizeSkills(getFieldValue(row, ['skills', '技能', '专业技能', '技能特长', '技术栈', 'Skills', 'SKILLS', '能力']));
    const expectedSalary = getFieldValue(row, ['expectedSalary', '期望薪资', '薪资要求', '期望工资', '薪资期望', 'Salary', 'salary']);
    const statusStr = getFieldValue(row, ['status', '状态', '应聘状态', 'Status', 'STATUS']).toLowerCase();
    let status: CandidateStatus = 'pending';
    if (statusStr.includes('面试') || statusStr.includes('进行')) status = 'interviewing';
    else if (statusStr.includes('通过') || statusStr.includes('pass')) status = 'passed';
    else if (statusStr.includes('淘汰') || statusStr.includes('拒绝') || statusStr.includes('reject')) status = 'rejected';
    else if (statusStr.includes('入职') || statusStr.includes('已录用') || statusStr.includes('hire')) status = 'hired';
    const appliedDate = normalizeDate(getFieldValue(row, ['appliedDate', '申请日期', '投递日期', '日期', 'Date', 'date', '申请时间']));
    const source = getFieldValue(row, ['source', '来源', '简历来源', '渠道', 'Source', 'SOURCE', '招聘渠道']) || 'Boss直聘';
    const tags = normalizeTags(getFieldValue(row, ['tags', '标签', '备注标签', '关键词', 'Tags', 'TAGS', '标记']));
    const currentStageStr = getFieldValue(row, ['currentStage', '当前阶段', '阶段', '面试阶段', 'Stage', 'stage']).toLowerCase();
    let currentStage: InterviewStage = 'resume_screen';
    if (currentStageStr.includes('电话') || currentStageStr.includes('phone')) currentStage = 'phone_interview';
    else if (currentStageStr.includes('技术') || currentStageStr.includes('tech')) currentStage = 'tech_interview';
    else if (currentStageStr.includes('hr') || currentStageStr.includes('人事')) currentStage = 'hr_interview';
    else if (currentStageStr.includes('终面') || currentStageStr.includes('final')) currentStage = 'final_interview';
    else if (currentStageStr.includes('offer') || currentStageStr.includes('录用')) currentStage = 'offer';

    if (!name || !phone) {
      return null;
    }

    return {
      name,
      phone,
      email,
      position,
      department,
      education,
      workExperience,
      skills,
      expectedSalary,
      status,
      appliedDate,
      source,
      tags,
      currentStage,
    };
  };

  const handleImport = async (type: 'csv' | 'excel') => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'csv' ? '.csv' : '.xlsx,.xls';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const processData = (data: any[]) => {
          const imported: Omit<Candidate, 'id'>[] = [];
          const errors: string[] = [];

          data.forEach((row, index) => {
            const candidate = parseCandidateRow(row);
            if (candidate) {
              const isDuplicate = candidates.some((c) => c.phone === candidate.phone || c.email === candidate.email);
              if (isDuplicate) {
                errors.push(`第 ${index + 1} 行：${candidate.name}（电话/邮箱已存在）`);
              } else {
                imported.push(candidate);
              }
            } else {
              errors.push(`第 ${index + 1} 行：缺少必填信息（姓名或电话）`);
            }
          });

          if (imported.length > 0) {
            importCandidates(imported);
            let message = `成功导入 ${imported.length} 条候选人数据`;
            if (errors.length > 0) {
              message += `\n\n以下数据未导入：\n${errors.slice(0, 10).join('\n')}`;
              if (errors.length > 10) {
                message += `\n... 还有 ${errors.length - 10} 条错误`;
              }
            }
            alert(message);
          } else if (errors.length > 0) {
            alert(`导入失败：\n${errors.slice(0, 10).join('\n')}`);
          }
        };

        if (type === 'csv') {
          Papa.parse(file, {
            header: true,
            encoding: 'UTF-8',
            complete: (results: any) => {
              processData(results.data);
            },
            error: () => {
              alert('CSV文件解析失败，请检查文件编码（建议使用UTF-8）');
            },
          });
        } else {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array', cellDates: true });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
              processData(jsonData);
            } catch (err) {
              alert('Excel文件解析失败，请检查文件格式');
            }
          };
          reader.onerror = () => {
            alert('文件读取失败');
          };
          reader.readAsArrayBuffer(file);
        }
      };
      input.click();
    } catch (error) {
      alert('导入失败，请检查文件格式');
    }
  };

  const handleSubmit = () => {
    if (!editingCandidate.name || !editingCandidate.phone || !editingCandidate.position) {
      alert('请填写完整信息');
      return;
    }

    if (isEditing && editingCandidate.id) {
      updateCandidate(editingCandidate.id, editingCandidate);
    } else {
      addCandidate({
        name: editingCandidate.name!,
        phone: editingCandidate.phone!,
        email: editingCandidate.email || '',
        position: editingCandidate.position!,
        department: editingCandidate.department || '技术部',
        education: editingCandidate.education || '本科',
        workExperience: editingCandidate.workExperience || 0,
        skills: editingCandidate.skills || [],
        expectedSalary: editingCandidate.expectedSalary || '',
        status: editingCandidate.status || 'pending',
        appliedDate: editingCandidate.appliedDate || new Date().toISOString().split('T')[0],
        source: editingCandidate.source || 'Boss直聘',
        tags: editingCandidate.tags || [],
        currentStage: editingCandidate.currentStage || 'resume_screen',
      });
    }

    setShowModal(false);
    setEditingCandidate({});
    setIsEditing(false);
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate({ ...candidate });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleViewDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  const filteredCandidates = getFilteredCandidates();

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <h2 style={styles.title}>候选人列表</h2>
          <span style={styles.countBadge}>{filteredCandidates.length} 人</span>
        </div>
        <div style={styles.toolbarRight}>
          <button style={styles.secondaryBtn} onClick={() => handleImport('csv')}>
            📄 导入CSV
          </button>
          <button style={styles.secondaryBtn} onClick={() => handleImport('excel')}>
            📊 导入Excel
          </button>
          <button style={styles.primaryBtn} onClick={() => { setIsEditing(false); setEditingCandidate({}); setShowModal(true); }}>
            ➕ 新增候选人
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="🔍 搜索姓名、电话、邮箱、岗位..."
          style={styles.searchInput}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <select
          style={styles.select}
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
        >
          <option value="">全部岗位</option>
          {positionOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          style={styles.resetBtn}
          onClick={() => { setSearchKeyword(''); setFilterPosition(''); setFilterStatus(''); }}
        >
          重置筛选
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>候选人</th>
              <th>岗位</th>
              <th>学历</th>
              <th>工作年限</th>
              <th>期望薪资</th>
              <th>当前阶段</th>
              <th>状态</th>
              <th>来源</th>
              <th>申请日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id} style={styles.tableRow}>
                <td>
                  <div style={styles.candidateInfo}>
                    <div style={styles.avatar}>{candidate.name.charAt(0)}</div>
                    <div>
                      <div style={styles.candidateName}>{candidate.name}</div>
                      <div style={styles.candidateContact}>{candidate.phone}</div>
                      <div style={styles.candidateContact}>{candidate.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{candidate.position}</div>
                  <div style={styles.deptText}>{candidate.department}</div>
                </td>
                <td>{candidate.education}</td>
                <td>{candidate.workExperience} 年</td>
                <td style={styles.salaryText}>{candidate.expectedSalary}</td>
                <td>
                  <span style={{
                    ...styles.stageBadge,
                    backgroundColor: stageColors[candidate.currentStage] + '20',
                    color: stageColors[candidate.currentStage],
                  }}>
                    {stageLabels[candidate.currentStage]}
                  </span>
                </td>
                <td>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[candidate.status] + '20',
                    color: statusColors[candidate.status],
                  }}>
                    {statusLabels[candidate.status]}
                  </span>
                </td>
                <td>{candidate.source}</td>
                <td>{candidate.appliedDate}</td>
                <td>
                  <div style={styles.actionButtons}>
                    <button style={styles.actionBtn} onClick={() => handleViewDetail(candidate)}>查看</button>
                    <button style={styles.actionBtn} onClick={() => handleEdit(candidate)}>编辑</button>
                    <select
                      style={styles.statusSelect}
                      value={candidate.status}
                      onChange={(e) => updateCandidateStatus(candidate.id, e.target.value as CandidateStatus)}
                    >
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => {
                        if (confirm('确定要删除此候选人吗？')) {
                          deleteCandidate(candidate.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div>暂无候选人数据</div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{isEditing ? '编辑候选人' : '新增候选人'}</h3>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>姓名 *</label>
                  <input
                    style={styles.input}
                    value={editingCandidate.name || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>电话 *</label>
                  <input
                    style={styles.input}
                    value={editingCandidate.phone || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, phone: e.target.value })}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>邮箱</label>
                  <input
                    style={styles.input}
                    value={editingCandidate.email || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, email: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>岗位 *</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.position || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, position: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>部门</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.department || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, department: e.target.value })}
                  >
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>学历</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.education || '本科'}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, education: e.target.value })}
                  >
                    {educationOptions.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>工作年限</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editingCandidate.workExperience || 0}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, workExperience: parseInt(e.target.value) })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>期望薪资</label>
                  <input
                    style={styles.input}
                    value={editingCandidate.expectedSalary || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, expectedSalary: e.target.value })}
                    placeholder="如：20K-25K"
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>技能（逗号分隔）</label>
                  <input
                    style={styles.input}
                    value={(editingCandidate.skills || []).join(', ')}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>来源</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.source || 'Boss直聘'}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, source: e.target.value })}
                  >
                    {sourceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>标签（逗号分隔）</label>
                  <input
                    style={styles.input}
                    value={(editingCandidate.tags || []).join(', ')}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>状态</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.status || 'pending'}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, status: e.target.value as CandidateStatus })}
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>当前阶段</label>
                  <select
                    style={styles.input}
                    value={editingCandidate.currentStage || 'resume_screen'}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, currentStage: e.target.value as InterviewStage })}
                  >
                    {Object.entries(stageLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>申请日期</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editingCandidate.appliedDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, appliedDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setEditingCandidate({}); }}>取消</button>
              <button style={styles.primaryBtn} onClick={handleSubmit}>{isEditing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && selectedCandidate && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '700px' }}>
            <h3 style={styles.modalTitle}>候选人详情</h3>
            <div style={styles.modalBody}>
              <div style={styles.detailHeader}>
                <div style={{ ...styles.avatar, width: '64px', height: '64px', fontSize: '28px' }}>
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div style={{ marginLeft: '16px' }}>
                  <h2 style={{ margin: '0 0 8px 0' }}>{selectedCandidate.name}</h2>
                  <div style={{ color: '#666', marginBottom: '4px' }}>
                    {selectedCandidate.position} · {selectedCandidate.department}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColors[selectedCandidate.status] + '20',
                      color: statusColors[selectedCandidate.status],
                    }}>
                      {statusLabels[selectedCandidate.status]}
                    </span>
                    <span style={{
                      ...styles.stageBadge,
                      backgroundColor: stageColors[selectedCandidate.currentStage] + '20',
                      color: stageColors[selectedCandidate.currentStage],
                    }}>
                      {stageLabels[selectedCandidate.currentStage]}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.detailSection}>
                <h4 style={styles.sectionTitle}>基本信息</h4>
                <div style={styles.detailGrid}>
                  <div><span style={styles.detailLabel}>电话：</span>{selectedCandidate.phone}</div>
                  <div><span style={styles.detailLabel}>邮箱：</span>{selectedCandidate.email}</div>
                  <div><span style={styles.detailLabel}>学历：</span>{selectedCandidate.education}</div>
                  <div><span style={styles.detailLabel}>工作年限：</span>{selectedCandidate.workExperience} 年</div>
                  <div><span style={styles.detailLabel}>期望薪资：</span>{selectedCandidate.expectedSalary}</div>
                  <div><span style={styles.detailLabel}>来源：</span>{selectedCandidate.source}</div>
                  <div><span style={styles.detailLabel}>申请日期：</span>{selectedCandidate.appliedDate}</div>
                </div>
              </div>

              <div style={styles.detailSection}>
                <h4 style={styles.sectionTitle}>技能标签</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedCandidate.skills.map((skill, idx) => (
                    <span key={idx} style={styles.skillTag}>{skill}</span>
                  ))}
                  {selectedCandidate.tags.map((tag, idx) => (
                    <span key={'tag' + idx} style={{ ...styles.skillTag, backgroundColor: '#fff3e0', color: '#f57c00' }}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={styles.detailSection}>
                <h4 style={styles.sectionTitle}>面试记录</h4>
                {getInterviewsByCandidate(selectedCandidate.id).length > 0 ? (
                  <div>
                    {getInterviewsByCandidate(selectedCandidate.id).map((interview) => (
                      <div key={interview.id} style={styles.interviewRecord}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 500 }}>{stageLabels[interview.stage]}</span>
                          <span style={{ color: '#888', fontSize: '13px' }}>
                            {interview.date} {interview.startTime}-{interview.endTime}
                          </span>
                        </div>
                        <div style={{ color: '#666', fontSize: '13px' }}>
                          面试官：{interview.interviewer} · {interview.location}
                        </div>
                        {interview.evaluation && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={styles.detailLabel}>评分：</span>{interview.evaluation.overallScore}/10
                            </div>
                            <div style={{ fontSize: '13px', color: '#555' }}>{interview.evaluation.comments}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999' }}>暂无面试记录</div>
                )}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowDetail(false); setSelectedCandidate(null); }}>关闭</button>
              <button
                style={styles.primaryBtn}
                onClick={() => {
                  handleEdit(selectedCandidate);
                  setShowDetail(false);
                }}
              >
                编辑信息
              </button>
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
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '140px',
  },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderRadius: '6px',
    fontSize: '14px',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'auto',
  },
  tableRow: {
    cursor: 'pointer',
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2196f3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    fontSize: '16px',
  },
  candidateName: {
    fontWeight: 500,
    color: '#333',
  },
  candidateContact: {
    fontSize: '12px',
    color: '#888',
  },
  deptText: {
    fontSize: '12px',
    color: '#888',
  },
  salaryText: {
    color: '#f57c00',
    fontWeight: 500,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  stageBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  actionBtn: {
    padding: '4px 10px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    borderRadius: '4px',
    fontSize: '12px',
  },
  statusSelect: {
    padding: '4px 8px',
    border: '1px solid #ddd',
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
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: '16px',
    marginBottom: '16px',
    borderBottom: '1px solid #eee',
  },
  detailSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    fontSize: '14px',
  },
  detailLabel: {
    color: '#888',
  },
  skillTag: {
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '12px',
    fontSize: '12px',
  },
  interviewRecord: {
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: '6px',
    marginBottom: '8px',
  },
};
