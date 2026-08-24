import React, { useState } from 'react'
import { supabase } from './supabase'

interface AddPlayerProps {
  onPlayerAdded: () => void
}

export default function AddPlayer({ onPlayerAdded }: AddPlayerProps) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState('Forward')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)

    const { error } = await supabase.from('players').insert([
      {
        name,
        number: number || '',
        position,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Fel vid tillägg av spelare:', error)
      alert('Kunde inte lägga till spelare')
    } else {
      setName('')
      setNumber('')
      onPlayerAdded()
    }
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px', marginBottom: '20px', color: '#fff' }}>
      <h3>Lägg till ny spelare</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Namn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555' }}
        />
        <input
          type="text"
          placeholder="Tröjnummer (t.ex. 10, 99A)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          style={{ padding: '8px', width: '140px', borderRadius: '4px', border: '1px solid #555' }}
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555' }}
        >
          <option value="Målvakt">Målvakt</option>
          <option value="Back">Back</option>
          <option value="Center">Center</option>
          <option value="Forward">Forward</option>
        </select>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Sparar...' : 'Spara spelare'}
        </button>
      </form>
    </div>
  )
}