import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './supabase'

interface PlayerManagerProps {
  onPlayerAdded: () => void
}

export default function PlayerManager({ onPlayerAdded }: PlayerManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [position, setPosition] = useState('Forward')

  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const { error } = await supabase.from('players').insert([
      {
        name: name.trim(),
        position,
      },
    ])

    if (error) {
      alert('Kunde inte lägga till spelare: ' + error.message)
    } else {
      setName('')
      onPlayerAdded()
      alert('Spelare tillagd!')
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#003A73',
        borderRadius: '12px',
        color: '#E8E8E8',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #0059B3',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '24px',
          color: '#FFD25F',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span>{isOpen ? '▼' : '►'}</span> Lägg till ny spelare
      </button>

      {isOpen && (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <form
            onSubmit={handleAddPlayer}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Spelarens namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #0059B3',
                backgroundColor: '#002850',
                color: '#E8E8E8',
                fontSize: '14px',
                minWidth: '200px',
              }}
            />

            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #0059B3',
                backgroundColor: '#002850',
                color: '#E8E8E8',
                fontSize: '14px',
              }}
            >
              <option value="Forward">Forward</option>
              <option value="Center">Center</option>
              <option value="Back">Back</option>
              <option value="Målvakt">Målvakt</option>
            </select>

            <button
              type="submit"
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#FFD25F',
                color: '#002850',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Spara spelare
            </button>
          </form>
        </div>
      )}
    </div>
  )
}