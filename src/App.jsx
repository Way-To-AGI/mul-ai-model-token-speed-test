import { useState } from 'react'
import { Button, Space, Typography, Card, Input, Switch, Table, Select, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import './App.css'
import { OpenAI } from 'openai'

const { TextArea } = Input
const { Title } = Typography

function App() {
  const [models, setModels] = useState([
    {
      id: 1,
      name: "阿里云-百炼",
      apiKey: "",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "deepseek-r1",
      enabled: true,
    },
    {
      id: 2,
      name: "硅基流动",
      apiKey: "",
      baseUrl: "https://api.siliconflow.cn/v1",
      model: "deepseek-ai/DeepSeek-R1",
      enabled: true,
    }
  ])

  const [testMessage, setTestMessage] = useState("你好！很高兴见到你啊，有什么我可以帮助你的吗？")
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState({})
  const [tokenCountMethod, setTokenCountMethod] = useState('char')

  const addModel = () => {
    const newId = Math.max(...models.map(m => m.id), 0) + 1
    setModels([...models, {
      id: newId,
      name: `模型 ${newId}`,
      apiKey: "",
      baseUrl: "",
      model: "",
      enabled: true,
    }])
  }

  const removeModel = (id) => {
    setModels(models.filter(m => m.id !== id))
  }

  const toggleModel = (id, enabled) => {
    setModels(models.map(m =>
      m.id === id ? { ...m, enabled } : m
    ))
  }

  const updateModel = (id, field, value) => {
    setModels(models.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleTest = async () => {
    setIsLoading(true)
    setResults([])
    setResponses({})

    const enabledModels = models.filter(m => m.enabled)

    for (const model of enabledModels) {
      try {
        setResults(prev => [...prev, {
          provider: model.name,
          first_token_time: 'N/A',
          reasoning_speed: '0',
          content_speed: '0',
          total_speed: '0',
          total_time: '0',
        }])

        const client = new OpenAI({
          apiKey: model.apiKey,
          baseURL: model.baseUrl,
          dangerouslyAllowBrowser: true,
        })

        const startTime = Date.now()
        let firstTokenTime = null
        let reasoningTokenCount = 0
        let contentTokenCount = 0
        let reasoningStartTime = null
        let reasoningEndTime = null
        let contentStartTime = null
        let contentEndTime = null
        let reasoningContent = ''
        let normalContent = ''

        const stream = await client.chat.completions.create({
          model: model.model,
          messages: [{ role: 'user', content: testMessage }],
          stream: true,
        })

        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta) {
            const delta = chunk.choices[0].delta

            if (firstTokenTime === null && (delta.reasoning_content || delta.content)) {
              firstTokenTime = (Date.now() - startTime) / 1000
            }

            const getTokenCount = (text) => {
              return tokenCountMethod === 'char' ? text.length : 1
            }

            if (delta.reasoning_content) {
              reasoningTokenCount += getTokenCount(delta.reasoning_content)
              if (!reasoningStartTime) reasoningStartTime = Date.now()
              reasoningEndTime = Date.now()
              reasoningContent += delta.reasoning_content
            } else if (delta.content) {
              contentTokenCount += getTokenCount(delta.content)
              if (!contentStartTime) contentStartTime = Date.now()
              contentEndTime = Date.now()
              normalContent += delta.content
            }

            const totalTime = (Date.now() - startTime) / 1000
            const reasoningTime = reasoningStartTime ?
              (reasoningEndTime - reasoningStartTime) / 1000 : 0
            const contentTime = contentStartTime ?
              (contentEndTime - contentStartTime) / 1000 : 0

            setResults(prev => prev.map(r =>
              r.provider === model.name ? {
                provider: model.name,
                first_token_time: firstTokenTime?.toFixed(2) || 'N/A',
                reasoning_speed: reasoningTime > 0 ?
                  (reasoningTokenCount / reasoningTime).toFixed(2) : '0',
                content_speed: contentTime > 0 ?
                  (contentTokenCount / contentTime).toFixed(2) : '0',
                total_speed: totalTime > 0 ?
                  ((reasoningTokenCount + contentTokenCount) / totalTime).toFixed(2) : '0',
                total_time: totalTime.toFixed(2),
              } : r
            ))

            setResponses(prev => ({
              ...prev,
              [model.name]: {
                reasoning: reasoningContent,
                content: normalContent,
              }
            }))
          }
        }

      } catch (error) {
        console.error(`Error testing ${model.name}:`, error)
        setResults(prev => prev.map(r =>
          r.provider === model.name ? {
            provider: model.name,
            first_token_time: 'Error',
            reasoning_speed: 'Error',
            content_speed: 'Error',
            total_speed: 'Error',
            total_time: 'Error',
          } : r
        ))
      }
    }
    setIsLoading(false)
  }

  const columns = [
    { title: '服务商', dataIndex: 'provider', key: 'provider' },
    { title: '首token时间(秒)', dataIndex: 'first_token_time', key: 'first_token_time' },
    { title: '推理token/s', dataIndex: 'reasoning_speed', key: 'reasoning_speed' },
    { title: '内容token/s', dataIndex: 'content_speed', key: 'content_speed' },
    { title: '总token/s', dataIndex: 'total_speed', key: 'total_speed' },
    { title: '总时间(秒)', dataIndex: 'total_time', key: 'total_time' },
  ]

  return (
    <div className="container">
      <Title level={2} style={{ marginBottom: 32, textAlign: 'center' }}>
        DeepSeek API 性能评测
      </Title>

      <Card className="message-card" bordered={false}>
        <TextArea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="请输入测试内容..."
          rows={4}
          style={{ marginBottom: 16 }}
        />
        <Space style={{ float: 'right' }}>
          <Space>
            <Select
              value={tokenCountMethod}
              onChange={setTokenCountMethod}
              style={{ width: 160 }}
              options={[
                { value: 'char', label: '字符长度统计' },
                { value: 'chunk', label: '响应块统计' }
              ]}
            />
            <Tooltip title="选择token统计方式">
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
          <Button
            onClick={addModel}
            icon={<PlusOutlined />}
          >
            添加模型
          </Button>
          <Button type="primary" onClick={handleTest} loading={isLoading}>
            开始测试
          </Button>
        </Space>
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {models.map(model => (
          <Card
            key={model.id}
            title={
              <Space>
                <Switch
                  checked={model.enabled}
                  onChange={checked => toggleModel(model.id, checked)}
                />
                <Input
                  value={model.name}
                  onChange={e => updateModel(model.id, 'name', e.target.value)}
                  style={{ width: '120px' }}
                />
              </Space>
            }
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeModel(model.id)}
              />
            }
            style={{ opacity: model.enabled ? 1 : 0.5 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="API Key"
                value={model.apiKey}
                onChange={e => updateModel(model.id, 'apiKey', e.target.value)}
                type="password"
              />
              <Input
                placeholder="Base URL"
                value={model.baseUrl}
                onChange={e => updateModel(model.id, 'baseUrl', e.target.value)}
              />
              <Input
                placeholder="Model"
                value={model.model}
                onChange={e => updateModel(model.id, 'model', e.target.value)}
              />
              {responses[model.name] && (
                <>
                  <div style={{ marginTop: 16 }}>
                    <div>
                      <strong>推理过程：</strong>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 8, maxHeight: 200, overflow: 'auto' }}
                        ref={el => {
                          if (el) {
                            el.scrollTop = el.scrollHeight
                          }
                        }}
                      >
                        {responses[model.name].reasoning || ''}
                      </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <strong>生成内容：</strong>
                      <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
                        ref={el => {
                          if (el) {
                            el.scrollTop = el.scrollHeight
                          }
                        }}
                      >
                        {responses[model.name].content || ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    {(() => {
                      const result = results.find(r => r.provider === model.name) || {
                        first_token_time: 'N/A',
                        reasoning_speed: '0',
                        content_speed: '0',
                        total_speed: '0',
                        total_time: '0'
                      };
                      return (
                        <>
                          <div>首token时间：{result.first_token_time} 秒</div>
                          <div>推理token/s：{result.reasoning_speed}</div>
                          <div>内容token/s：{result.content_speed}</div>
                          <div>总token/s：{result.total_speed}</div>
                          <div>总时间：{result.total_time} 秒</div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </Space>
          </Card>
        ))}
      </div>

      <Table
        columns={columns}
        dataSource={results}
        rowKey="provider"
        pagination={false}
      />
    </div>
  )
}

export default App
