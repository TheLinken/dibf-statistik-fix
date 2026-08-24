import { useEffect, useState } from 'react'
import { supabase } from './supabase'

interface PlayerStat {
  id: string
  name: string
  number: string
  position: string
  goals: number
  assists: number
  points: number
  penalty_minutes: number
  plus_minus: number
}

interface Totals {
  goals: number
  assists: number
  penalty_minutes: number
  plus_minus: number
}

export default function TeamTable() {
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlayerStat; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  })

  // Tillstånd för att redigera spelare
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNumber, setEditNumber] = useState('')
  const [editPosition, setEditPosition] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        id,
        name,
        number,
        position,
        player_match_stats (
          goals,
          assists,
          penalty_minutes,
          plus_minus
        )
      `)

    if (error) {
      console.error('Fel vid hämtning:', error)
      return
    }

    if (!players) return

    const formattedData: PlayerStat[] = players.map((player: any) => {
      const statsList = player.player_match_stats || []

      const totals: Totals = statsList.reduce((acc: Totals, curr: any) => ({
        goals: acc.goals + (curr.goals || 0),
        assists: acc.assists + (curr.assists || 0),
        penalty_minutes: acc.penalty_minutes + (curr.penalty_minutes || 0),
        plus_minus: acc.plus_minus + (curr.plus_minus || 0),
      }), { goals: 0, assists: 0, penalty_minutes: 0, plus_minus: 0 })

      return {
        id: player.id,
        name: player.name || 'Okänd',
        number: player.number || '-',
        position: player.position || 'Ej angiven',
        goals: totals.goals,
        assists: totals.assists,
        points: totals.goals + totals.assists,
        penalty_minutes: totals.penalty_minutes,
        plus_minus: totals.plus_minus
      }
    })

    setStats(formattedData)
  }

  const handleSort = (key: keyof PlayerStat) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Radera spelare
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Är du säker på att du vill radera ${name}? All statistik för spelaren tas också bort.`)) {
      return
    }

    const { error } = await supabase.from('players').delete().eq('id', id)

    if (error) {
      console.error('Fel vid radering:', error)
      alert('Kunde inte radera spelaren.')
    } else {
      fetchStats()
    }
  }

  // Starta redigering
  const handleStartEdit = (player: PlayerStat) => {
    setEditingPlayerId(player.id)
    setEditName(player.name)
    setEditNumber(player.number === '-' ? '' : player.number)
    setEditPosition(player.position)
  }

  // Spara ändringar
  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from('players')
      .update({
        name: editName,
        number: editNumber,
        position: editPosition,
      })
      .eq('id', id)

    if (error) {
      console.error('Fel vid uppdatering:', error)
      alert('Kunde inte uppdatera spelaren.')
    } else {
      setEditingPlayerId(null)
      fetchStats()
    }
  }

  const sortedStats = [...stats].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
      <h2>Lagstatistik</h2>
      <table border={1} cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left', borderColor: '#444' }}>
        <thead>
          <tr style={{ cursor: 'pointer', backgroundColor: '#333' }}>
            <th onClick={() => handleSort('number')}>#</th>
            <th onClick={() => handleSort('name')}>Namn</th>
            <th onClick={() => handleSort('position')}>Pos</th>
            <th onClick={() => handleSort('goals')}>Mål</th>
            <th onClick={() => handleSort('assists')}>Assist</th>
            <th onClick={() => handleSort('points')}>Poäng</th>
            <th onClick={() => handleSort('penalty_minutes')}>UTV (min)</th>
            <th onClick={() => handleSort('plus_minus')}>+/-</th>
            <th style={{ cursor: 'default' }}>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          {sortedStats.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                Inga spelare hittades.
              </td>
            </tr>
          ) : (
            sortedStats.map(player => (
              <tr key={player.id}>
                {editingPlayerId === player.id ? (
                  // Redigeringsläge
                  <>
                    <td>
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        style={{ width: '50px', padding: '4px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ padding: '4px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        style={{ padding: '4px' }}
                      >
                        <option value="Målvakt">Målvakt</option>
                        <option value="Back">Back</option>
                        <option value="Center">Center</option>
                        <option value="Forward">Forward</option>
                      </select>
                    </td>
                    <td>{player.goals}</td>
                    <td>{player.assists}</td>
                    <td><strong>{player.points}</strong></td>
                    <td>{player.penalty_minutes}</td>
                    <td>{player.plus_minus > 0 ? `+${player.plus_minus}` : player.plus_minus}</td>
                    <td>
                      <button onClick={() => handleSaveEdit(player.id)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Spara
                      </button>
                      <button onClick={() => setEditingPlayerId(null)} style={{ padding: '4px 8px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Avbryt
                      </button>
                    </td>
                  </>
                ) : (
                  // Normal visning
                  <>
                    <td>{player.number}</td>
                    <td>{player.name}</td>
                    <td>{player.position}</td>
                    <td>{player.goals}</td>
                    <td>{player.assists}</td>
                    <td><strong>{player.points}</strong></td>
                    <td>{player.penalty_minutes}</td>
                    <td>{player.plus_minus > 0 ? `+${player.plus_minus}` : player.plus_minus}</td>
                    <td>
                      <button onClick={() => handleStartEdit(player)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Ändra
                      </button>
                      <button onClick={() => handleDelete(player.id, player.name)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Radera
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}