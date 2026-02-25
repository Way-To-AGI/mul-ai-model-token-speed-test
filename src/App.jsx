// input: presets.js (provider/prompt data), openai SDK, antd components
// output: main App component — AI model speed test dashboard
// pos: root UI component rendered by main.jsx

import { useState } from 'react'
import {
  Button, Typography, Card, Input, Switch, Table, Select,
  Tooltip, message, Tag, Segmented, Dropdown, Collapse, Empty,
  Space, Drawer,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, QuestionCircleOutlined,
  ThunderboltOutlined, SaveOutlined, SettingOutlined,
  EyeOutlined, DashboardOutlined, RocketOutlined,
} from '@ant-design/icons'
import './App.css'
import { OpenAI } from 'openai'
import { PROVIDER_PRESETS, PROMPT_TEMPLATES } from './presets'

const { TextArea } = Input
const { Title, Text } = Typography

const STORAGE_KEY = 'ai-speed-test-models'
const LEGACY_KEY = 'deepseek-models'
const MODE_KEY = 'ai-speed-test-view-mode'

function getProviderColor(baseUrl) {
  if (!baseUrl) return '#1677ff'
  try {
    const host = new URL(baseUrl).hostname
    const preset = PROVIDER_PRESETS.find(p => {
      try { return host === new URL(p.baseUrl).hostname } catch { return false }
    })
    return preset?.color || '#1677ff'
  } catch {
    return '#1677ff'
  }
}

