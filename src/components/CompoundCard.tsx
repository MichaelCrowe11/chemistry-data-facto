import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Compound } from '@/types/chemistry'

interface CompoundCardProps {
  compound: Compound
  onClick?: () => void
}

export function CompoundCard({ compound, onClick }: CompoundCardProps) {
  return (
    <Card 
      className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between gap-2">
          <span className="line-clamp-2">
            {compound.common_name || compound.iupac_name || 'Unknown Compound'}
          </span>
          {compound.molecular_formula && (
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              {compound.molecular_formula}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {compound.smiles && (
          <div className="bg-muted p-3 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">SMILES</div>
            <code className="text-sm font-mono break-all">{compound.smiles}</code>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {compound.molecular_weight && (
            <div>
              <div className="text-muted-foreground text-xs">Molecular Weight</div>
              <div className="font-medium tabular-nums">{compound.molecular_weight.toFixed(2)} g/mol</div>
            </div>
          )}
          
          {compound.logp !== undefined && (
            <div>
              <div className="text-muted-foreground text-xs">LogP</div>
              <div className="font-medium tabular-nums">{compound.logp.toFixed(2)}</div>
            </div>
          )}
        </div>

        {(compound.cas_number || compound.inchi_key) && (
          <>
            <Separator />
            <div className="space-y-1 text-xs">
              {compound.cas_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CAS Number</span>
                  <span className="font-mono">{compound.cas_number}</span>
                </div>
              )}
              {compound.inchi_key && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">InChI Key</span>
                  <span className="font-mono text-[10px]">{compound.inchi_key.substring(0, 14)}...</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
