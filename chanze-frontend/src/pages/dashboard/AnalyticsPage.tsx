import { DashboardLayout } from '@/components/layout'
import { DashboardChart, StatsCard } from '@/components/features'
import type { User } from '@/types'
import { TrendingUp, Target, Activity, PieChart } from 'lucide-react'

interface AnalyticsPageProps {
  user?: User
  onSignOut?: () => void
}

export function AnalyticsPage({ user, onSignOut }: AnalyticsPageProps) {
  // Mock analytics data
  const performanceStats = [
    {
      title: "Completion Rate",
      value: "87%",
      description: "Tasks completed on time",
      icon: Target,
      trend: { value: 5, label: "from last month", positive: true }
    },
    {
      title: "Productivity Score",
      value: "94",
      description: "Based on task velocity",
      icon: TrendingUp,
      trend: { value: 12, label: "from last month", positive: true }
    },
    {
      title: "Active Hours",
      value: "32h",
      description: "This week",
      icon: Activity,
      trend: { value: 8, label: "from last week", positive: true }
    },
    {
      title: "Projects",
      value: 5,
      description: "Currently active",
      icon: PieChart,
    }
  ]

  const weeklyData = [
    { name: "Week 1", value: 12 },
    { name: "Week 2", value: 15 },
    { name: "Week 3", value: 18 },
    { name: "Week 4", value: 22 },
  ]

  const categoryData = [
    { name: "Development", value: 45, color: "#3b82f6" },
    { name: "Design", value: 25, color: "#10b981" },
    { name: "Testing", value: 20, color: "#f59e0b" },
    { name: "Documentation", value: 10, color: "#ef4444" },
  ]

  return (
    <DashboardLayout user={user} onSignOut={onSignOut} title="Analytics">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights into your productivity and performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performanceStats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DashboardChart
            title="Weekly Progress"
            description="Tasks completed per week"
            data={weeklyData}
          />
          
          <DashboardChart
            title="Task Categories"
            description="Distribution of tasks by category"
            data={categoryData}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}