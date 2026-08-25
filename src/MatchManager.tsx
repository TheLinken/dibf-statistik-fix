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
    
    // Bockar i "Deltog" automatiskt om man matar in statistik
    if (typeof value === 'number' && value !== 0) {
      updated[index].played = true
    }
    
    setStats(updated)
  }

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enbart spelare som är ikryssade sparas
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
    <form onSubmit={handleSaveMatch} className="space-y-6 max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold">Lägg till match & statistik</h2>
      
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Motståndare"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          required
          className="border p-2 rounded flex-1"
        />
        <input
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          required
          className="border p-2 rounded"
        />
      </div>

      {/* UTESPELARE */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Utespelare</h3>
        {fieldPlayers.map((player) => {
          const originalIndex = stats.findIndex((s) => s.player_id === player.player_id)
          return (
            <div key={player.player_id} className="flex items-center gap-3 border-b py-2">
              <input
                type="checkbox"
                checked={player.played}
                onChange={(e) => handleStatChange(originalIndex, 'played', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="w-40 font-medium">{player.name}</span>
              <div className="flex gap-2 items-center">
                <label className="text-sm">Mål:</label>
                <input
                  type="number"
                  min="0"
                  value={player.goals}
                  onChange={(e) => handleStatChange(originalIndex, 'goals', parseInt(e.target.value) || 0)}
                  className="w-16 border p-1 rounded"
                />
                <label className="text-sm">Ass:</label>
                <input
                  type="number"
                  min="0"
                  value={player.assists}
                  onChange={(e) => handleStatChange(originalIndex, 'assists', parseInt(e.target.value) || 0)}
                  className="w-16 border p-1 rounded"
                />
                <label className="text-sm">UTV:</label>
                <input
                  type="number"
                  min="0"
                  value={player.penalties}
                  onChange={(e) => handleStatChange(originalIndex, 'penalties', parseInt(e.target.value) || 0)}
                  className="w-16 border p-1 rounded"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* MÅLVAKTER */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Målvakter</h3>
        {goalKeepers.map((gk) => {
          const originalIndex = stats.findIndex((s) => s.player_id === gk.player_id)
          return (
            <div key={gk.player_id} className="flex items-center gap-3 border-b py-2 bg-slate-50 p-2 rounded">
              <input
                type="checkbox"
                checked={gk.played}
                onChange={(e) => handleStatChange(originalIndex, 'played', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="w-40 font-medium">{gk.name}</span>
              <div className="flex gap-2 items-center">
                <label className="text-sm">Insläppta:</label>
                <input
                  type="number"
                  min="0"
                  value={gk.goals_against}
                  onChange={(e) => handleStatChange(originalIndex, 'goals_against', parseInt(e.target.value) || 0)}
                  className="w-16 border p-1 rounded"
                />
                <label className="text-sm">Räddningar:</label>
                <input
                  type="number"
                  min="0"
                  value={gk.saves}
                  onChange={(e) => handleStatChange(originalIndex, 'saves', parseInt(e.target.value) || 0)}
                  className="w-16 border p-1 rounded"
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sparar...' : 'Spara statistik för matchen'}
      </button>
    </form>
  )
}

export default MatchManager