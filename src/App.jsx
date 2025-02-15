import { useState } from 'react'
import { Button, Space, Typography } from 'antd'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const { Title } = Typography

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <Title level={1}>Vite + React + Ant Design</Title>
      <div className="card">
        <Space>
          <Button type="primary" onClick={() => setCount((count) => count + 1)}>
            Count is: {count}
          </Button>
          <Button>Reset</Button>
        </Space>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
