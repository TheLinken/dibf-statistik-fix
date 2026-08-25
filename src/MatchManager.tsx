import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

interface Player {
  id: string
  name: string
  position: 'Utespelare' | 'Målvakt'
}

interface PlayerStatInput {
  player_id: string
  name: string
  position: 'Utespelare' | 'Målvakt'
  played: boolean
  goals: number
  assists: number
  penalties: number
  goals_against: number
  saves: number
}

export const MatchManager: React.FC<{ onMatchAdded?: () => void }> = ({ onMatchAdded }) => {
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState<PlayerStatInput[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) {
        console.error('Kunde inte hämta spelare:', error)
        return
      }

      if (data) {
        setStats(
          data.map((p: Player) => ({
            player_id: p.id,
            name: p.name,
            position: p.position,
            played: false,
            goals: 0,
            assists: 0,
            penalties: 0,
            goals_against: 0,
            saves: 0,
          }))
        )
      }
    }

    fetchPlayers()
  }, [])

  const handleStatChange = (
    index: number,
    field: keyof PlayerStatInput,
    value: number | boolean
  ) => {
    const updated = [...stats]
    updated[index] = { ...updated[index], [field]: value }
    
    if (typeof value === 'number' && value !== 0) {
      updated[index].played = true
    }
    
    setStats(updated)
  }

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const activeStats = stats.filter((s) => s.played)

    if (activeStats.length === 0) {
      alert('Välj minst en spelare som deltog i matchen.')
      return
    }

    setLoading(true)

    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{ opponent, match_date: matchDate }])
        .select()
        .single()

      if (matchError) throw matchError

      const matchStatsToInsert = activeStats.map((s) => ({
        match_id: matchData.id,
        player_id: s.player_id,
        goals: s.position === 'Utespelare' ? s.goals : 0,
        assists: s.position === 'Utespelare' ? s.assists : 0,
        penalties: s.penalties,
        goals_against: s.position === 'Målvakt' ? s.goals_against : 0,
        saves: s.position === 'Målvakt' ? s.saves : 0,
      }))

      const { error: statsError } = await supabase
        .from('player_match_stats')
        .insert(matchStatsToInsert)

      if (statsError) throw statsError

      alert('Matchen och statistiken har sparats!')
      setOpponent('')
      setStats(stats.map((s) => ({ ...s, played: false, goals: 0, assists: 0, penalties: 0, goals_against: 0, saves: 0 })))
      if (onMatchAdded) onMatchAdded()
    } catch (err: any) {
      alert(`Kunde inte spara statistik: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fieldPlayers = stats.filter((s) => s.position === 'Utespelare')
  const goalKeepers = stats.filter((s) => s.position === 'Målvakt')

  return (
    <form onSubmit={handleSaveMatch} style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Lägg till match & statistik</h2>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="Motståndare"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <input
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px' }}
        />
      </div>

      {/* UTESPELARE */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Utespelare</h3>
        {fieldPlayers.map((player) => {
          const originalIndex = stats.findIndex((s) => s.player_id === player.player_id)
          return (
            <div key={player.player_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={player.played}
                onChange={(e) => handleStatChange(originalIndex, 'played', e.target.checked)}
              />
              <span style={{ width: '180px', fontWeight: 'bold' }}>{player.name}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label>Mål:</label>
                <input
                  type="number"
                  min="0"
                  value={player.goals}
                  onChange={(e) => handleStatChange(originalIndex, 'goals', parseInt(e.target.value) || 0)}
                  style={{ width: '50px', textAlign: 'center' }}
                />
                <label>Ass:</label>
                <input
                  type="number"
                  min="0"
                  value={player.assists}
                  onChange={(e) => handleStatChange(originalIndex, 'assists', parseInt(e.target.value) || 0)}
                  style={{ width: '50px', textAlign: 'center' }}
                />
                <label>UTV:</label>
                <input
                  type="number"
                  min="0"
                  value={player.penalties}
                  onChange={(e) => handleStatChange(originalIndex, 'penalties', parseInt(e.target.value) || 0)}
                  style={{ width: '50px', textAlign: 'center' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* MÅLVAKTER */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Målvakter</h3>
        {goalKeepers.map((gk) => {
          const originalIndex = stats.findIndex((s) => s.player_id === gk.player_id)
          return (
            <div key={gk.player_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={gk.played}
                onChange={(e) => handleStatChange(originalIndex, 'played', e.target.checked)}
              />
              <span style={{ width: '180px', fontWeight: 'bold' }}>{gk.name}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label>Insläppta:</label>
                <input
                  type="number"
                  min="0"
                  value={gk.goals_against}
                  onChange={(e) => handleStatChange(originalIndex, 'goals_against', parseInt(e.target.value) || 0)}
                  style={{ width: '50px', textAlign: 'center' }}
                />
                <label>Räddningar:</label>
                <input
                  type="number"
                  min="0"
                  value={gk.saves}
                  onChange={(e) => handleStatChange(originalIndex, 'saves', parseInt(e.target.value) || 0)}
                  style={{ width: '50px', textAlign: 'center' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {loading ? 'Sparar...' : 'Spara statistik för matchen'}
        </button>
      </div>
    </form>
  )
}

export default MatchManager