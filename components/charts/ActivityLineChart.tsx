'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ActivityLineChart({ data }: { data: { name: string, production: number, delivery: number }[] }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No activity data available.</div>

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-light)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="production" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
          <Area type="monotone" dataKey="delivery" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
