import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { filterBulgarianCities } from '../../lib/bulgarianCities'

type CityAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  inputStyle: CSSProperties
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Започнете да пишете град...',
  disabled = false,
  error,
  inputStyle,
  onFocus,
  onBlur,
}: CityAutocompleteProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const suggestions = useMemo(() => filterBulgarianCities(value, 12), [value])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [value, suggestions.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectCity = (city: string) => {
    onChange(city)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = suggestions[highlightedIndex]
      if (selected) selectCity(selected)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && suggestions.length > 0 && value.trim().length > 0

  return (
    <div ref={containerRef}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            paddingLeft: 38,
            borderColor: error ? '#FCA5A5' : (inputStyle.border as string | undefined),
          }}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={(e) => {
            onFocus?.(e)
            if (value.trim()) setOpen(true)
          }}
          onBlur={(e) => {
            onBlur?.(e)
            window.setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={handleKeyDown}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'calc(100% + 4px)',
              margin: 0,
              padding: '4px 0',
              listStyle: 'none',
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 30,
            }}
          >
            {suggestions.map((city, index) => (
              <li key={city} role="option" aria-selected={index === highlightedIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCity(city)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: index === highlightedIndex ? '#F5F3FF' : 'transparent',
                    color: '#1E293B',
                    fontSize: 14,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
