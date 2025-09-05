import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <div className="text-xl font-medium mb-2">Loading your todos...</div>
          <div className="text-sm text-muted-foreground">Please wait a moment</div>
        </CardContent>
      </Card>
    </div>
  );
}