import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Literature } from '@/types/chemistry'
import { BookOpen, ExternalLink } from 'lucide-react'

interface LiteratureCardProps {
  literature: Literature
  onClick?: () => void
}

export function LiteratureCard({ literature, onClick }: LiteratureCardProps) {
  return (
    <Card 
      className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between gap-2">
          <span className="line-clamp-2">{literature.title}</span>
          {literature.year && (
            <Badge variant="secondary" className="shrink-0">
              {literature.year}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {literature.authors && literature.authors.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {literature.authors.slice(0, 3).join(', ')}
            {literature.authors.length > 3 && `, et al.`}
          </div>
        )}

        {literature.abstract && (
          <p className="text-sm line-clamp-3">{literature.abstract}</p>
        )}
        
        <Separator />
        
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {literature.journal_name && (
              <span className="line-clamp-1">{literature.journal_name}</span>
            )}
            {literature.document_type && (
              <Badge variant="outline" className="text-xs capitalize">
                {literature.document_type.replace('_', ' ')}
              </Badge>
            )}
          </div>
          
          {literature.doi && (
            <a
              href={`https://doi.org/${literature.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              DOI
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
