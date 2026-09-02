"use client";

import { useActionState, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import {
  clearChatbotKeyAction,
  saveChatbotSettingsAction,
  testChatbotApiAction,
  type ChatbotFormState,
  type TestResult,
} from "./actions";
import { DEFAULT_MODELS, KEEP_EXISTING_KEY, type Provider } from "@/lib/ai/providers";
import type { PublicChatbotConfig } from "@/lib/ai/chatbot";

interface Props {
  config: PublicChatbotConfig;
}

const initial: ChatbotFormState = {};

const PROVIDER_LABELS: Array<{ value: Provider; label: string; hint: string }> = [
  { value: "gemini", label: "Google Gemini", hint: "Free tier at aistudio.google.com — start here." },
  { value: "openai", label: "OpenAI", hint: "Keys begin sk-. Billed per token." },
  { value: "groq", label: "Groq", hint: "Open models, very fast. Keys begin gsk_." },
  { value: "openrouter", label: "OpenRouter", hint: "One key, many models. Prefix the model with its vendor." },
  { value: "custom", label: "Custom (OpenAI-compatible)", hint: "Any endpoint that speaks /chat/completions." },
];

export default function ChatbotConfigForm({ config }: Props) {
  const [state, action, pending] = useActionState(saveChatbotSettingsAction, initial);

  const [provider, setProvider] = useState<Provider>(config.provider);
  const [model, setModel] = useState(config.model);
  const [customEndpoint, setCustomEndpoint] = useState(config.customEndpoint ?? "");
  const [enabled, setEnabled] = useState(config.enabled);

  // Empty means "leave the stored key alone". The stored key is never sent to
  // the browser, so there is nothing to prefill and nothing to reveal.
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [replacing, setReplacing] = useState(!config.hasApiKey);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [clearing, startClearing] = useTransition();

  const providerMeta = PROVIDER_LABELS.find((p) => p.value === provider)!;
  const live = config.hasApiKey || newKey.trim() !== "";

  const changeProvider = (next: Provider) => {
    setProvider(next);
    // Only overwrite the model when it is still a default, so an admin who
    // typed "gpt-4o" does not lose it by glancing at another provider.
    const isDefault = Object.values(DEFAULT_MODELS).includes(model) || model === "";
    if (isDefault) setModel(DEFAULT_MODELS[next]);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(
        await testChatbotApiAction(provider, newKey || KEEP_EXISTING_KEY, model, customEndpoint),
      );
    } catch {
      setTestResult({ success: false, message: "The test could not be started." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form action={action} className="a-form">
      {state.error && (
        <p className="a-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="a-success" role="status">
          {state.message}
        </p>
      )}

      <div className={`a-aibanner${live ? " a-aibanner--live" : ""}`}>
        <span className="a-aibanner__icon">
          <Icon name={live ? "sparkle" : "info"} size={16} />
        </span>
        <div>
          <strong>
            {!enabled
              ? "Assistant switched off"
              : live
                ? `Live — ${providerMeta.label}, ${model || "no model set"}`
                : "Answering from the catalogue"}
          </strong>
          <span>
            {!enabled
              ? "The widget is hidden on every public page."
              : live
                ? "Questions go to the provider, grounded with matching listings from the catalogue."
                : "No API key set. The assistant still answers from the 499 listings, the calendar and the business pages — it just cannot hold a free-form conversation."}
          </span>
        </div>
      </div>

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label" htmlFor="ai-provider">
            Provider
          </label>
          <select
            id="ai-provider"
            name="provider"
            className="a-select"
            value={provider}
            onChange={(e) => changeProvider(e.target.value as Provider)}
          >
            {PROVIDER_LABELS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="a-hint">{providerMeta.hint}</span>
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="ai-model">
            Model
          </label>
          <input
            id="ai-model"
            name="model"
            type="text"
            className="a-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider] || "provider-specific model id"}
            required
          />
          <span className="a-hint">Passed to the provider verbatim.</span>
        </div>
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="ai-apiKey">
          API key
        </label>

        {config.hasApiKey && !replacing ? (
          <div className="a-keyrow">
            <code className="a-keyrow__mask">{config.apiKeyHint}</code>
            <button type="button" className="t-btn t-btn--secondary" onClick={() => setReplacing(true)}>
              Replace
            </button>
            <button
              type="button"
              className="t-btn t-btn--danger"
              disabled={clearing}
              onClick={() =>
                startClearing(async () => {
                  await clearChatbotKeyAction();
                  setTestResult(null);
                  setReplacing(true);
                })
              }
            >
              {clearing ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : (
          <div className="a-keyrow">
            {/* The field carries the form's name itself. Mirroring it into a
                hidden input meant the submitted value came from React state
                rather than from the box the admin typed in — two sources for
                one value, and the wrong one wins if they ever disagree. An
                empty box means "leave the stored key alone". */}
            <input
              id="ai-apiKey"
              name="apiKey"
              type={showKey ? "text" : "password"}
              className="a-input a-keyrow__input"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={
                provider === "gemini" ? "AIzaSy…" : provider === "openai" ? "sk-…" : "Paste the key"
              }
            />
            <button type="button" className="t-btn t-btn--secondary" onClick={() => setShowKey(!showKey)}>
              {showKey ? "Hide" : "Show"}
            </button>
            {config.hasApiKey && (
              <button
                type="button"
                className="t-btn t-btn--secondary"
                onClick={() => {
                  setReplacing(false);
                  setNewKey("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}

        <span className="a-hint">
          Stored in the database and never sent to the browser — this page only ever
          shows the first and last four characters.
        </span>
      </div>

      {provider === "custom" && (
        <div className="a-field">
          <label className="a-label" htmlFor="ai-endpoint">
            Endpoint URL
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
          <span className="a-hint">Must be https, and must accept the OpenAI chat-completions body.</span>
        </div>
      )}

      <div className="a-field">
        <label className="a-label" htmlFor="ai-systemPrompt">
          System instructions
        </label>
        <textarea
          id="ai-systemPrompt"
          name="systemPrompt"
          className="a-textarea"
          rows={10}
          defaultValue={config.systemPrompt}
        />
        <span className="a-hint">
          Sent ahead of every conversation. Matching listings are appended automatically —
          do not paste place data here. Clear the box to restore the default.
        </span>
      </div>

      <div className="a-checkrow">
        <input
          id="ai-enabled"
          name="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label htmlFor="ai-enabled" className="a-hint">
          Show the assistant on the public site
        </label>
      </div>

      {testResult && (
        <p
          className={testResult.success ? "a-success" : "a-error"}
          role="status"
          style={{ wordBreak: "break-word" }}
        >
          {testResult.message}
        </p>
      )}

      <div className="a-formactions a-keyrow">
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save configuration"}
        </button>
        <button
          type="button"
          className="t-btn t-btn--secondary"
          disabled={testing || (!config.hasApiKey && !newKey.trim())}
          onClick={runTest}
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
      </div>
    </form>
  );
}
