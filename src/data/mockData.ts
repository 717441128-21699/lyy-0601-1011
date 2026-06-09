import { Candidate, Interview, Interviewer, NotificationTemplate, NotificationRecord, Position, CommunicationRecord } from '../types';

export const mockPositions: Position[] = [
  { id: 'p1', name: '高级前端工程师', department: '技术部', hiringManager: '张经理', headcount: 3, hiredCount: 1, status: 'open' },
  { id: 'p2', name: 'Java后端开发', department: '技术部', hiringManager: '李经理', headcount: 5, hiredCount: 2, status: 'open' },
  { id: 'p3', name: '产品经理', department: '产品部', hiringManager: '王总监', headcount: 2, hiredCount: 0, status: 'open' },
  { id: 'p4', name: 'UI设计师', department: '设计部', hiringManager: '赵主管', headcount: 2, hiredCount: 1, status: 'open' },
  { id: 'p5', name: '数据分析师', department: '数据部', hiringManager: '陈经理', headcount: 3, hiredCount: 1, status: 'on_hold' },
];

export const mockInterviewers: Interviewer[] = [
  {
    id: 'i1', name: '张明', department: '技术部', title: '技术总监', email: 'zhangming@company.com', phone: '13800138001',
    busySlots: [
      { date: '2026-06-11', startTime: '09:00', endTime: '10:30' },
      { date: '2026-06-11', startTime: '14:00', endTime: '15:00' },
      { date: '2026-06-12', startTime: '10:00', endTime: '12:00' },
    ]
  },
  {
    id: 'i2', name: '李华', department: '技术部', title: '高级工程师', email: 'lihua@company.com', phone: '13800138002',
    busySlots: [
      { date: '2026-06-11', startTime: '10:00', endTime: '11:30' },
      { date: '2026-06-13', startTime: '09:00', endTime: '11:00' },
    ]
  },
  {
    id: 'i3', name: '王芳', department: 'HR部', title: 'HR经理', email: 'wangfang@company.com', phone: '13800138003',
    busySlots: [
      { date: '2026-06-11', startTime: '15:00', endTime: '17:00' },
      { date: '2026-06-12', startTime: '09:00', endTime: '10:00' },
    ]
  },
  {
    id: 'i4', name: '赵强', department: '产品部', title: '产品总监', email: 'zhaoqiang@company.com', phone: '13800138004',
    busySlots: [
      { date: '2026-06-12', startTime: '14:00', endTime: '16:00' },
    ]
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'c1', name: '陈小明', phone: '13900139001', email: 'chenxm@email.com',
    position: '高级前端工程师', department: '技术部',
    education: '本科', workExperience: 5,
    skills: ['React', 'Vue', 'TypeScript', 'Node.js', 'Webpack'],
    expectedSalary: '25K-30K', status: 'interviewing',
    appliedDate: '2026-06-01', source: 'Boss直聘',
    tags: ['985', '大厂经验', '技术栈匹配'],
    currentStage: 'tech_interview',
    talentPoolGroup: 'star',
  },
  {
    id: 'c2', name: '刘小红', phone: '13900139002', email: 'liuxh@email.com',
    position: 'Java后端开发', department: '技术部',
    education: '硕士', workExperience: 3,
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', '微服务'],
    expectedSalary: '20K-25K', status: 'interviewing',
    appliedDate: '2026-06-02', source: '猎聘',
    tags: ['高学历', '潜力大'],
    currentStage: 'phone_interview',
    talentPoolGroup: 'backup',
  },
  {
    id: 'c3', name: '张伟', phone: '13900139003', email: 'zhangwei@email.com',
    position: '高级前端工程师', department: '技术部',
    education: '本科', workExperience: 4,
    skills: ['React', 'Next.js', 'GraphQL', 'Docker'],
    expectedSalary: '22K-28K', status: 'pending',
    appliedDate: '2026-06-03', source: '内部推荐',
    tags: ['内推', '项目经验丰富'],
    currentStage: 'resume_screen',
    talentPoolGroup: 'normal',
  },
  {
    id: 'c4', name: '李娜', phone: '13900139004', email: 'lina@email.com',
    position: '产品经理', department: '产品部',
    education: '硕士', workExperience: 6,
    skills: ['产品设计', '用户研究', '数据分析', 'Axure', 'PRD'],
    expectedSalary: '30K-35K', status: 'passed',
    appliedDate: '2026-05-20', source: 'LinkedIn',
    tags: ['经验丰富', 'B端产品', '带过团队'],
    currentStage: 'offer',
    talentPoolGroup: 'star',
  },
  {
    id: 'c5', name: '王磊', phone: '13900139005', email: 'wanglei@email.com',
    position: 'UI设计师', department: '设计部',
    education: '本科', workExperience: 3,
    skills: ['Figma', 'Sketch', '交互设计', '动效设计', '品牌设计'],
    expectedSalary: '18K-22K', status: 'rejected',
    appliedDate: '2026-05-15', source: '站酷',
    tags: ['作品集优秀'],
    currentStage: 'final_interview',
    talentPoolGroup: 'suspended',
  },
  {
    id: 'c6', name: '孙涛', phone: '13900139006', email: 'suntao@email.com',
    position: 'Java后端开发', department: '技术部',
    education: '本科', workExperience: 8,
    skills: ['Java', 'Spring Cloud', 'Kafka', 'Kubernetes', '高并发'],
    expectedSalary: '35K-45K', status: 'interviewing',
    appliedDate: '2026-06-05', source: '猎头推荐',
    tags: ['资深', '架构经验', '高并发经验'],
    currentStage: 'tech_interview',
    talentPoolGroup: 'star',
  },
  {
    id: 'c7', name: '周婷', phone: '13900139007', email: 'zhouting@email.com',
    position: '数据分析师', department: '数据部',
    education: '硕士', workExperience: 2,
    skills: ['Python', 'SQL', 'Tableau', '机器学习', '统计学'],
    expectedSalary: '15K-20K', status: 'pending',
    appliedDate: '2026-06-06', source: '校园招聘',
    tags: ['应届生', '成绩优异', '实习经验'],
    currentStage: 'resume_screen',
    talentPoolGroup: 'backup',
  },
  {
    id: 'c8', name: '吴浩', phone: '13900139008', email: 'wuhao@email.com',
    position: '产品经理', department: '产品部',
    education: '本科', workExperience: 4,
    skills: ['C端产品', '增长黑客', 'AB测试', '用户运营'],
    expectedSalary: '25K-30K', status: 'interviewing',
    appliedDate: '2026-06-04', source: 'Boss直聘',
    tags: ['增长经验', '数据驱动'],
    currentStage: 'hr_interview',
    talentPoolGroup: 'normal',
  },
];

