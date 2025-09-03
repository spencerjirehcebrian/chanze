import { DashboardLayout } from '@/components/layout'
import { StatsCard, DashboardChart } from '@/components/features'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { User } from '@/types'
import { BarChart3, Users, CheckCircle, Clock } from 'lucide-react'

interface DashboardPageProps {
  user?: User
  onSignOut?: () => void
}

export function DashboardPage({ user, onSignOut }: DashboardPageProps) {
  // Mock data - in a real app this would come from API
  const stats = [
    {
      title: "Total Tasks",
      value: 12,
      description: "Active tasks",
      icon: CheckCircle,
      trend: { value: 20, label: "from last month", positive: true }
    },
    {
      title: "Completed",
      value: 8,
      description: "Tasks completed",
      icon: BarChart3,
      trend: { value: 15, label: "from last month", positive: true }
    },
    {
      title: "In Progress", 
      value: 4,
      description: "Currently working on",
      icon: Clock,
      trend: { value: 5, label: "from last month", positive: false }
    },
    {
      title: "Team Members",
      value: 3,
      description: "Active collaborators",
      icon: Users,
    }
  ]

  const chartData = [
    { name: "Mon", value: 4 },
    { name: "Tue", value: 6 },
    { name: "Wed", value: 8 },
    { name: "Thu", value: 5 },
    { name: "Fri", value: 7 },
    { name: "Sat", value: 3 },
    { name: "Sun", value: 2 },
  ]

  return (
    <DashboardLayout user={user} onSignOut={onSignOut} title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your tasks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <DashboardChart
            title="Tasks This Week"
            description="Number of tasks completed each day"
            data={chartData}
            className="col-span-4"
          />
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest task updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="text-sm">
                    <p className="font-medium">Task completed</p>
                    <p className="text-muted-foreground">Setup database connection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="text-sm">
                    <p className="font-medium">New task created</p>
                    <p className="text-muted-foreground">Implement user authentication</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <div className="text-sm">
                    <p className="font-medium">Task updated</p>
                    <p className="text-muted-foreground">Review pull request #123</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}