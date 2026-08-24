import { useState, useEffect } from 'react'
import { supabase } from './supabase'

interface Match {
  id: string
  name: string
  created_at: string
}

interface MatchHistoryProps {
  refreshKey: number
}

export default function MatchHistory({ refreshKey }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [matchDetails, setMatchDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [refreshKey])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMatches(data)
  }

  const handleSelectMatch = async (matchId: string) => {
    if (selectedMatch === matchId) {
      setSelectedMatch(null)
      setMatchDetails([])
      return
    }

    setSelectedMatch(matchId)
    setLoadingDetails(true)

    const { data } = await supabase
      .from('player_match_stats')
      .select(`
        *,
        players (
          name,
          position
        )
      `)
      .eq('match_id', matchId)

    if (data) {
      setMatchDetails(data)
    }
    setLoadingDetails(false)
  }

  return (
    <div
      style={{
        backgroundColor: '#002850',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #0059B3',
      }}
    >
      <h2 style={{ color: '#FFD25F', margin: '0 0 16px 0', fontSize: '20px' }}>
        📋 Matchhistorik
      </h2>

      {matches.length === 0 ? (
        <p style={{ color: '#B0C4DE', margin: 0 }}>Inga spelade matcher ännu.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {matches.map((m) => {
            const isExpanded = selectedMatch === m.id
            const dateStr = new Date(m.created_at).toLocaleDateString('sv-SE')

            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: '#001F3F',
                  borderRadius: '8px',
                  border: '1px solid #003A73',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => handleSelectMatch(m.id)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  <span style={{ color: '#E8E8E8' }}>{m.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#B0C4DE' }}>{dateStr}</span>
                    <span style={{ color: '#FFD25F' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #003A73' }}>
                    {loadingDetails ? (
                      <p style={{ color: '#B0C4DE', marginTop: '12px' }}>Laddar statistik...</p>
                    ) : matchDetails.length === 0 ? (
                      <p style={{ color: '#B0C4DE', marginTop: '12px' }}>
                        Ingen statistik registrerad för denna match.
                      </p>
                    ) : (
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginTop: '12px',
                          fontSize: '14px',
                        }}
                      >
                        <thead>
                          <tr style={{ color: '#FFD25F', textAlign: 'left' }}>
                            <th style={{ padding: '6px' }}>Spelare</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>Mål</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>Ass</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>UTV</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchDetails.map((row) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #002850' }}>
                              <td style={{ padding: '6px' }}>
                                {row.players?.name || 'Okänd spelare'}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                {row.goals || 0}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                {row.assists || 0}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                {row.penalty_minutes || 0}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                {row.plus_minus || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}