export const mockInterviews: Interview[] = [
  {
    id: 'int1', candidateId: 'c1', candidateName: '陈小明', position: '高级前端工程师',
    interviewer: '张明', interviewerId: 'i1',
    date: '2026-06-11', startTime: '14:00', endTime: '15:00',
    stage: 'tech_interview', location: '会议室A', type: 'onsite',
    status: 'scheduled',
    remarks: '重点考察React和TypeScript项目经验，候选人有大厂背景',
  },
  {
    id: 'int2', candidateId: 'c2', candidateName: '刘小红', position: 'Java后端开发',
    interviewer: '李华', interviewerId: 'i2',
    date: '2026-06-11', startTime: '15:30', endTime: '16:30',
    stage: 'phone_interview', location: '电话面试', type: 'phone',
    status: 'scheduled',
    remarks: '初步电话筛选，了解基本技术栈和项目经历',
  },
  {
    id: 'int3', candidateId: 'c6', candidateName: '孙涛', position: 'Java后端开发',
    interviewer: '张明', interviewerId: 'i1',
    date: '2026-06-12', startTime: '10:30', endTime: '12:00',
    stage: 'tech_interview', location: '会议室B', type: 'onsite',
    status: 'scheduled',
    remarks: '资深候选人，8年经验，重点考察架构设计能力和高并发经验',
  },
  {
    id: 'int4', candidateId: 'c8', candidateName: '吴浩', position: '产品经理',
    interviewer: '王芳', interviewerId: 'i3',
    date: '2026-06-12', startTime: '14:30', endTime: '15:30',
    stage: 'hr_interview', location: '会议室C', type: 'online',
    status: 'scheduled',
    remarks: 'HR面试，考察综合素质和文化匹配度，视频面试',
  },
  {
    id: 'int5', candidateId: 'c4', candidateName: '李娜', position: '产品经理',
    interviewer: '赵强', interviewerId: 'i4',
    date: '2026-06-08', startTime: '14:00', endTime: '15:30',
    stage: 'final_interview', location: '会议室A', type: 'onsite',
    status: 'completed',
    remarks: '终面，候选人表现优秀，建议优先录用',
    evaluation: {
      overallScore: 9, technicalSkills: 8, communication: 10, teamwork: 9, problemSolving: 9,
      comments: '产品思维清晰，过往项目经验与岗位匹配度高，沟通能力出色，能够很好地理解用户需求并转化为产品方案。',
      strengths: ['逻辑思维强', '沟通表达好', '项目经验丰富', '有带团队经验'],
      weaknesses: ['对技术细节了解不够深入', 'B端经验相对较少'],
      suggestedSalary: '32K',
      recommendation: 'strong_hire',
      completedAt: '2026-06-08 16:00',
    },
  },
  {
    id: 'int6', candidateId: 'c5', candidateName: '王磊', position: 'UI设计师',
    interviewer: '赵强', interviewerId: 'i4',
    date: '2026-06-05', startTime: '10:00', endTime: '11:30',
    stage: 'final_interview', location: '会议室D', type: 'onsite',
    status: 'completed',
    remarks: '作品集不错，但与公司业务方向匹配度不高',
    evaluation: {
      overallScore: 6, technicalSkills: 7, communication: 6, teamwork: 6, problemSolving: 5,
      comments: '设计能力尚可，但作品集与公司业务方向匹配度不高，薪资期望与岗位预算有差距。',
      strengths: ['视觉设计能力不错', '作品集精美'],
      weaknesses: ['产品思维较弱', '薪资期望过高', '沟通不够主动'],
      suggestedSalary: '18K',
      recommendation: 'no_hire',
      completedAt: '2026-06-05 12:00',
    },
  },
];

