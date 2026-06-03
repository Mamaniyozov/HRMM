import React from 'react'

const cards = [
  {
    title: 'Yangi arizalar',
    value: '24',
    accent: 'teal',
    badge: 'Faol',
    badgeTone: 'success',
    action: 'Hozir yaratilgan ariza',
    icon: (
      <path d="M12 5v14m-7-7h14" />
    ),
    detail: 'Bugun 6 ta yangi ariza',
  },
  {
    title: 'Mening hisobotlarim',
    value: '12',
    accent: 'purple',
    badge: 'Yangilandi',
    badgeTone: 'info',
    action: 'Hisobotlarni ko‘rish',
    icon: (
      <path d="M4 19V5m0 14h16M8 15v-5m4 5V7m4 8v-3" />
    ),
    detail: 'Oxirgi 7 kun',
    sparkline: true,
  },
  {
    title: 'Tasdiqlash holati',
    value: '7',
    accent: 'amber',
    badge: 'PENDING_L2',
    badgeTone: 'warning',
    action: 'Holatni tekshirish',
    icon: (
      <path d="M9 12l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    ),
    detail: '3 ta javob kutilmoqda',
  },
  {
    title: 'Bildirishnomalar',
    value: '18',
    accent: 'coral',
    badge: 'Jonli',
    badgeTone: 'danger',
    action: 'Bildirishnomalar',
    icon: (
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" />
    ),
    detail: '5 ta o‘qilmagan xabar',
    live: true,
  },
]

const approvalMetrics = [
  { label: 'Funksiya talablari', value: 0, tone: 'muted', icon: 'M4 6h16M4 12h16M4 18h10' },
  { label: 'Hal qilingan', value: 4, tone: 'positive', icon: 'M20 6 9 17l-5-5' },
  { label: 'Tasdiqlangan', value: 3, tone: 'positive', icon: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z' },
]

function Icon({ children }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

function StatusBadge({ tone, children, live }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {live && <span className="pulse-dot" />}
      {children}
    </span>
  )
}

function Sparkline() {
  return (
    <div className="sparkline" aria-hidden="true">
      <svg viewBox="0 0 140 44" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparklineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#00C9A7" />
          </linearGradient>
        </defs>
        <path
          d="M2 34 C18 26, 22 28, 36 21 S58 18, 72 25 92 32, 104 16 124 11, 138 18"
          fill="none"
          stroke="url(#sparklineGradient)"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M2 34 C18 26, 22 28, 36 21 S58 18, 72 25 92 32, 104 16 124 11, 138 18 V44 H2 Z"
          fill="url(#sparklineGradient)"
          opacity="0.12"
        />
      </svg>
    </div>
  )
}

function MetricTile({ label, value, tone, icon }) {
  return (
    <button className={`metric-tile metric-tile--${tone}`} type="button">
      <span className="metric-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={icon} />
        </svg>
      </span>
      <span>
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </button>
  )
}

function DashboardCard({ card }) {
  return (
    <article className={`dashboard-card dashboard-card--${card.accent}`}>
      <div className="card-topline">
        <p>{card.title}</p>
        <StatusBadge tone={card.badgeTone} live={card.live}>
          {card.badge}
        </StatusBadge>
      </div>

      <div className="card-main">
        <div>
          <strong className="card-value">{card.value}</strong>
          <span className="card-detail">{card.detail}</span>
        </div>
        {card.sparkline ? <Sparkline /> : <span className="soft-mark" />}
      </div>

      {card.title === 'Tasdiqlash holati' ? (
        <div className="approval-row">
          {approvalMetrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </div>
      ) : (
        <button className="card-action" type="button">
          <Icon>{card.icon}</Icon>
          <span>{card.action}</span>
        </button>
      )}
    </article>
  )
}

function App() {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-wrap" aria-label="HRMM dashboard">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">HRMM</span>
            <h1>Mamaniyozov Muhammadyusuf</h1>
          </div>
          <StatusBadge tone="success" live>
            Faol sessiya
          </StatusBadge>
        </header>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <DashboardCard key={card.title} card={card} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
