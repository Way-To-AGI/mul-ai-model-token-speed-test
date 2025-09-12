import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm: theme.defaultAlgorithm, token: { borderRadius: 8 } }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