export const mockTemplates: NotificationTemplate[] = [
  {
    id: 't1', name: '面试邀请邮件', type: 'interview_invite',
    subject: '【{公司名}】{候选人姓名} - {岗位名称}面试邀请',
    content: `尊敬的{候选人姓名}：

您好！

感谢您对{公司名}的关注，我们已经收到您的简历。经过初步筛选，我们认为您的背景与我们正在招聘的{岗位名称}职位非常匹配，诚邀您参加面试。

面试安排如下：
面试时间：{面试日期} {开始时间}-{结束时间}
面试形式：{面试形式}
面试地点：{面试地点}
面试官：{面试官姓名}

请您携带以下材料：
1. 身份证原件
2. 学历证书原件
3. 个人简历一份

如有任何问题，请随时与我们联系。

期待与您的面谈！

{公司名}
人力资源部
{联系电话}
{联系邮箱}`,
    variables: ['公司名', '候选人姓名', '岗位名称', '面试日期', '开始时间', '结束时间', '面试形式', '面试地点', '面试官姓名', '联系电话', '联系邮箱'],
    createdAt: '2026-01-01', updatedAt: '2026-06-01',
  },
  {
    id: 't2', name: '面试提醒', type: 'reminder',
    subject: '【面试提醒】{候选人姓名}，您的{岗位名称}面试即将开始',
    content: `尊敬的{候选人姓名}：

温馨提醒，您在{公司名}的{岗位名称}面试将于{面试时间}开始。

面试信息：
时间：{面试日期} {开始时间}
地点：{面试地点}
形式：{面试形式}

请提前做好准备，准时参加。如有特殊情况，请及时联系我们。

祝面试顺利！

{公司名}人力资源部`,
    variables: ['公司名', '候选人姓名', '岗位名称', '面试时间', '面试日期', '开始时间', '面试地点', '面试形式'],
    createdAt: '2026-01-01', updatedAt: '2026-06-01',
  },
  {
    id: 't3', name: '感谢应聘-未通过', type: 'rejection',
    subject: '【{公司名}】感谢您应聘{岗位名称}职位',
    content: `尊敬的{候选人姓名}：

您好！

非常感谢您对{公司名}的关注以及应聘{岗位名称}职位。

经过综合评估，我们认为您当前的经历与该职位的要求存在一定差距，因此未能进入下一轮。我们已将您的简历加入公司人才库，未来如有合适的职位，我们会优先与您联系。

再次感谢您抽出时间参加面试，祝您职业发展顺利！

{公司名}人力资源部`,
    variables: ['公司名', '候选人姓名', '岗位名称'],
    createdAt: '2026-01-01', updatedAt: '2026-06-01',
  },
  {
    id: 't4', name: '录用通知', type: 'offer',
    subject: '【{公司名}】{岗位名称}录用通知 - {候选人姓名}',
    content: `尊敬的{候选人姓名}：

您好！

经过对您的面试评估，我们非常荣幸地通知您，您已通过我司{岗位名称}职位的所有面试环节。我们诚挚地邀请您加入{公司名}大家庭！

入职信息如下：
入职日期：{入职日期}
入职地点：{入职地点}
薪酬待遇：
- 基本工资：{薪资}
- 试用期：{试用期}个月，试用期薪资为转正薪资的80%

请您在{回复截止日期}前确认是否接受此录用。

如有任何疑问，请随时与我们联系。

期待您的加入！

{公司名}人力资源部`,
    variables: ['公司名', '候选人姓名', '岗位名称', '入职日期', '入职地点', '薪资', '试用期', '回复截止日期'],
    createdAt: '2026-01-01', updatedAt: '2026-06-01',
  },
  {
    id: 't5', name: '面试反馈', type: 'feedback',
    subject: '【{公司名}】{岗位名称}面试反馈',
    content: `尊敬的{候选人姓名}：

您好！

感谢您参加{公司名}的{岗位名称}面试。以下是您的面试反馈：

{面试反馈内容}

如有任何问题，欢迎随时与我们沟通。

{公司名}人力资源部`,
    variables: ['公司名', '候选人姓名', '岗位名称', '面试反馈内容'],
    createdAt: '2026-01-01', updatedAt: '2026-06-01',
  },
];

