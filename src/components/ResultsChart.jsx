// input: results array from test runs
// output: visual bar chart ranking models by speed
// pos: visualization component rendered in advanced mode below results table

import { Typography } from 'antd'
const { Text } = Typography

const MEDALS = ['🥇', '🥈', '🥉']

/* eslint-disable react/prop-types */
export function ResultsChart({ results }) {
  const valid = results
    .filter(r => r.status === 'done' && r.total_speed !== 'Error')
    .map(r => ({
      name: r.provider,
      model: r.modelName,
      speed: parseFloat(r.total_speed) || 0,
      firstToken: parseFloat(r.first_token_time) || 0,
      totalTime: parseFloat(r.total_time) || 0,
      tokens: r.actual_tokens || null,
    }))
    .sort((a, b) => b.speed - a.speed)

  if (!valid.length) return null

  const maxSpeed = Math.max(...valid.map(d => d.speed), 1)

  return (
    <div className="results-chart">
      <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>🏆 速度排名</Text>
      {valid.map((item, i) => (
        <div key={`${item.name}-${item.model}`} className="chart-row">
          <div className="chart-rank">{MEDALS[i] || `#${i + 1}`}</div>
          <div className="chart-info">
            <Text strong className="chart-name">{item.name}</Text>
            <Text type="secondary" className="chart-model">{item.model}</Text>
          </div>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{ width: `${(item.speed / maxSpeed) * 100}%` }}
            />
          </div>
          <div className="chart-metrics">
            <span className="chart-speed">{item.speed} <small>t/s</small></span>
            <span className="chart-time">{item.totalTime}s</span>
          </div>
        </div>
      ))}
    </div>
  )
}
