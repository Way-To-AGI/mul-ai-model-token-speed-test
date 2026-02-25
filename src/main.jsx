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
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          borderRadius: 10,
          colorPrimary: '#10b981',
          colorBgBase: '#09090b',
          colorBgContainer: '#18181b',
          colorBgElevated: '#1f1f23',
          colorBorder: 'rgba(255,255,255,0.08)',
          colorBorderSecondary: 'rgba(255,255,255,0.06)',
          fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
        },
        components: {
          Card: { colorBgContainer: '#18181b' },
          Table: { colorBgContainer: 'transparent', headerBg: 'rgba(255,255,255,0.03)' },
          Input: { colorBgContainer: '#111113' },
          Select: { colorBgContainer: '#111113' },
          Drawer: { colorBgElevated: '#18181b' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
