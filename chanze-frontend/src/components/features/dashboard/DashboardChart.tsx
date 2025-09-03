import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui'

interface ChartData {
  name: string
  value: number
  color?: string
}

interface DashboardChartProps {
  title: string
  description?: string
  data: ChartData[]
  className?: string
}

export function DashboardChart({ 
  title, 
  description, 
  data, 
  className 
}: DashboardChartProps) {
  // Simple bar chart visualization - in a real app you'd use a charting library
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div className="w-20 text-sm text-muted-foreground">
                {item.name}
              </div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || undefined
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm font-medium">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}