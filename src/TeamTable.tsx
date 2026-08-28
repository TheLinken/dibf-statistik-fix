import { useState, useEffect } from 'react'
import { supabase } from './supabase'

interface TeamTableProps {
  refreshKey: number
}

type SortField =
  | 'name'
  | 'position'
  | 'matches'
  | 'goals'
  | 'assists'
  | 'points'
  | 'penalty_minutes'
  | 'plus_minus'
  | 'wins'
  | 'saves'
  | 'goals_against'

export default function TeamTable({ refreshKey }: TeamTableProps) {
  const [players, setPlayers] = useState<any[]>([])
  const [matchStats, setMatchStats] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'field' | 'goalie'>('field')
  const [sortField, setSortField] = useState<SortField>('points')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const fetchData = async () => {
    const { data: playersData } = await supabase.from('players').select('*')
    const { data: statsData } = await supabase.from('player_match_stats').select('*')

    if (playersData) setPlayers(playersData)
    if (statsData) setMatchStats(statsData)
  }

  // Sammanställ statistik per spelare
  const playerStats = players.map((player) => {
    const stats = matchStats.filter((s) => s.player_id === player.id)

    const matches = stats.length
    const goals = stats.reduce((sum, s) => sum + (s.goals || 0), 0)
    const assists = stats.reduce((sum, s) => sum + (s.assists || 0), 0)
    const points = goals + assists
    const penalty_minutes = stats.reduce((sum, s) => sum + (s.penalty_minutes || 0), 0)
    const plus_minus = stats.reduce((sum, s) => sum + (s.plus_minus || 0), 0)
    const wins = stats.reduce((sum, s) => sum + (s.wins || 0), 0)
    const saves = stats.reduce((sum, s) => sum + (s.saves || 0), 0)
    const goals_against = stats.reduce((sum, s) => sum + (s.goals_against || 0), 0)

    return {
      ...player,
      matches,
      goals,
      assists,
      points,
      penalty_minutes,
      plus_minus,
      wins,
      saves,
      goals_against,
    }
  })

  // Hantera sortering
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  // Filtrera baserat på flik
  const filteredPlayers = playerStats.filter((p) =>
    activeTab === 'goalie' ? p.position === 'Målvakt' : p.position !== 'Målvakt'
  )

  // Sortera spelarna
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let valA = a[sortField] ?? 0
    let valB = b[sortField] ?? 0

    if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }

    if (valA < valB) return sortAsc ? -1 : 1
    if (valA > valB) return sortAsc ? 1 : -1
    return 0
  })

  const fieldCount = playerStats.filter((p) => p.position !== 'Målvakt').length
  const goalieCount = playerStats.filter((p) => p.position === 'Målvakt').length

  return (
    <div
      style={{
        backgroundColor: '#002850',
        borderRadius: '12px',
        padding: '24px',
        color: '#E8E8E8',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #0059B3',
      }}
    >
      <h1 style={{ color: '#FFD25F', margin: '0 0 4px 0', fontSize: '28px' }}>
        Innebandystatistik
      </h1>
      <p style={{ color: '#B0C4DE', margin: '0 0 20px 0', fontSize: '14px' }}>
        Spelar- och matchstatistik för laget
      </p>

      {/* Flikar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('field')
            setSortField('points')
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'field' ? '#007FFF' : '#001F3F',
            color: '#FFFFFF',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Utespelare ({fieldCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('goalie')
            setSortField('wins')
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'goalie' ? '#007FFF' : '#001F3F',
            color: '#FFFFFF',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Målvakter ({goalieCount})
        </button>
      </div>

      {/* Tabell */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#001F3F', color: '#FFD25F', textAlign: 'left' }}>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: '12px 8px', cursor: 'pointer' }}
              >
                Spelare
              </th>
              <th
                onClick={() => handleSort('position')}
                style={{ padding: '12px 8px', cursor: 'pointer' }}
              >
                Position
              </th>
              <th
                onClick={() => handleSort('matches')}
                style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
              >
                Matcher
              </th>

              {activeTab === 'field' ? (
                <>
                  <th
                    onClick={() => handleSort('goals')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Mål
                  </th>
                  <th
                    onClick={() => handleSort('assists')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Ass
                  </th>
                  <th
                    onClick={() => handleSort('points')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Poäng
                  </th>
                  <th
                    onClick={() => handleSort('penalty_minutes')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    UTV
                  </th>
                  <th
                    onClick={() => handleSort('plus_minus')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    +/-
                  </th>
                </>
              ) : (
                <>
                  <th
                    onClick={() => handleSort('wins')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Vinster
                  </th>
                  <th
                    onClick={() => handleSort('saves')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Räddningar
                  </th>
                  <th
                    onClick={() => handleSort('goals_against')}
                    style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    Insläppta
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((p, index) => (
              <tr
                key={p.id}
                style={{
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid #003A73',
                }}
              >
                <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '10px 8px', color: '#B0C4DE' }}>{p.position}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.matches}</td>

                {activeTab === 'field' ? (
                  <>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.goals}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.assists}</td>
                    <td
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#FFD25F',
                      }}
                    >
                      {p.points}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.penalty_minutes}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.plus_minus}</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.wins}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.saves}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.goals_against}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}