export const mockNotificationRecords: NotificationRecord[] = [
  {
    id: 'nr1', candidateId: 'c1', candidateName: '陈小明', templateId: 't1', templateName: '面试邀请邮件',
    type: 'interview_invite', subject: '【XX科技】陈小明 - 高级前端工程师面试邀请',
    content: '...', sentAt: '2026-06-10 09:00', status: 'sent', channel: 'email',
  },
  {
    id: 'nr2', candidateId: 'c2', candidateName: '刘小红', templateId: 't1', templateName: '面试邀请邮件',
    type: 'interview_invite', subject: '【XX科技】刘小红 - Java后端开发面试邀请',
    content: '...', sentAt: '2026-06-10 10:30', status: 'sent', channel: 'email',
  },
  {
    id: 'nr3', candidateId: 'c5', candidateName: '王磊', templateId: 't3', templateName: '感谢应聘-未通过',
    type: 'rejection', subject: '【XX科技】感谢您应聘UI设计师职位',
    content: '...', sentAt: '2026-06-06 14:00', status: 'sent', channel: 'email',
  },
];

export const mockCommunicationRecords: CommunicationRecord[] = [
  {
    id: 'com1', candidateId: 'c1', type: 'call',
    content: '电话沟通确认面试时间，候选人表示可以参加6月11日下午2点的面试。',
    createdAt: '2026-06-10 09:30', createdBy: 'HR系统',
  },
  {
    id: 'com2', candidateId: 'c1', type: 'email',
    content: '发送面试邀请邮件，包含面试时间、地点、需要携带的材料等信息。',
    createdAt: '2026-06-10 09:00', createdBy: 'HR系统',
  },
  {
    id: 'com3', candidateId: 'c4', type: 'note',
    content: '候选人表现优秀，建议优先录用，薪资可谈至32K。',
    createdAt: '2026-06-08 17:00', createdBy: '王芳',
  },
  {
    id: 'com4', candidateId: 'c5', type: 'meeting',
    content: '终面后讨论，认为候选人设计风格与公司不太匹配，决定不录用。',
    createdAt: '2026-06-06 10:00', createdBy: '赵强',
  },
];
