import type { Belt as BeltType } from '../types'

export function Belt({ belt, stripes, size = 'md' }: { belt: BeltType; stripes: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`belt belt-${belt} belt-${size}`} title={`${belt} belt, ${stripes} stripes`}>
      <span className="belt-bar">
        <span className="belt-tip">
          {Array.from({ length: Math.min(stripes, 4) }, (_, i) => (
            <span key={i} className="belt-stripe" />
          ))}
        </span>
      </span>
    </span>
  )
}

export const beltLabel = (belt: BeltType, stripes: number) =>
  `${belt[0].toUpperCase()}${belt.slice(1)} belt${stripes ? ` · ${stripes} stripe${stripes === 1 ? '' : 's'}` : ''}`
