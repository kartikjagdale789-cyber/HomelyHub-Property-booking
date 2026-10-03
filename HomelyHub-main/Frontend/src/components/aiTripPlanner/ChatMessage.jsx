/**
 * ChatMessage.jsx
 * Renders a single chat message — either a user bubble or an AI response.
 * For AI responses that are structured trip plans, it delegates to TripPlan.jsx.
 * For plain chat messages it renders formatted text.
 */
import React from 'react';
import TripPlan from './TripPlan';

// Format timestamp as HH:MM
function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Convert newlines and simple markdown-like formatting to JSX
function formatText(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
}

const ChatMessage = ({ message }) => {
  const { role, content, timestamp, isError } = message;
  const isUser = role === 'user';

  // If the content is an object (parsed trip plan or chat response), handle appropriately
  const isStructured = content && typeof content === 'object';
  const tripPlan = isStructured && content.type === 'trip_plan' ? content : null;
  const chatText = isStructured && content.type === 'chat' ? content.message : null;
  const plainText = typeof content === 'string' ? content : null;

  return (
    <div className={`ai-msg ${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        <div className="ai-msg-bubble">{formatText(plainText || '')}</div>
      ) : (
        <>
          {/* Error state */}
          {isError && (
            <div className="ai-error-msg">
              ⚠️ {plainText || (isStructured && (content.message || 'Something went wrong.'))}
            </div>
          )}

          {/* Structured trip plan */}
          {!isError && tripPlan && <TripPlan plan={tripPlan} />}

          {/* Plain chat text (from { type: 'chat', message: '...' }) */}
          {!isError && !tripPlan && chatText && (
            <div className="ai-msg-bubble">{formatText(chatText)}</div>
          )}

          {/* Fallback raw text */}
          {!isError && !tripPlan && !chatText && plainText && (
            <div className="ai-msg-bubble">{formatText(plainText)}</div>
          )}
        </>
      )}
      <span className="ai-msg-time">{formatTime(timestamp)}</span>
    </div>
  );
};

export default ChatMessage;
