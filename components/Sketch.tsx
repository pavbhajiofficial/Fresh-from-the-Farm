type Name = 'wheat' | 'sprig' | 'tomato' | 'carrot';
const line = { fill: 'none', strokeWidth: 1.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const grains: [number, number, number][] = [[41, 34, -28], [59, 34, 28], [41, 52, -28], [59, 52, 28], [42, 70, -28], [58, 70, 28]];

/** Background-only pencil line drawings. They wiggle on hover. */
export default function Sketch({ name }: { name: Name }) {
  const filterId = `pen-${name}`;
  return (
    <svg className="sketch" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id={filterId}>
          <feTurbulence baseFrequency=".04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </defs>
      <g {...line} filter={`url(#${filterId})`}>
        {name === 'wheat' && (
          <g stroke="#D9902B">
            <path d="M50 98C48 72 53 42 50 14M44 24L38 4M56 24L62 4M50 6V-4" />
            {grains.map(([x, y, r]) => (
              <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={4} ry={9} transform={`rotate(${r} ${x} ${y})`} />
            ))}
            <ellipse cx={50} cy={14} rx={3.6} ry={9} />
          </g>
        )}
        {name === 'sprig' && (
          <g stroke="#839958">
            <path d="M50 98C46 72 54 42 50 10M49 72C32 68 24 54 22 44C38 46 48 58 49 72ZM49 72L29 51M51 54C68 52 76 40 78 30C62 32 52 42 51 54ZM51 54L72 36M48 90C34 90 26 82 22 74C36 72 46 80 48 90ZM50 10C42 20 44 30 50 36C56 30 58 20 50 10ZM50 14V32" />
          </g>
        )}
        {name === 'tomato' && (
          <g>
            <path stroke="#C97F74" d="M50 30C26 26 14 48 18 66C22 86 42 94 52 92C72 90 86 76 84 56C82 38 68 28 50 30ZM28 52C30 44 36 40 42 40M62 60L74 54M60 68L76 62M58 76L72 70" />
            <path stroke="#839958" d="M50 30L41 39L50 35L59 39ZM50 30V18C56 14 62 16 64 10M50 30L36 30M50 30L64 31" />
          </g>
        )}
        {name === 'carrot' && (
          <g>
            <path stroke="#D9902B" d="M58 34C66 32 74 38 72 46L42 94C40 96 38 94 38 92ZM59 48L67 50M55 60L63 62M50 74L57 76M62 40L68 42" />
            <path stroke="#839958" d="M66 34C68 22 64 14 58 8M66 34C74 26 80 20 90 18M66 34C66 22 72 14 74 6" />
          </g>
        )}
      </g>
    </svg>
  );
}
