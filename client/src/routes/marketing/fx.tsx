/* --------------------------------------------------------------------------
   Marketing motion primitives.
   Each one does a single trick. All motion is transform / opacity / mask,
   and every one collapses to a static state under prefers-reduced-motion
   (handled in app.css).
   -------------------------------------------------------------------------- */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type PointerEvent as RPointerEvent,
} from 'react'

/** Writes the pointer position into --x / --y on the element. */
export function trackPointer(e: RPointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--x', `${e.clientX - r.left}px`)
  el.style.setProperty('--y', `${e.clientY - r.top}px`)
}

/** Fades + lifts children in the first time they enter the viewport. */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
  style,
}: {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
  style?: CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={['mx-reveal', className].filter(Boolean).join(' ')}
      data-in={shown || undefined}
      style={{ ...style, '--d': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}

/** Headline words resolve out of a blur, one after another. */
export function TextGenerate({ text, accent, start = 0 }: { text: string; accent?: string; start?: number }) {
  const words = text.split(' ')
  const accentWords = accent ? accent.split(' ') : []
  let i = 0
  return (
    <>
      {words.map((w) => {
        const d = start + i++ * 70
        return (
          <span key={`w-${i}`} className="mx-word" style={{ '--d': `${d}ms` } as CSSProperties}>
            {w}{' '}
          </span>
        )
      })}
      {accentWords.length ? (
        <em className="mx-accent-phrase">
          {accentWords.map((w, j) => {
            const d = start + i++ * 70
            return (
              <span key={`a-${j}`} className="mx-word" style={{ '--d': `${d}ms` } as CSSProperties}>
                {w}
                {j < accentWords.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </em>
      ) : null}
    </>
  )
}

/** Infinite horizontal strip. Content is rendered twice and slid -50%. */
export function Marquee({ children, speed = 48 }: { children: ReactNode; speed?: number }) {
  return (
    <div className="mx-marquee" style={{ '--speed': `${speed}s` } as CSSProperties}>
      <div className="mx-marquee__track">
        <div className="mx-marquee__group">{children}</div>
        <div className="mx-marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}

/** A thin conic gradient travels around the border of its child. */
export function MovingBorder({
  children,
  className,
  radius = 20,
}: {
  children: ReactNode
  className?: string
  radius?: number
}) {
  return (
    <div className={['mx-mborder', className].filter(Boolean).join(' ')} style={{ '--r': `${radius}px` } as CSSProperties}>
      <span className="mx-mborder__spin" aria-hidden="true" />
      <div className="mx-mborder__inner">{children}</div>
    </div>
  )
}

/** Card whose border and surface light up around the cursor. */
export function GlowCard({
  as: Tag = 'div',
  className,
  children,
  ...rest
}: {
  as?: ElementType
  className?: string
  children: ReactNode
} & Record<string, unknown>) {
  return (
    <Tag className={['mx-glow', className].filter(Boolean).join(' ')} onPointerMove={trackPointer} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Vertical beam beside long content; its fill follows scroll progress through
 * the container. Returns progress 0..1 to children so steps can light up.
 */
export function TracingBeam({ children }: { children: (progress: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when top hits 65% of viewport, 1 when bottom passes 65%.
      const anchor = vh * 0.65
      const next = Math.min(1, Math.max(0, (anchor - r.top) / r.height))
      setP(next)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="mx-beam" style={{ '--p': p } as CSSProperties}>
      <div className="mx-beam__rail" aria-hidden="true">
        <div className="mx-beam__fill" />
        <div className="mx-beam__head" />
      </div>
      <div className="mx-beam__content">{children(p)}</div>
    </div>
  )
}

/** Small section eyebrow: a pill with a lit dot. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mx-eyebrow">
      <span className="mx-eyebrow__dot" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Deterministic barcode: widths derived from the string, so it never shimmers between renders. */
export function Barcode({ value, bars = 46 }: { value: string; bars?: number }) {
  let seed = 0
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const out: number[] = []
  for (let i = 0; i < bars; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0
    out.push(1 + (seed % 3))
  }
  return (
    <div className="mx-barcode" aria-hidden="true">
      {out.map((w, i) => (
        <span key={i} style={{ inlineSize: `${w}px`, opacity: i % 2 ? 0 : 1 }} />
      ))}
    </div>
  )
}
