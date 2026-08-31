"use client";

import { useActionState, useState } from "react";
import Icon from "@/components/Icon";
import {
  saveChatbotSettingsAction,
  testChatbotApiAction,
  type ChatbotFormState,
} from "./actions";
import type { ChatbotConfig } from "@/lib/ai/chatbot";

interface Props {
  initialConfig: ChatbotConfig;
}

const initial: ChatbotFormState = {};

export default function ChatbotConfigForm({ initialConfig }: Props) {
  const [state, action, pending] = useActionState(
    saveChatbotSettingsAction,
    initial,
  );

  const [provider, setProvider] = useState<ChatbotConfig["provider"]>(
    initialConfig.provider || "gemini",
  );
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || "");
  const [model, setModel] = useState(initialConfig.model || "gemini-1.5-flash");
  const [customEndpoint, setCustomEndpoint] = useState(
    initialConfig.customEndpoint || "",
  );
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleProviderChange = (newProvider: ChatbotConfig["provider"]) => {
    setProvider(newProvider);
    if (newProvider === "gemini") {
      setModel("gemini-1.5-flash");
    } else if (newProvider === "openai") {
      setModel("gpt-4o-mini");
    } else if (newProvider === "groq") {
      setModel("llama-3.3-70b-versatile");
    } else if (newProvider === "openrouter") {
      setModel("google/gemini-flash-1.5");
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testChatbotApiAction(
        provider,
        apiKey,
        model,
        customEndpoint,
      );
      setTestResult(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to test connection.";
      setTestResult({
        success: false,
        message,
      });
    } finally {
      setTesting(false);
    }
  };

  const hasApiKey = Boolean(apiKey && apiKey.trim() !== "");

  return (
    <form action={action} className="a-form">
      {state.error && (
        <p className="a-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="a-success" role="status">
          {state.message || "Settings saved."}
        </p>
      )}

      {/* Status banner */}
      <div
        style={{
          padding: "var(--t-3) var(--t-4)",
          borderRadius: "var(--t-radius-md)",
          background: hasApiKey ? "var(--t-accent-soft)" : "var(--t-surface-2)",
          border: `1px solid ${hasApiKey ? "var(--t-accent)" : "var(--t-border)"}`,
          display: "flex",
          alignItems: "center",
          gap: "var(--t-3)",
          marginBottom: "var(--t-3)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            padding: 6,
            borderRadius: "50%",
            background: hasApiKey ? "var(--t-accent)" : "var(--t-surface-3)",
            color: hasApiKey ? "#fff" : "var(--t-ink-3)",
          }}
        >
          <Icon name="sparkle" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--t-ink)" }}>
            {hasApiKey
              ? `Live AI Enabled (${provider.toUpperCase()}: ${model})`
              : "Smart Offline Fallback Mode Active"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--t-ink-2)" }}>
            {hasApiKey
              ? "The assistant answers queries using live LLM reasoning grounded with current catalog places."
              : "No API key configured. The assistant uses the built-in Rwandan tourism knowledge and database search engine."}
          </div>
        </div>
      </div>

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label" htmlFor="ai-provider">
            AI Provider
          </label>
          <select
            id="ai-provider"
            name="provider"
            className="a-select"
            value={provider}
            onChange={(e) =>
              handleProviderChange(e.target.value as ChatbotConfig["provider"])
            }
          >
            <option value="gemini">Google Gemini (Recommended)</option>
            <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
            <option value="groq">Groq (Llama / Mixtral)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="custom">Custom OpenAI-Compatible API</option>
          </select>
          <span className="a-hint">
            Select the LLM service to power Tembera AI assistant.
          </span>
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="ai-model">
            Model Name
          </label>
          <input
            id="ai-model"
            name="model"
            type="text"
            className="a-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
            required
          />
          <span className="a-hint">
            Model identifier passed to the AI provider.
          </span>
        </div>
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="ai-apiKey">
          API Key
        </label>
        <div style={{ display: "flex", gap: "var(--t-2)" }}>
          <input
            id="ai-apiKey"
            name="apiKey"
            type={showKey ? "text" : "password"}
            className="a-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === "gemini"
                ? "AIzaSy..."
                : provider === "openai"
                  ? "sk-..."
                  : "Enter your API key"
            }
            style={{ flex: 1, fontFamily: showKey ? "monospace" : "inherit" }}
          />
          <button
            type="button"
            className="a-btn"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? "Hide API Key" : "Reveal API Key"}
            style={{ minWidth: "75px" }}
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <span className="a-hint">
          {provider === "gemini"
            ? "Get a free Gemini API key at aistudio.google.com"
            : "Your API key is stored securely in the database and never exposed to the client."}
        </span>
      </div>

      {provider === "custom" && (
        <div className="a-field">
          <label className="a-label" htmlFor="ai-endpoint">
            Custom Endpoint URL
          </label>
          <input
            id="ai-endpoint"
            name="customEndpoint"
            type="url"
            className="a-input"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="https://api.your-host.com/v1/chat/completions"
          />
          <span className="a-hint">
            Standard OpenAI-compatible completions endpoint.
          </span>
        </div>
      )}

      <div className="a-field">
        <label className="a-label" htmlFor="ai-systemPrompt">
          Custom System Instructions (Optional)
        </label>
        <textarea
          id="ai-systemPrompt"
          name="systemPrompt"
          className="a-textarea"
          rows={5}
          defaultValue={initialConfig.systemPrompt}
          placeholder="Override default assistant behavior and instructions..."
        />
        <span className="a-hint">
          Guiding instructions for tone, cultural knowledge, and recommended routes.
        </span>
      </div>

      <div className="a-checkrow" style={{ marginTop: "var(--t-2)" }}>
        <input
          id="ai-enabled"
          name="enabled"
          type="checkbox"
          defaultChecked={initialConfig.enabled}
        />
        <label htmlFor="ai-enabled" className="a-hint" style={{ cursor: "pointer" }}>
          Enable AI Chatbot widget across the public website
        </label>
      </div>

      {testResult && (
        <div
          style={{
            padding: "var(--t-3) var(--t-4)",
            borderRadius: "var(--t-radius-sm)",
            background: testResult.success
              ? "var(--t-accent-soft)"
              : "var(--t-danger-soft)",
            border: `1px solid ${testResult.success ? "var(--t-accent)" : "var(--t-danger)"}`,
            color: testResult.success ? "var(--t-accent-ink)" : "var(--t-danger)",
            fontSize: "13px",
            marginTop: "var(--t-2)",
          }}
        >
          {testResult.message}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--t-3)",
          alignItems: "center",
          marginTop: "var(--t-4)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="submit"
          className="a-btn a-btn--accent"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save AI Configuration"}
        </button>

        <button
          type="button"
          className="a-btn"
          disabled={testing || !apiKey}
          onClick={handleTestConnection}
        >
          {testing ? "Testing connection..." : "Test Connection"}
        </button>
      </div>
    </form>
  );
}
