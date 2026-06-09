import { useStore } from './store/useStore';
import { statusLabels, stageLabels, statusColors } from './utils/constants';
import CandidateList from './components/CandidateList';
import Schedule from './components/Schedule';
import Evaluation from './components/Evaluation';
import Notifications from './components/Notifications';
import Analytics from './components/Analytics';
import { useEffect } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      openFile: (filters: { name: string; extensions: string[] }[]) => Promise<any>;
      saveFile: (filters: { name: string; extensions: string[] }[], defaultPath?: string) => Promise<any>;
    };
  }
}

const tabs = [
  { id: 'candidates', name: '候选人列表', icon: '👥' },
  { id: 'schedule', name: '日程排布', icon: '📅' },
  { id: 'evaluation', name: '评价记录', icon: '📝' },
  { id: 'notifications', name: '通知模板', icon: '✉️' },
  { id: 'analytics', name: '汇总分析', icon: '📊' },
];

export default function App() {
  const { activeTab, setActiveTab, getUpcomingInterviews } = useStore();
  const upcoming = getUpcomingInterviews();

  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const upcoming = getUpcomingInterviews();
      upcoming.forEach((interview) => {
        const interviewTime = new Date(`${interview.date}T${interview.startTime}`);
        const diffMinutes = (interviewTime.getTime() - now.getTime()) / (1000 * 60);
        if (diffMinutes > 0 && diffMinutes <= 30 && !localStorage.getItem(`notified_${interview.id}`)) {
          localStorage.setItem(`notified_${interview.id}`, 'true');
          showNotification(interview);
        }
      });
    };

    const interval = setInterval(checkUpcoming, 60000);
    checkUpcoming();

    return () => clearInterval(interval);
  }, [getUpcomingInterviews]);

  const showNotification = (interview: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('面试即将开始', {
        body: `${interview.candidateName} - ${interview.position}\n时间: ${interview.startTime}`,
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'candidates': return <CandidateList />;
      case 'schedule': return <Schedule />;
      case 'evaluation': return <Evaluation />;
      case 'notifications': return <Notifications />;
      case 'analytics': return <Analytics />;
      default: return <CandidateList />;
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ fontSize: '24px', marginRight: '8px' }}>💼</span>
          <h1 style={styles.title}>HR面试官助手</h1>
        </div>
        <div style={styles.headerRight}>
          {upcoming.length > 0 && (
            <div style={styles.upcomingBadge}>
              <span style={{ marginRight: '8px' }}>⏰</span>
              <span>即将开始 {upcoming.length} 场面试</span>
            </div>
          )}
          <div style={styles.userInfo}>
            <span>👤</span>
            <span style={{ marginLeft: '8px' }}>招聘负责人</span>
          </div>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                ...styles.tabItem,
                ...(activeTab === tab.id ? styles.tabItemActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabText}>{tab.name}</span>
            </div>
          ))}
        </aside>

        <main style={styles.content}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e8e8e8',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  upcomingBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#f5f7fa',
    borderRadius: '20px',
    fontSize: '13px',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#fff',
    borderRight: '1px solid #e8e8e8',
    padding: '16px 0',
    overflowY: 'auto',
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  tabItemActive: {
    backgroundColor: '#e8f4fd',
    borderLeftColor: '#2196f3',
    color: '#1976d2',
  },
  tabIcon: {
    fontSize: '18px',
    marginRight: '12px',
  },
  tabText: {
    fontSize: '14px',
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    backgroundColor: '#f5f7fa',
  },
};

export { statusLabels, stageLabels, statusColors };
