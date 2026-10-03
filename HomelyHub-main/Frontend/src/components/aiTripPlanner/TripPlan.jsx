/**
 * TripPlan.jsx
 * Renders the structured trip plan JSON returned by the AI.
 * Shows: summary, day-by-day itinerary, budget breakdown, tips,
 * and real HomelyHub property recommendations with "View Property" links.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Day accordion item ──────────────────────────────────────────────────────
const DayItem = ({ day }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="ai-day-item">
      <div className="ai-day-header" onClick={() => setOpen((p) => !p)}>
        <span>Day {day.day}{day.title ? ` — ${day.title}` : ''}</span>
        <span className="ai-day-cost">
          {open ? '▲' : '▼'}&nbsp;
          {day.estimatedCost ? `~₹${day.estimatedCost.toLocaleString('en-IN')}` : ''}
        </span>
      </div>
      {open && (
        <div className="ai-day-content">
          {day.morning && (
            <div className="ai-day-slot">
              <span className="ai-day-slot-label">🌅 Morning</span>
              <span>{day.morning}</span>
            </div>
          )}
          {day.afternoon && (
            <div className="ai-day-slot">
              <span className="ai-day-slot-label">☀️ Afternoon</span>
              <span>{day.afternoon}</span>
            </div>
          )}
          {day.evening && (
            <div className="ai-day-slot">
              <span className="ai-day-slot-label">🌆 Evening</span>
              <span>{day.evening}</span>
            </div>
          )}
          {day.food && day.food.length > 0 && (
            <div className="ai-day-food">
              <span className="ai-day-slot-label" style={{ width: '100%', marginBottom: 3 }}>
                🍽️ Food
              </span>
              {day.food.map((f, i) => (
                <span key={i} className="ai-food-tag">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Property recommendation card ────────────────────────────────────────────
const PropCard = ({ prop }) => (
  <div className="ai-prop-card">
    {prop.image ? (
      <img
        src={prop.image}
        alt={prop.name}
        className="ai-prop-img"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <div className="ai-prop-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.5rem' }}>🏠</div>
    )}
    <div className="ai-prop-info">
      <div className="ai-prop-name" title={prop.name}>{prop.name}</div>
      <div className="ai-prop-location">📍 {prop.location}</div>
      <div className="ai-prop-price">₹{(prop.pricePerNight || 0).toLocaleString('en-IN')}<span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#64748b', fontFamily: 'inherit' }}>/night</span></div>
      {prop.reason && <div className="ai-prop-reason">{prop.reason}</div>}
      <Link
        to={`/propertylist/${prop.propertyId}`}
        className="ai-view-btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Property →
      </Link>
    </div>
  </div>
);

// ── Main TripPlan component ─────────────────────────────────────────────────
const TripPlan = ({ plan }) => {
  if (!plan || plan.type !== 'trip_plan') return null;

  const budgetTotal = plan.budgetBreakdown
    ? Object.values(plan.budgetBreakdown).reduce((a, b) => a + b, 0)
    : plan.budget;

  return (
    <div className="ai-trip-card">
      {/* Header */}
      <div className="ai-trip-header">
        <h3>✈️ {plan.destination} Trip Plan</h3>
        <div className="ai-trip-meta">
          {plan.days   && <span>📅 {plan.days} Day{plan.days > 1 ? 's' : ''}</span>}
          {plan.travelers && <span>👥 {plan.travelers} Traveler{plan.travelers > 1 ? 's' : ''}</span>}
          {plan.budget  && <span>💰 ₹{plan.budget.toLocaleString('en-IN')}</span>}
        </div>
      </div>

      <div className="ai-trip-body">
        {/* Summary */}
        {plan.summary && <p className="ai-trip-summary">{plan.summary}</p>}

        {/* Itinerary */}
        {plan.itinerary?.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem', color: '#1e293b' }}>
              📋 Itinerary
            </div>
            {plan.itinerary.map((day) => (
              <DayItem key={day.day} day={day} />
            ))}
          </>
        )}

        {/* Budget breakdown */}
        {plan.budgetBreakdown && (
          <div className="ai-budget-section">
            <h4>💰 Estimated Budget Breakdown</h4>
            {Object.entries(plan.budgetBreakdown).map(([k, v]) => (
              <div key={k} className="ai-budget-row">
                <span style={{ textTransform: 'capitalize' }}>{k}</span>
                <span>₹{Number(v).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {budgetTotal && (
              <div className="ai-budget-row total">
                <span>Total</span>
                <span>₹{Number(budgetTotal).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {plan.tips?.length > 0 && (
          <div className="ai-tips-section">
            <h4>💡 Travel Tips</h4>
            {plan.tips.map((tip, i) => (
              <div key={i} className="ai-tip-item">
                <span className="ai-tip-icon">›</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Property recommendations */}
        <div className="ai-props-section">
          <h4>🏠 Recommended HomelyHub Stays</h4>
          {plan.recommendedProperties?.length > 0 ? (
            plan.recommendedProperties.map((prop) => (
              <PropCard key={prop.propertyId} prop={prop} />
            ))
          ) : (
            <p className="ai-no-props">
              Currently I couldn't find a matching HomelyHub property for this destination. Check back soon as we add more listings!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlan;