function App() {
  const [models, setModels] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY)
    return saved ? JSON.parse(saved) : [
      { id: 1, name: '阿里云-百炼', apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'deepseek-r1', enabled: true },
      { id: 2, name: '硅基流动', apiKey: '', baseUrl: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-R1', enabled: true },
    ]
  })

  const [testMessage, setTestMessage] = useState('你好！很高兴见到你，有什么我可以帮助你的吗？')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState({})
  const [tokenCountMethod, setTokenCountMethod] = useState('char')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(MODE_KEY) || 'simple')
  const [configOpen, setConfigOpen] = useState(false)

  const nextId = () => Math.max(...models.map(m => m.id), 0) + 1

  const handleModeChange = (mode) => {
    setViewMode(mode)
    localStorage.setItem(MODE_KEY, mode)
  }

  const addModel = () => {
    const id = nextId()
    setModels(prev => [...prev, { id, name: `模型 ${id}`, apiKey: '', baseUrl: '', model: '', enabled: true }])
  }

  const addFromPreset = (provider, modelName) => {
    const id = nextId()
    setModels(prev => [...prev, {
      id, name: provider.label, apiKey: '', baseUrl: provider.baseUrl, model: modelName, enabled: true,
    }])
    message.success(`已添加 ${provider.label} · ${modelName}`)
  }

  const removeModel = (id) => setModels(prev => prev.filter(m => m.id !== id))
  const toggleModel = (id, enabled) => setModels(prev => prev.map(m => m.id === id ? { ...m, enabled } : m))
  const updateModel = (id, field, value) => setModels(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const saveConfigurations = () => {
    const json = JSON.stringify(models)
    localStorage.setItem(STORAGE_KEY, json)
    localStorage.setItem(LEGACY_KEY, json)
    message.success('配置已保存')
  }

  const handleTest = async () => {
    const enabled = models.filter(m => m.enabled)
    if (!enabled.length) return message.warning('请至少启用一个模型')
    if (!testMessage.trim()) return message.warning('请输入测试内容')

    setIsLoading(true)
    setResults([])
    setResponses({})

    try {
      await Promise.all(enabled.map(async (model) => {
        try {
          setResults(prev => [...prev, {
            provider: model.name, modelId: model.id, modelName: model.model,
            first_token_time: 'N/A', reasoning_speed: '0', content_speed: '0',
            total_speed: '0', total_time: '0', status: 'loading',
          }])

          const client = new OpenAI({ apiKey: model.apiKey, baseURL: model.baseUrl, dangerouslyAllowBrowser: true })
          const startTime = Date.now()
          let firstTokenTime = null
          let reasoningTokenCount = 0, contentTokenCount = 0
          let reasoningStartTime = null, reasoningEndTime = null
          let contentStartTime = null, contentEndTime = null
          let reasoningContent = '', normalContent = ''

          const stream = await client.chat.completions.create({
            model: model.model, messages: [{ role: 'user', content: testMessage }], stream: true,
          })

          for await (const chunk of stream) {
            if (!chunk.choices?.[0]?.delta) continue
            const delta = chunk.choices[0].delta

            if (firstTokenTime === null && (delta.reasoning_content || delta.content)) {
              firstTokenTime = (Date.now() - startTime) / 1000
            }

            const count = (text) => tokenCountMethod === 'char' ? text.length : 1

            if (delta.reasoning_content) {
              reasoningTokenCount += count(delta.reasoning_content)
              if (!reasoningStartTime) reasoningStartTime = Date.now()
              reasoningEndTime = Date.now()
              reasoningContent += delta.reasoning_content
            } else if (delta.content) {
              contentTokenCount += count(delta.content)
              if (!contentStartTime) contentStartTime = Date.now()
              contentEndTime = Date.now()
              normalContent += delta.content
            }

            const totalTime = (Date.now() - startTime) / 1000
            const rTime = reasoningStartTime ? (reasoningEndTime - reasoningStartTime) / 1000 : 0
            const cTime = contentStartTime ? (contentEndTime - contentStartTime) / 1000 : 0

            setResults(prev => prev.map(r => r.modelId === model.id ? {
              ...r, status: 'streaming',
              first_token_time: firstTokenTime?.toFixed(2) || 'N/A',
              reasoning_speed: rTime > 0 ? (reasoningTokenCount / rTime).toFixed(2) : '0',
              content_speed: cTime > 0 ? (contentTokenCount / cTime).toFixed(2) : '0',
              total_speed: totalTime > 0 ? ((reasoningTokenCount + contentTokenCount) / totalTime).toFixed(2) : '0',
              total_time: totalTime.toFixed(2),
            } : r))

            setResponses(prev => ({ ...prev, [model.id]: { reasoning: reasoningContent, content: normalContent } }))
          }

          setResults(prev => prev.map(r => r.modelId === model.id ? { ...r, status: 'done' } : r))
        } catch (error) {
          console.error(`Error testing ${model.name}:`, error)
          setResults(prev => prev.map(r => r.modelId === model.id ? {
            ...r, status: 'error',
            first_token_time: 'Error', reasoning_speed: 'Error',
            content_speed: 'Error', total_speed: 'Error', total_time: 'Error',
          } : r))
          setResponses(prev => ({ ...prev, [model.id]: { reasoning: '', content: error.message || '请求失败' } }))
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatus = (modelId) => {
    if (!isLoading && results.length === 0) return 'idle'
    const r = results.find(x => x.modelId === modelId)
    if (!r) return isLoading ? 'waiting' : 'idle'
    return r.status || 'idle'
  }

  const presetMenuItems = PROVIDER_PRESETS.map(p => ({
    key: p.key,
    label: <span><span style={{ marginRight: 6 }}>{p.icon}</span>{p.label}</span>,
    children: p.models.map(m => ({
      key: `${p.key}::${m}`,
      label: m,
      onClick: () => addFromPreset(p, m),
    })),
  }))

  const columns = [
    { title: '服务商', dataIndex: 'provider', key: 'provider', render: (t, r) => <Text strong>{t}<Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{r.modelName}</Text></Text> },
    { title: '首Token(s)', dataIndex: 'first_token_time', key: 'ftt', render: v => <span className={v === 'Error' ? 'stat-error' : ''}>{v}</span> },
    { title: '推理 t/s', dataIndex: 'reasoning_speed', key: 'rs', render: v => <span className={v === 'Error' ? 'stat-error' : ''}>{v}</span> },
    { title: '内容 t/s', dataIndex: 'content_speed', key: 'cs', render: v => <span className={v === 'Error' ? 'stat-error' : ''}>{v}</span> },
    { title: '总 t/s', dataIndex: 'total_speed', key: 'ts', render: v => <span className={v === 'Error' ? 'stat-error' : ''}>{v}</span> },
    { title: '总时间(s)', dataIndex: 'total_time', key: 'tt', render: v => <span className={v === 'Error' ? 'stat-error' : ''}>{v}</span> },
  ]

  const statusTag = (status) => {
    switch (status) {
      case 'waiting': case 'loading': return <Tag color="default">等待中</Tag>
      case 'streaming': return <Tag color="processing"><span className="pulse-dot" />接收中</Tag>
      case 'done': return <Tag color="success">完成</Tag>
      case 'error': return <Tag color="error">错误</Tag>
      default: return null
    }
  }

  const renderModelConfig = (model, compact = false) => (
    <div key={model.id} className={compact ? 'compact-model-item' : 'drawer-model-item'} style={{ borderLeftColor: getProviderColor(model.baseUrl) }}>
      <div className="model-item-header">
        <Switch size="small" checked={model.enabled} onChange={c => toggleModel(model.id, c)} />
        <Input
          size="small" variant="borderless"
          value={model.name} onChange={e => updateModel(model.id, 'name', e.target.value)}
          className="model-name-input" placeholder="名称"
        />
        {model.enabled ? <Tag color="green" bordered={false}>ON</Tag> : <Tag bordered={false}>OFF</Tag>}
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeModel(model.id)} />
      </div>
      <div className="model-item-fields">
        <Input.Password size="small" placeholder="API Key" value={model.apiKey} onChange={e => updateModel(model.id, 'apiKey', e.target.value)} />
        <Input size="small" placeholder="Base URL" value={model.baseUrl} onChange={e => updateModel(model.id, 'baseUrl', e.target.value)} />
        <Input size="small" placeholder="Model ID" value={model.model} onChange={e => updateModel(model.id, 'model', e.target.value)} />
      </div>
    </div>
  )

  return (
    <div className="app-wrapper">
      {/* ===== Header ===== */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <RocketOutlined className="header-icon" />
            <div className="header-text">
              <Title level={4} className="header-title">大模型 API 性能评测</Title>
              <Text className="header-sub">多服务商并行测试 · 实时对比推理与生成速度</Text>
            </div>
          </div>
          <Segmented
            className="mode-switch"
            value={viewMode}
            onChange={handleModeChange}
            options={[
              { label: '简洁模式', value: 'simple', icon: <EyeOutlined /> },
              { label: '专业模式', value: 'advanced', icon: <DashboardOutlined /> },
            ]}
          />
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="app-main">
        {/* Prompt Card */}
        <Card className="prompt-card" bordered={false}>
          <TextArea
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            placeholder="请输入测试内容..."
            allowClear
            autoSize={{ minRows: 2, maxRows: 5 }}
            className="prompt-textarea"
          />
          <div className="prompt-templates">
            <Text type="secondary" className="templates-label">快捷提示</Text>
            {PROMPT_TEMPLATES.map(t => (
              <Tag key={t.label} className="template-tag" onClick={() => setTestMessage(t.value)}>{t.label}</Tag>
            ))}
          </div>
          <div className="toolbar">
            <div className="toolbar-left">
              {viewMode === 'advanced' && (
                <Space size={4}>
                  <Select
                    value={tokenCountMethod} onChange={setTokenCountMethod}
                    style={{ width: 130 }} size="small"
                    options={[
                      { value: 'char', label: '字符长度统计' },
                      { value: 'chunk', label: '响应块统计' },
                    ]}
                  />
                  <Tooltip title="字符长度：按返回文本字符数统计；响应块：每个流式块计为1">
                    <QuestionCircleOutlined style={{ color: '#aaa', fontSize: 13 }} />
                  </Tooltip>
                </Space>
              )}
            </div>
            <Space className="toolbar-right" size={8}>
              {viewMode === 'simple' && (
                <Button icon={<SettingOutlined />} onClick={() => setConfigOpen(true)}>
                  模型配置 ({models.length})
                </Button>
              )}
              {viewMode === 'advanced' && (
                <>
                  <Dropdown menu={{ items: presetMenuItems }} trigger={['click']}>
                    <Button icon={<RocketOutlined />}>快速添加</Button>
                  </Dropdown>
                  <Button icon={<PlusOutlined />} onClick={addModel}>自定义</Button>
                </>
              )}
              <Button icon={<SaveOutlined />} onClick={saveConfigurations}>保存</Button>
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleTest} loading={isLoading}>
                {isLoading ? '测试中' : '开始测试'}
              </Button>
            </Space>
          </div>
        </Card>

        {/* ===== Simple Mode ===== */}
        {viewMode === 'simple' && (
          <>
            <Drawer
              title="模型配置"
              open={configOpen}
              onClose={() => setConfigOpen(false)}
              width={420}
              extra={
                <Space size={6}>
                  <Dropdown menu={{ items: presetMenuItems }} trigger={['click']}>
                    <Button size="small" icon={<RocketOutlined />}>快速添加</Button>
                  </Dropdown>
                  <Button size="small" icon={<PlusOutlined />} onClick={addModel}>自定义</Button>
                </Space>
              }
            >
              <div className="drawer-model-list">
                {models.map(m => renderModelConfig(m))}
                {models.length === 0 && <Empty description="暂无模型，请添加" />}
              </div>
            </Drawer>

            <div className="simple-grid">
              {models.filter(m => m.enabled).length === 0 ? (
                <Card className="empty-card" bordered={false}>
                  <Empty description="暂无启用的模型">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setConfigOpen(true)}>添加模型</Button>
                  </Empty>
                </Card>
              ) : (
                models.filter(m => m.enabled).map(model => {
                  const status = getStatus(model.id)
                  const resp = responses[model.id]
                  const result = results.find(r => r.modelId === model.id)
                  return (
                    <Card key={model.id} className={`simple-card ${status}`} bordered={false} style={{ '--accent': getProviderColor(model.baseUrl) }}>
                      <div className="simple-card-head">
                        <div className="simple-card-name">
                          <span className="accent-dot" />
                          <Text strong className="model-label">{model.name}</Text>
                          <Text type="secondary" className="model-id-label">{model.model}</Text>
                        </div>
                        <div className="simple-card-status">
                          {result && status === 'done' && <Text type="secondary" className="time-badge">{result.total_time}s</Text>}
                          {statusTag(status)}
                        </div>
                      </div>
                      <div className="simple-card-body">
                        {resp?.content || resp?.reasoning ? (
                          <>
                            {resp.reasoning && (
                              <Collapse
                                ghost size="small"
                                items={[{
                                  key: 'r',
                                  label: <Text type="secondary" style={{ fontSize: 12 }}>💭 思考过程</Text>,
                                  children: <div className="reasoning-text">{resp.reasoning}</div>,
                                }]}
                              />
                            )}
                            <div className="content-text">{resp.content || ''}</div>
                          </>
                        ) : status === 'idle' ? (
                          <div className="idle-placeholder">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="等待测试" />
                          </div>
                        ) : (
                          <div className="loading-placeholder">
                            <div className="typing-dots"><span /><span /><span /></div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ===== Advanced Mode ===== */}
        {viewMode === 'advanced' && (
          <>
            <div className="advanced-grid">
              {models.map(model => {
                const status = getStatus(model.id)
                const resp = responses[model.id]
                const result = results.find(r => r.modelId === model.id)
                return (
                  <Card
                    key={model.id}
                    className={`advanced-card ${!model.enabled ? 'disabled' : ''}`}
                    bordered={false}
                    style={{ '--accent': getProviderColor(model.baseUrl) }}
                  >
                    <div className="adv-header">
                      <div className="adv-title">
                        <Switch size="small" checked={model.enabled} onChange={c => toggleModel(model.id, c)} />
                        <Input
                          value={model.name} onChange={e => updateModel(model.id, 'name', e.target.value)}
                          variant="borderless" className="adv-name-input" placeholder="名称"
                        />
                        {model.enabled ? <Tag color="green" bordered={false}>ON</Tag> : <Tag bordered={false}>OFF</Tag>}
                        {statusTag(status)}
                      </div>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeModel(model.id)} />
                    </div>

                    <div className="adv-fields">
                      <Input.Password size="small" placeholder="API Key" value={model.apiKey} onChange={e => updateModel(model.id, 'apiKey', e.target.value)} />
                      <Input size="small" placeholder="Base URL" value={model.baseUrl} onChange={e => updateModel(model.id, 'baseUrl', e.target.value)} />
                      <Input size="small" placeholder="Model ID" value={model.model} onChange={e => updateModel(model.id, 'model', e.target.value)} />
                    </div>

                    <div className="adv-responses">
                      <div className="resp-block">
                        <div className="resp-label">推理过程</div>
                        <div className="resp-box" ref={el => { if (el) el.scrollTop = el.scrollHeight }}>
                          {resp?.reasoning || ''}
                        </div>
                      </div>
                      <div className="resp-block">
                        <div className="resp-label">生成内容</div>
                        <div className="resp-box" ref={el => { if (el) el.scrollTop = el.scrollHeight }}>
                          {resp?.content || ''}
                        </div>
                      </div>
                    </div>

                    <div className="adv-stats">
                      {[
                        { label: '首Token', value: result?.first_token_time || 'N/A', unit: 's' },
                        { label: '推理速度', value: result?.reasoning_speed || '0', unit: 't/s' },
                        { label: '内容速度', value: result?.content_speed || '0', unit: 't/s' },
                        { label: '总速度', value: result?.total_speed || '0', unit: 't/s' },
                        { label: '总时间', value: result?.total_time || '0', unit: 's' },
                      ].map(s => (
                        <div key={s.label} className={`stat-cell ${s.value === 'Error' ? 'error' : ''}`}>
                          <div className="stat-val">{s.value}<span className="stat-unit">{s.unit}</span></div>
                          <div className="stat-lbl">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
              {models.length === 0 && (
                <Card className="empty-card" bordered={false}>
                  <Empty description="暂无模型">
                    <Space>
                      <Dropdown menu={{ items: presetMenuItems }} trigger={['click']}>
                        <Button icon={<RocketOutlined />}>快速添加</Button>
                      </Dropdown>
                      <Button icon={<PlusOutlined />} onClick={addModel}>自定义添加</Button>
                    </Space>
                  </Empty>
                </Card>
              )}
            </div>

            {results.length > 0 && (
              <Card className="table-card" bordered={false}>
                <Title level={5} style={{ marginBottom: 12 }}>📊 性能对比</Title>
                <Table columns={columns} dataSource={results} rowKey="modelId" pagination={false} size="small" />
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
