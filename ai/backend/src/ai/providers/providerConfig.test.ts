import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { apiKeyHintFromSecret, isProviderConfigComplete, ollamaCloudBaseUrl } from './providerConfig.js'

describe('providerConfig', () => {
  it('detects ollama cloud base url', () => {
    assert.equal(ollamaCloudBaseUrl('https://ollama.com'), true)
    assert.equal(ollamaCloudBaseUrl('https://ollama.com/'), true)
    assert.equal(ollamaCloudBaseUrl('http://127.0.0.1:11434'), false)
  })

  it('requires a full ollama cloud api key', () => {
    assert.equal(
      isProviderConfigComplete({
        aiProvider: 'ollama',
        aiModel: 'gpt-oss:120b',
        aiProviderBaseUrl: 'https://ollama.com',
        aiProviderApiKey: '15d6dfe098c14477a7a2d7f3d706751e',
        aiProviderTimeoutMs: 60_000,
      }),
      false,
    )
    assert.equal(
      isProviderConfigComplete({
        aiProvider: 'ollama',
        aiModel: 'gpt-oss:120b',
        aiProviderBaseUrl: 'https://ollama.com',
        aiProviderApiKey: '15d6dfe098c14477a7a2d7f3d706751e.wIPd_udR2EEWdu6foiJpn5np',
        aiProviderTimeoutMs: 60_000,
      }),
      true,
    )
  })

  it('requires api key for ollama cloud', () => {
    assert.equal(
      isProviderConfigComplete({
        aiProvider: 'ollama',
        aiModel: 'gpt-oss:120b',
        aiProviderBaseUrl: 'https://ollama.com',
        aiProviderApiKey: '',
        aiProviderTimeoutMs: 60_000,
      }),
      false,
    )
    assert.equal(
      isProviderConfigComplete({
        aiProvider: 'ollama',
        aiModel: 'gpt-oss:120b',
        aiProviderBaseUrl: 'https://ollama.com',
        aiProviderApiKey: 'secret',
        aiProviderTimeoutMs: 60_000,
      }),
      false,
    )
  })

  it('exposes only the prefix before the dot as a saved-key hint', () => {
    assert.equal(apiKeyHintFromSecret(''), null)
    assert.equal(
      apiKeyHintFromSecret('15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix'),
      '15d6dfe098c14477a7a2d7f3d706751e',
    )
    assert.equal(apiKeyHintFromSecret('sk-abcdefghi'), 'sk-abcde')
  })

  it('allows local ollama without api key', () => {
    assert.equal(
      isProviderConfigComplete({
        aiProvider: 'ollama',
        aiModel: 'llama3.1',
        aiProviderBaseUrl: 'http://127.0.0.1:11434',
        aiProviderApiKey: '',
        aiProviderTimeoutMs: 60_000,
      }),
      true,
    )
  })
})
