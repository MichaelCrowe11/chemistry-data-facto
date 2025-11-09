import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Reaction } from '@/types/chemistry'
import { Zap } from 'lucide-react'

interface ReactionCardProps {
  reaction: Reaction
  onClick?: () => void
}

export function ReactionCard({ reaction, onClick }: ReactionCardProps) {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'trivial':
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'challenging':
      case 'expert':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card 
      className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between gap-2">
          <span className="line-clamp-2">
            {reaction.reaction_name || `Reaction ${reaction.reaction_id.substring(0, 8)}`}
          </span>
          {reaction.yield_percent !== undefined && (
            <Badge className="shrink-0 bg-accent text-accent-foreground">
              {reaction.yield_percent.toFixed(1)}% yield
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reaction.reaction_class && reaction.reaction_class.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reaction.reaction_class.map((cls, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cls}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {reaction.temperature_celsius !== undefined && (
            <div>
              <div className="text-muted-foreground text-xs">Temperature</div>
              <div className="font-medium tabular-nums">{reaction.temperature_celsius}°C</div>
            </div>
          )}
          
          {reaction.pressure_atm !== undefined && (
            <div>
              <div className="text-muted-foreground text-xs">Pressure</div>
              <div className="font-medium tabular-nums">{reaction.pressure_atm} atm</div>
            </div>
          )}

          {reaction.time_hours !== undefined && (
            <div>
              <div className="text-muted-foreground text-xs">Time</div>
              <div className="font-medium tabular-nums">{reaction.time_hours} hrs</div>
            </div>
          )}

          {reaction.difficulty && (
            <div>
              <div className="text-muted-foreground text-xs">Difficulty</div>
              <Badge variant="outline" className={`${getDifficultyColor(reaction.difficulty)} text-xs capitalize`}>
                {reaction.difficulty}
              </Badge>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>ID: {reaction.reaction_id.substring(0, 16)}...</span>
        </div>
      </CardContent>
    </Card>
  )
}
