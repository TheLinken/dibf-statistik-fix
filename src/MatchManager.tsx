import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './supabase'

interface MatchManagerProps {
  onStatsUpdated: () => void
  refreshKey: number
  selectedMatchId: string
  setSelectedMatchId: (id: string) => void
}

export default function MatchManager({
  onStatsUpdated,
  refreshKey,
  selectedMatchId,
  setSelectedMatchId,
}: MatchManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newMatchName, setNewMatchName] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchMatches()
    fetchPlayers()
  }, [refreshKey])

  useEffect(() => {
    if (selectedMatchId) {
      fetchMatchStats(selectedMatchId)
    } else {
      setStats({})
    }
  }, [selectedMatchId])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMatches(data)
  }

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*').order('name')
    if (data) setPlayers(data)
  }

  const fetchMatchStats = async (matchId: string) => {
    const { data } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('match_id', matchId)

    if (data) {
      const statsMap: Record<string, any> = {}
      data.forEach((row) => {
        statsMap[row.player_id] = {
          goals: row.goals || 0,
          assists: row.assists || 0,
          penalty_minutes: row.penalty_minutes || 0,
          plus_minus: row.plus_minus || 0,
          wins: row.wins || 0,
          saves: row.saves || 0,
          goals_against: row.goals_against || 0,
        }
      })
      setStats(statsMap)
    }
  }

  const handleCreateMatch = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMatchName.trim()) return

    const { data, error } = await supabase
      .from('matches')
      .insert([{ name: newMatchName.trim() }])
      .select()

    if (error) {
      alert('Kunde inte skapa match: ' + error.message)
    } else if (data && data[0]) {
      setNewMatchName('')
      await fetchMatches()
      setSelectedMatchId(data[0].id)
      alert('Match skapad! Du kan nu fylla i statistik nedan.')
    }
  }

  const handleStatChange = (playerId: string, field: string, value: number) => {
    setStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {
          goals: 0,
          assists: 0,
          penalty_minutes: 0,
          plus_minus: 0,
          wins: 0,
          saves: 0,
          goals_against: 0,
        }),
        [field]: value,
      },
    }))
  }

  const handleSaveStats = async () => {
    if (!selectedMatchId) {
      alert('Välj en match först!')
      return
    }

    const rowsToUpsert = players.map((p) => {
      const pStats = stats[p.id] || {}
      return {
        match_id: selectedMatchId,
        player_id: p.id,
        goals: pStats.goals || 0,
        assists: pStats.assists || 0,
        penalty_minutes: pStats.penalty_minutes || 0,
        plus_minus: pStats.plus_minus || 0,
        wins: pStats.wins || 0,
        saves: pStats.saves || 0,
        goals_against: pStats.goals_against || 0,
      }
    })

    const { error } = await supabase
      .from('player_match_stats')
      .upsert(rowsToUpsert, { onConflict: 'player_id,match_id' })

    if (error) {
      alert('Kunde inte spara statistik: ' + error.message)
    } else {
      alert('Statistik sparad!')
      onStatsUpdated()
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
        <span>{isOpen ? '▼' : '►'}</span> Matchhantering & Registrering
      </button>

      {isOpen && (
        <div style={{ padding: '0 24px 24px 24px' }}>
          {/* Skapa ny match */}
          <form
            onSubmit={handleCreateMatch}
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Matchnamn (t.ex. Lag A vs Lag B)"
              value={newMatchName}
              onChange={(e) => setNewMatchName(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #0059B3',
                backgroundColor: '#002850',
                color: '#E8E8E8',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#FFD25F',
                color: '#002850',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Skapa match
            </button>
          </form>

          {/* Välj match att redigera */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
              Välj match att fylla i / ändra statistik för:
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #0059B3',
                backgroundColor: '#002850',
                color: '#E8E8E8',
              }}
            >
              <option value="">-- Välj en match --</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({new Date(m.created_at).toLocaleDateString('sv-SE')})
                </option>
              ))}
            </select>
          </div>

          {/* Registrera stats för vald match */}
          {selectedMatchId && (
            <div>
              <h3 style={{ color: '#FFD25F', marginBottom: '12px' }}>Fyll i statistik:</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#001F3F', color: '#FFD25F', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Spelare</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Mål</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Ass</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>UTV</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>+/-</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Målvakt: Vinst</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Målvakt: Räddn.</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Målvakt: Insläppta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => {
                      const pStats = stats[p.id] || {}
                      const isGoalie = p.position === 'Målvakt'

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #002850' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>
                            {p.name} <span style={{ fontSize: '11px', color: '#B0C4DE' }}>({p.position})</span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={pStats.goals ?? 0}
                              onChange={(e) =>
                                handleStatChange(p.id, 'goals', parseInt(e.target.value) || 0)
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={pStats.assists ?? 0}
                              onChange={(e) =>
                                handleStatChange(p.id, 'assists', parseInt(e.target.value) || 0)
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={pStats.penalty_minutes ?? 0}
                              onChange={(e) =>
                                handleStatChange(
                                  p.id,
                                  'penalty_minutes',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              value={pStats.plus_minus ?? 0}
                              onChange={(e) =>
                                handleStatChange(
                                  p.id,
                                  'plus_minus',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              disabled={!isGoalie}
                              checked={pStats.wins === 1}
                              onChange={(e) =>
                                handleStatChange(p.id, 'wins', e.target.checked ? 1 : 0)
                              }
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              disabled={!isGoalie}
                              value={pStats.saves ?? 0}
                              onChange={(e) =>
                                handleStatChange(p.id, 'saves', parseInt(e.target.value) || 0)
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              disabled={!isGoalie}
                              value={pStats.goals_against ?? 0}
                              onChange={(e) =>
                                handleStatChange(
                                  p.id,
                                  'goals_against',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              style={{ width: '50px', textAlign: 'center', padding: '4px' }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleSaveStats}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#FFD25F',
                  color: '#002850',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                💾 Spara statistik för matchen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}