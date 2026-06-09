import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  statusLabels, statusColors, stageLabels, stageColors,
  recommendationLabels, recommendationColors
} from '../utils/constants';
import { Candidate, InterviewStage } from '../types';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

export default function Analytics() {
  const { candidates, interviews, interviewers, positions } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'comparison' | 'conversion' | 'trend' | 'export'>('overview');
  const [comparePosition, setComparePosition] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const positionOptions = useMemo(() => [...new Set(candidates.map((c) => c.position))], [candidates]);

  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    if (filterPosition) {
      result = result.filter((c) => c.position === filterPosition);
    }
    if (filterStartDate) {
      result = result.filter((c) => c.appliedDate >= filterStartDate);
    }
    if (filterEndDate) {
      result = result.filter((c) => c.appliedDate <= filterEndDate);
    }
    return result;
  }, [candidates, filterPosition, filterStartDate, filterEndDate]);

  const formatSalary = (salary: string | undefined): string => {
    if (!salary) return '';
    const s = String(salary).trim();
    if (s.toLowerCase().includes('k')) return s;
    const numMatch = s.match(/\d+(\.\d+)?/);
    if (numMatch) return `${numMatch[0]}K`;
    return s;
  };

  const stats = useMemo(() => {
    const dataSource = activeSubTab === 'trend' ? filteredCandidates : candidates;
    const total = dataSource.length;
    const byStatus = dataSource.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStage = dataSource.reduce((acc, c) => {
      acc[c.currentStage] = (acc[c.currentStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPosition = dataSource.reduce((acc, c) => {
      if (!acc[c.position]) {
        acc[c.position] = { total: 0, passed: 0, rejected: 0, interviewing: 0 };
      }
      acc[c.position].total++;
      if (c.status === 'passed') acc[c.position].passed++;
      if (c.status === 'rejected') acc[c.position].rejected++;
      if (c.status === 'interviewing') acc[c.position].interviewing++;
      return acc;
    }, {} as Record<string, { total: number; passed: number; rejected: number; interviewing: number }>);

    const interviewerWorkload = interviewers.map((i) => {
      const scheduled = interviews.filter(
        (int) => int.interviewerId === i.id && int.status === 'scheduled'
      ).length;
      const completed = interviews.filter(
        (int) => int.interviewerId === i.id && int.status === 'completed'
      ).length;
      return { name: i.name, scheduled, completed, total: scheduled + completed };
    });

    return { total, byStatus, byStage, byPosition, interviewerWorkload };
  }, [candidates, interviews, interviewers, filteredCandidates, activeSubTab]);

  const trendData = useMemo(() => {
    const stages: { key: InterviewStage; name: string }[] = [
      { key: 'resume_screen', name: '简历筛选' },
      { key: 'phone_interview', name: '电话面试' },
      { key: 'tech_interview', name: '技术面试' },
      { key: 'hr_interview', name: 'HR面试' },
      { key: 'final_interview', name: '终面' },
      { key: 'offer', name: '发Offer' },
    ];

    const trendPositions = filterPosition ? [filterPosition] : positionOptions;

    return trendPositions.map((pos) => {
      const posCandidates = filteredCandidates.filter((c) => c.position === pos);

      const stageCounts = stages.map((stage) => ({
        stage: stage.name,
        人数: posCandidates.filter((c) => {
          const stageOrder = stages.map((s) => s.key);
          const currentIdx = stageOrder.indexOf(c.currentStage);
          const targetIdx = stageOrder.indexOf(stage.key);
          return currentIdx >= targetIdx;
        }).length,
      }));

      const monthlyData: Record<string, Record<string, number>> = {};
      posCandidates.forEach((c) => {
        const month = c.appliedDate.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { 简历筛选: 0, 电话面试: 0, 技术面试: 0, HR面试: 0, 终面: 0, 发Offer: 0 };
        }
        stages.forEach((stage) => {
          const stageOrder = stages.map((s) => s.key);
          const currentIdx = stageOrder.indexOf(c.currentStage);
          const targetIdx = stageOrder.indexOf(stage.key);
          if (currentIdx >= targetIdx) {
            monthlyData[month][stage.name]++;
          }
        });
      });

      const monthlyTrend = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          月份: month,
          ...data,
        }));

      return {
        position: pos,
        stageCounts,
        monthlyTrend,
      };
    });
  }, [filteredCandidates, positionOptions, filterPosition]);

  const conversionData = useMemo(() => {
    const stages: { key: string; name: string }[] = [
      { key: 'resume_screen', name: '简历筛选' },
      { key: 'phone_interview', name: '电话面试' },
      { key: 'tech_interview', name: '技术面试' },
      { key: 'hr_interview', name: 'HR面试' },
      { key: 'final_interview', name: '终面' },
      { key: 'offer', name: '发Offer' },
    ];

    const allPositions = ['全部', ...positionOptions];

    return allPositions.map((pos) => {
      const positionCandidates = pos === '全部'
        ? candidates
        : candidates.filter((c) => c.position === pos);

      const stageCounts = stages.map((stage) => ({
        stage: stage.name,
        value: positionCandidates.filter((c) => {
          const stageOrder = stages.map((s) => s.key);
          const currentIdx = stageOrder.indexOf(c.currentStage);
          const targetIdx = stageOrder.indexOf(stage.key);
          return currentIdx >= targetIdx;
        }).length,
      }));

      const conversionRates = stageCounts.map((item, idx) => ({
        ...item,
        rate: idx === 0 ? 100 : stageCounts[idx - 1].value > 0
          ? Math.round((item.value / stageCounts[idx - 1].value) * 100)
          : 0,
      }));

      return { position: pos, data: conversionRates };
    });
  }, [candidates, positionOptions]);

  const candidatesForComparison = useMemo(() => {
    if (!comparePosition) return [];
    return candidates.filter((c) => c.position === comparePosition);
  }, [candidates, comparePosition]);

  const getCandidateEvaluations = (candidateId: string) => {
    return interviews
      .filter((i) => i.candidateId === candidateId && i.evaluation)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getAverageScore = (candidateId: string) => {
    const evals = interviews
      .filter((i) => i.candidateId === candidateId && i.evaluation)
      .map((i) => i.evaluation!);
    if (evals.length === 0) return null;
    return {
      overall: Math.round(evals.reduce((sum, e) => sum + e.overallScore, 0) / evals.length * 10) / 10,
      technical: Math.round(evals.reduce((sum, e) => sum + e.technicalSkills, 0) / evals.length * 10) / 10,
      communication: Math.round(evals.reduce((sum, e) => sum + e.communication, 0) / evals.length * 10) / 10,
      teamwork: Math.round(evals.reduce((sum, e) => sum + e.teamwork, 0) / evals.length * 10) / 10,
      problemSolving: Math.round(evals.reduce((sum, e) => sum + e.problemSolving, 0) / evals.length * 10) / 10,
    };
  };

  const toggleCandidateSelect = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const exportToExcel = (type: 'candidates' | 'evaluations' | 'conclusions' | 'comparison' | 'trend') => {
    let data: any[] = [];
    let fileName = '';
    let sheetName = 'Sheet1';

    const dataSource = (type === 'comparison' || type === 'trend') ? filteredCandidates : candidates;

    const getFilterDesc = () => {
      const parts: string[] = [];
      if (filterPosition) parts.push(`岗位-${filterPosition}`);
      if (filterStartDate) parts.push(`从${filterStartDate}`);
      if (filterEndDate) parts.push(`至${filterEndDate}`);
      return parts.length > 0 ? parts.join('_') : '全部';
    };

    if (type === 'candidates') {
      data = dataSource.map((c) => ({
        姓名: c.name,
        电话: c.phone,
        邮箱: c.email,
        岗位: c.position,
        部门: c.department,
        学历: c.education,
        工作经验: c.workExperience + '年',
        技能: c.skills.join(', '),
        期望薪资: c.expectedSalary,
        状态: statusLabels[c.status],
        当前阶段: stageLabels[c.currentStage],
        申请日期: c.appliedDate,
        来源: c.source,
        标签: c.tags.join(', '),
      }));
      fileName = `候选人列表_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (type === 'evaluations') {
      const filteredInterviews = interviews;
      data = filteredInterviews
        .filter((i) => i.evaluation)
        .map((i) => ({
          候选人: i.candidateName,
          岗位: i.position,
          面试官: i.interviewer,
          面试日期: i.date,
          面试阶段: stageLabels[i.stage],
          综合评分: i.evaluation!.overallScore,
          技术能力: i.evaluation!.technicalSkills,
          沟通能力: i.evaluation!.communication,
          团队协作: i.evaluation!.teamwork,
          问题解决: i.evaluation!.problemSolving,
          优势: i.evaluation!.strengths.join(', '),
          待改进: i.evaluation!.weaknesses.join(', '),
          建议薪资: formatSalary(i.evaluation!.suggestedSalary),
          录用建议: recommendationLabels[i.evaluation!.recommendation],
          评价内容: i.evaluation!.comments,
        }));
      fileName = `面试评价_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (type === 'comparison') {
      const compareList = selectedCandidates.length > 0
        ? dataSource.filter((c) => selectedCandidates.includes(c.id))
        : dataSource;

      data = compareList.map((c) => {
        const evals = getCandidateEvaluations(c.id);
        const latestEval = evals[evals.length - 1]?.evaluation;
        const avgScore = getAverageScore(c.id);
        return {
          姓名: c.name,
          电话: c.phone,
          邮箱: c.email,
          岗位: c.position,
          学历: c.education,
          工作经验: c.workExperience + '年',
          技能: c.skills.join(', '),
          期望薪资: c.expectedSalary,
          状态: statusLabels[c.status],
          当前阶段: stageLabels[c.currentStage],
          面试轮次: evals.length,
          平均综合分: avgScore?.overall || '',
          平均技术分: avgScore?.technical || '',
          平均沟通分: avgScore?.communication || '',
          平均协作分: avgScore?.teamwork || '',
          平均问题解决分: avgScore?.problemSolving || '',
          建议薪资: formatSalary(latestEval?.suggestedSalary),
          录用建议: latestEval ? recommendationLabels[latestEval.recommendation] : '',
          综合评价: latestEval?.comments || '',
          申请日期: c.appliedDate,
        };
      });
      fileName = `候选人对比表_${getFilterDesc()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = '候选人对比';
    } else if (type === 'trend') {
      const wb = XLSX.utils.book_new();

      const summaryData = trendData.flatMap((pos) =>
        pos.stageCounts.map((s) => ({
          岗位: pos.position,
          阶段: s.stage,
          人数: s.人数,
        }))
      );
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, '岗位阶段汇总');

      trendData.forEach((pos) => {
        if (pos.monthlyTrend.length > 0) {
          const ws = XLSX.utils.json_to_sheet(pos.monthlyTrend);
          XLSX.utils.book_append_sheet(wb, ws, pos.position.substring(0, 20));
        }
      });

      fileName = `招聘趋势报表_${getFilterDesc()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      alert(`已导出 ${fileName}`);
      return;
    } else {
      data = dataSource.map((c) => {
        const evals = getCandidateEvaluations(c.id);
        const latestEval = evals[evals.length - 1]?.evaluation;
        const avgScore = getAverageScore(c.id);
        return {
          姓名: c.name,
          岗位: c.position,
          状态: statusLabels[c.status],
          当前阶段: stageLabels[c.currentStage],
          面试轮次: evals.length,
          平均综合分: avgScore?.overall || '',
          平均技术分: avgScore?.technical || '',
          建议薪资: formatSalary(latestEval?.suggestedSalary),
          最终建议: latestEval ? recommendationLabels[latestEval.recommendation] : '',
          综合评价: latestEval?.comments || '',
          期望薪资: c.expectedSalary,
          联系电话: c.phone,
          邮箱: c.email,
        };
      });
      fileName = `面试结论_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    alert(`已导出 ${fileName}`);
  };

  const statusChartData = Object.entries(stats.byStatus).map(([key, value]) => ({
    name: statusLabels[key],
    value,
    fill: statusColors[key],
  }));

  const stageChartData = Object.entries(stats.byStage).map(([key, value]) => ({
    name: stageLabels[key],
    value,
    fill: stageColors[key],
  }));

  const positionChartData = Object.entries(stats.byPosition).map(([name, data]) => ({
    name,
    面试中: data.interviewing,
    已通过: data.passed,
    已淘汰: data.rejected,
  }));

  const subTabs = [
    { key: 'overview', label: '数据看板' },
    { key: 'comparison', label: '候选人对比' },
    { key: 'conversion', label: '转化率分析' },
    { key: 'trend', label: '招聘趋势' },
    { key: 'export', label: '数据导出' },
  ];

  const stageColorsArray = ['#1890ff', '#36cfc9', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  const FilterBar = () => (
    <div style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      padding: 16,
      background: '#fafafa',
      borderRadius: 8,
      marginBottom: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>岗位：</label>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, minWidth: 150 }}
        >
          <option value="">全部岗位</option>
          {positionOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>开始日期：</label>
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>结束日期：</label>
        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
        />
      </div>
      <div style={{ fontSize: 13, color: '#888' }}>
        筛选结果：{filteredCandidates.length} 位候选人
      </div>
      {(filterPosition || filterStartDate || filterEndDate) && (
        <button
          onClick={() => {
            setFilterPosition('');
            setFilterStartDate('');
            setFilterEndDate('');
          }}
          style={{
            padding: '6px 16px',
            background: 'transparent',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            fontSize: 13,
            cursor: 'pointer',
            color: '#666',
          }}
        >
          清除筛选
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeSubTab === tab.key ? '#1890ff' : 'transparent',
              color: activeSubTab === tab.key ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>总候选人</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
            </div>
            {Object.entries(stats.byStatus).map(([key, value]) => (
              <div key={key} style={cardStyle}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{statusLabels[key]}</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: statusColors[key] }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>状态分布</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...cardStyle, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>阶段分布</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>各岗位招聘进度</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="面试中" fill="#2196f3" />
                <Bar dataKey="已通过" fill="#4caf50" />
                <Bar dataKey="已淘汰" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...cardStyle, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>面试官工作量</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.interviewerWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scheduled" name="待面试" fill="#ff9800" />
                <Bar dataKey="completed" name="已完成" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeSubTab === 'comparison' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <FilterBar />
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>选择对比岗位：</label>
            <select
              value={comparePosition}
              onChange={(e) => {
                setComparePosition(e.target.value);
                setSelectedCandidates([]);
              }}
              style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 14 }}
            >
              <option value="">请选择岗位</option>
              {positionOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={() => exportToExcel('comparison')}
              style={{
                marginLeft: 'auto',
                padding: '8px 20px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              📥 导出当前对比表
            </button>
          </div>

          {comparePosition && (
            <>
              <div style={{ marginBottom: 16, fontSize: 13, color: '#666' }}>
                共 {candidatesForComparison.length} 位候选人，已选择 {selectedCandidates.length} 位进行对比
              </div>

              <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {candidatesForComparison.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: selectedCandidates.includes(c.id) ? '#e6f7ff' : '#f5f5f5',
                      border: `1px solid ${selectedCandidates.includes(c.id) ? '#1890ff' : '#d9d9d9'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(c.id)}
                      onChange={() => toggleCandidateSelect(c.id)}
                    />
                    {c.name}
                    <span style={{ color: statusColors[c.status], fontSize: 12 }}>
                      [{statusLabels[c.status]}]
                    </span>
                  </label>
                ))}
              </div>

              {selectedCandidates.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th style={thStyle}>对比项</th>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return (
                            <th key={id} style={thStyle}>
                              <div>{c.name}</div>
                              <div style={{ fontSize: 12, color: statusColors[c.status], fontWeight: 'normal' }}>
                                {statusLabels[c.status]}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={tdLabelStyle}>学历</td>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return <td key={id} style={tdStyle}>{c.education}</td>;
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>工作经验</td>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return <td key={id} style={tdStyle}>{c.workExperience}年</td>;
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>期望薪资</td>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return <td key={id} style={tdStyle}>{c.expectedSalary}</td>;
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>技能</td>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return (
                            <td key={id} style={tdStyle}>
                              {c.skills.map((s, idx) => (
                                <span key={idx} style={tagStyle}>{s}</span>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>当前阶段</td>
                        {selectedCandidates.map((id) => {
                          const c = candidates.find((can) => can.id === id)!;
                          return (
                            <td key={id} style={{ ...tdStyle, color: stageColors[c.currentStage], fontWeight: 500 }}>
                              {stageLabels[c.currentStage]}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>面试轮次</td>
                        {selectedCandidates.map((id) => {
                          const evals = getCandidateEvaluations(id);
                          return <td key={id} style={tdStyle}>{evals.length}轮</td>;
                        })}
                      </tr>
                      {['overall', 'technical', 'communication', 'teamwork', 'problemSolving'].map((scoreType) => (
                        <tr key={scoreType}>
                          <td style={tdLabelStyle}>
                            {scoreType === 'overall' && '平均综合分'}
                            {scoreType === 'technical' && '平均技术分'}
                            {scoreType === 'communication' && '平均沟通分'}
                            {scoreType === 'teamwork' && '平均协作分'}
                            {scoreType === 'problemSolving' && '平均问题解决分'}
                          </td>
                          {selectedCandidates.map((id) => {
                            const avg = getAverageScore(id);
                            const score = avg ? avg[scoreType as keyof typeof avg] : null;
                            return (
                              <td key={id} style={{ ...tdStyle, fontWeight: 'bold', color: score && score >= 7 ? '#4caf50' : score && score >= 5 ? '#ff9800' : '#f44336' }}>
                                {score || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td style={tdLabelStyle}>建议薪资</td>
                        {selectedCandidates.map((id) => {
                          const evals = getCandidateEvaluations(id);
                          const latest = evals[evals.length - 1]?.evaluation;
                          return <td key={id} style={tdStyle}>{latest?.suggestedSalary || '-'}</td>;
                        })}
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>录用建议</td>
                        {selectedCandidates.map((id) => {
                          const evals = getCandidateEvaluations(id);
                          const latest = evals[evals.length - 1]?.evaluation;
                          return (
                            <td key={id} style={{ ...tdStyle, color: latest ? recommendationColors[latest.recommendation] : '#999' }}>
                              {latest ? recommendationLabels[latest.recommendation] : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeSubTab === 'conversion' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {conversionData.map((item) => (
            <div key={item.position} style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#1890ff' }}>{item.position} - 转化率漏斗</h3>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const d = item.data.find((x) => x.stage === name);
                      return [`${value}人 (转化率: ${d?.rate}%)`, name];
                    }}
                  />
                  <Funnel
                    data={item.data}
                    dataKey="value"
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#333" stroke="none" dataKey="stage" />
                    <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
                    <LabelList position="left" fill="#666" stroke="none" dataKey="rate" formatter={(v: number) => `${v}%`} />
                    {item.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#1890ff', '#36cfc9', '#52c41a', '#faad14', '#f5222d', '#722ed1'][index % 6]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      <th style={thStyle}>阶段</th>
                      <th style={thStyle}>人数</th>
                      <th style={thStyle}>转化率</th>
                      <th style={thStyle}>累计留存率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.data.map((row, idx) => (
                      <tr key={row.stage}>
                        <td style={tdStyle}>{row.stage}</td>
                        <td style={tdStyle}>{row.value}人</td>
                        <td style={{ ...tdStyle, color: row.rate >= 70 ? '#4caf50' : row.rate >= 40 ? '#ff9800' : '#f44336', fontWeight: 500 }}>
                          {idx === 0 ? '-' : row.rate + '%'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {item.data[0].value > 0 ? Math.round((row.value / item.data[0].value) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'trend' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <FilterBar />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>筛选后总人数</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>{filteredCandidates.length}</div>
            </div>
            {Object.entries(stats.byStatus).map(([key, value]) => (
              <div key={key} style={cardStyle}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{statusLabels[key]}</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: statusColors[key] }}>{value}</div>
              </div>
            ))}
          </div>

          {trendData.map((posData) => (
            <div key={posData.position} style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1890ff' }}>{posData.position} - 招聘进度</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>各阶段人数</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={posData.stageCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="人数" fill="#1890ff">
                        {posData.stageCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={stageColorsArray[index % stageColorsArray.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>月度趋势</h4>
                  {posData.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={posData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="月份" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {['简历筛选', '电话面试', '技术面试', 'HR面试', '终面', '发Offer'].map((stage, idx) => (
                          <Line
                            key={stage}
                            type="monotone"
                            dataKey={stage}
                            stroke={stageColorsArray[idx]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, color: '#999', fontSize: 13 }}>
                      暂无月度数据
                    </div>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      <th style={thStyle}>阶段</th>
                      <th style={thStyle}>人数</th>
                      <th style={thStyle}>占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posData.stageCounts.map((row, idx) => {
                      const total = posData.stageCounts[0]?.人数 || 1;
                      return (
                        <tr key={row.stage}>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: stageColorsArray[idx % stageColorsArray.length],
                              marginRight: 8,
                            }} />
                            {row.stage}
                          </td>
                          <td style={tdStyle}>{row.人数}人</td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>
                            {Math.round((row.人数 / total) * 100)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {posData.monthlyTrend.length > 0 && (
                <div style={{ marginTop: 20, overflowX: 'auto' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>月度详细数据</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th style={thStyle}>月份</th>
                        {['简历筛选', '电话面试', '技术面试', 'HR面试', '终面', '发Offer'].map((s) => (
                          <th key={s} style={thStyle}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {posData.monthlyTrend.map((row) => (
                        <tr key={row.月份}>
                          <td style={tdStyle}><strong>{row.月份}</strong></td>
                          {['简历筛选', '电话面试', '技术面试', 'HR面试', '终面', '发Offer'].map((s) => (
                            <td key={s} style={tdStyle}>{row[s as keyof typeof row] || 0}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button
              onClick={() => exportToExcel('trend')}
              style={{
                padding: '10px 32px',
                background: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              📥 导出当前筛选条件下的趋势报表
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'export' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <FilterBar />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1200 }}>
            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer' }} onClick={() => exportToExcel('candidates')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>导出候选人列表</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>导出所有候选人的基本信息、状态、阶段等</p>
              <button style={exportBtnStyle}>导出 Excel</button>
            </div>

            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer' }} onClick={() => exportToExcel('evaluations')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>导出面试评价</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>导出所有已完成面试的评价记录和评分</p>
              <button style={exportBtnStyle}>导出 Excel</button>
            </div>

            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer' }} onClick={() => exportToExcel('conclusions')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>导出面试结论</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>导出所有候选人的综合面试结论汇总</p>
              <button style={exportBtnStyle}>导出 Excel</button>
            </div>

            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f0f9ff' }} onClick={() => exportToExcel('comparison')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>导出候选人对比表</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>按当前筛选条件导出候选人详细对比表</p>
              <button style={{ ...exportBtnStyle, background: '#13c2c2' }}>导出 Excel</button>
            </div>

            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f6ffed' }} onClick={() => exportToExcel('trend')}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📉</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>导出招聘趋势报表</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>按当前筛选条件导出各岗位阶段变化趋势</p>
              <button style={{ ...exportBtnStyle, background: '#52c41a' }}>导出 Excel</button>
            </div>

            <div style={{ ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#fffbe6' }} onClick={() => {
              setComparePosition(filterPosition || positionOptions[0] || '');
              setActiveSubTab('comparison');
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>创建候选人对比</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>选择候选人进行多维度横向对比分析</p>
              <button style={{ ...exportBtnStyle, background: '#faad14' }}>去对比</button>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 24, marginTop: 20, maxWidth: 1200 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>当前筛选数据概览</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13 }}>
              <div>
                <strong>筛选后候选人：</strong>{filteredCandidates.length} 人
              </div>
              <div>
                <strong>候选人总数：</strong>{candidates.length} 人
              </div>
              <div>
                <strong>已安排面试：</strong>{interviews.length} 场
              </div>
              <div>
                <strong>在招岗位：</strong>{positionOptions.length} 个
              </div>
              <div>
                <strong>面试官：</strong>{interviewers.length} 人
              </div>
              <div>
                <strong>筛选岗位：</strong>{filterPosition || '全部'}
              </div>
              <div>
                <strong>时间范围：</strong>{filterStartDate || '不限'} ~ {filterEndDate || '不限'}
              </div>
              <div>
                <strong>整体通过率：</strong>
                {filteredCandidates.length > 0 ? Math.round(((stats.byStatus.passed || 0) / filteredCandidates.length) * 100) : 0}%
              </div>
              <div>
                <strong>整体淘汰率：</strong>
                {filteredCandidates.length > 0 ? Math.round(((stats.byStatus.rejected || 0) / filteredCandidates.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e0e0e0',
  textAlign: 'left',
  background: '#fafafa',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e0e0e0',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdLabelStyle: React.CSSProperties = {
  ...tdStyle,
  background: '#fafafa',
  fontWeight: 500,
  minWidth: 120,
};

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  background: '#e6f7ff',
  color: '#1890ff',
  borderRadius: 12,
  fontSize: 12,
  marginRight: 4,
  marginBottom: 4,
};

const exportBtnStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '8px 20px',
  background: '#1890ff',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
};
