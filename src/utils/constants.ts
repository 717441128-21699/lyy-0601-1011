export const statusLabels: Record<string, string> = {
  pending: '待处理',
  interviewing: '面试中',
  passed: '已通过',
  rejected: '已淘汰',
  hired: '已入职',
};

export const statusColors: Record<string, string> = {
  pending: '#ff9800',
  interviewing: '#2196f3',
  passed: '#4caf50',
  rejected: '#f44336',
  hired: '#9c27b0',
};

export const stageLabels: Record<string, string> = {
  resume_screen: '简历筛选',
  phone_interview: '电话面试',
  tech_interview: '技术面试',
  hr_interview: 'HR面试',
  final_interview: '终面',
  offer: '发Offer',
};

export const stageColors: Record<string, string> = {
  resume_screen: '#9e9e9e',
  phone_interview: '#2196f3',
  tech_interview: '#3f51b5',
  hr_interview: '#00bcd4',
  final_interview: '#ff9800',
  offer: '#4caf50',
};

export const interviewTypeLabels: Record<string, string> = {
  onsite: '现场面试',
  online: '视频面试',
  phone: '电话面试',
};

export const recommendationLabels: Record<string, string> = {
  strong_hire: '强烈推荐',
  hire: '推荐录用',
  borderline: '待定',
  no_hire: '不推荐',
};

export const recommendationColors: Record<string, string> = {
  strong_hire: '#4caf50',
  hire: '#8bc34a',
  borderline: '#ff9800',
  no_hire: '#f44336',
};

export const sourceOptions = ['Boss直聘', '猎聘', '智联招聘', '前程无忧', 'LinkedIn', '内部推荐', '猎头推荐', '校园招聘', '站酷', '其他'];

export const educationOptions = ['高中', '大专', '本科', '硕士', '博士'];

export const departmentOptions = ['技术部', '产品部', '设计部', '运营部', '市场部', '销售部', 'HR部', '财务部', '数据部'];

export const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const talentGroupLabels: Record<string, string> = {
  normal: '普通',
  star: '⭐ 关注',
  backup: '📋 备选',
  suspended: '⏸ 暂缓',
};

export const talentGroupColors: Record<string, string> = {
  normal: '#9e9e9e',
  star: '#ff9800',
  backup: '#2196f3',
  suspended: '#f44336',
};

export const timelineTypeLabels: Record<string, string> = {
  stage_change: '阶段变更',
  status_change: '状态变更',
  interview: '面试',
  evaluation: '评价',
  communication: '沟通',
  next_action: '下一步',
};

export const timelineTypeColors: Record<string, string> = {
  stage_change: '#2196f3',
  status_change: '#4caf50',
  interview: '#ff9800',
  evaluation: '#9c27b0',
  communication: '#00bcd4',
  next_action: '#f44336',
};

export const nextActionTypeLabels: Record<string, string> = {
  next_round: '安排下一轮',
  offer: '发Offer',
  rejection: '淘汰通知',
  follow_up: '跟进沟通',
};

export const scheduleViewLabels: Record<string, string> = {
  calendar: '日历视图',
  interviewer: '面试官视图',
};
