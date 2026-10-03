/**
 * AITripPlanner.jsx
 * -----------------
 * Floating AI chatbot widget for HomelyHub.
 *
 * Features:
 *  - Floating "✦ AI Trip Planner" button (bottom-right)
 *  - Collapsible chat panel
 *  - Persists conversation for the current session
 *  - Sends messages → POST /api/ai/chat → backend → Groq
 *  - Renders plain chat messages AND structured trip plans
 *  - Quick-suggestion chips
 *  - Typing indicator
 *  - Keyboard shortcut: Enter to send, Shift+Enter for newline
 *  - GROQ_API_KEY is NEVER exposed here — everything goes through the backend
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { axiosInstance } from '../../utils/axios';
import ChatMessage from './ChatMessage';
import './aiTripPlanner.css';

// ── Quick suggestion chips ──────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: '✈️ Plan a trip', prompt: 'I want to plan a trip.' },
  { label: '🏠 Find stays', prompt: 'Help me find a HomelyHub stay.' },
  { label: '🌴 Weekend getaway', prompt: 'Suggest a weekend getaway from Mumbai.' },
  { label: '💸 Budget trip', prompt: 'Plan a budget trip under ₹10,000.' },
  { label: '✨ Luxury trip', prompt: 'Plan a luxury trip to Goa.' },
];

// ── Initial greeting message ────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  role: 'assistant',
  content: {
    type: 'chat',
    message:
      "Hi! I'm your HomelyHub AI Travel Assistant ✈️\n\nTell me where you want to go, how many days you're travelling, and your approximate budget — I'll craft a detailed day-by-day itinerary and find the perfect HomelyHub stay for you!\n\nExample: \"Plan a 4-day trip to Goa for 2 people with ₹25,000 budget.\"",
  },
  timestamp: Date.now(),
};

// ── Max conversation turns sent to backend ─────────────────────────────────
const MAX_HISTORY = 16;

// ── Component ───────────────────────────────────────────────────────────────
const AITripPlanner = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || inputText).trim();
      if (!trimmed || loading) return;

      setInputText('');

      // Add user message to the local conversation
      const userMsg = { role: 'user', content: trimmed, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        // Build conversation history to send (exclude welcome, trim to MAX_HISTORY)
        const history = messages
          .filter((m) => m !== WELCOME_MESSAGE)
          .slice(-MAX_HISTORY)
          .map((m) => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          }));

        const response = await axiosInstance.post('/ai/chat', {
          message: trimmed,
          conversation: history,
          preferences: {}, // Can be extended later
        });

        const data = response.data;

        // AI response — content is the parsed JSON object from backend
        const aiMsg = {
          role: 'assistant',
          content: data,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error('AI chat error:', err);
        const errText =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Something went wrong. Please try again.';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: errText,
            timestamp: Date.now(),
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [inputText, loading, messages]
  );

  // ── Handle Enter key ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInputText('');
  };

  // ── Chip click ────────────────────────────────────────────────────────────
  const handleChip = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* ── Floating trigger button ────────────────────────────────────── */}
      <button
        className="ai-fab"
        onClick={() => setOpen((p) => !p)}
        aria-label="Open AI Trip Planner"
        title="HomelyHub AI Trip Planner"
      >
        <span className="ai-fab-icon">✦</span>
        AI Trip Planner
      </button>

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      {open && (
        <div className="ai-panel" role="dialog" aria-label="AI Trip Planner">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-header-left">
              <div className="ai-header-avatar">✈️</div>
              <div>
                <div className="ai-header-title">HomelyHub AI Trip Planner</div>
                <div className="ai-header-subtitle">Plan your perfect trip with AI</div>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-icon-btn"
                onClick={clearChat}
                title="New trip / Clear chat"
                aria-label="Clear chat"
              >
                🗑
              </button>
              <button
                className="ai-icon-btn"
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close chatbot"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick suggestion chips */}
          <div className="ai-quick-chips">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                className="ai-chip"
                onClick={() => handleChip(chip.prompt)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="ai-messages" role="log" aria-live="polite">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-typing">
                  <div className="ai-typing-dots">
                    <span /><span /><span />
                  </div>
                  <span className="ai-typing-text">HomelyHub AI is thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="ai-input-area">
            <textarea
              ref={inputRef}
              className="ai-input"
              rows={1}
              placeholder="Ask me about your next trip…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label="Message input"
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !inputText.trim()}
              aria-label="Send message"
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AITripPlanner;
