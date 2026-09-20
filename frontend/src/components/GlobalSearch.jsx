import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getEvent } from '../services/api';

export default function GlobalSearch({ activeEventId, activeEventName }) {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState({
    events: [],
    sessions: [],
    speakers: [],
    scripts: [],
    pages: [
      { id: 'page-events', title: 'Events Directory', category: 'Pages', icon: '▤', subtitle: 'View all conference and summit events', path: '/' },
      { id: 'page-live', title: 'Live Dashboard & Teleprompter', category: 'Pages', icon: '🔴', subtitle: 'Stage controls, live countdowns, stall scripts', path: '/live' },
      { id: 'page-agenda', title: 'Event Agenda & Timeline', category: 'Pages', icon: '📋', subtitle: 'Manage sessions, scheduled times, and rundown', path: '/setup', tab: 'agenda' },
      { id: 'page-speakers', title: 'Speakers & Keynote Guests', category: 'Pages', icon: '🎤', subtitle: 'Manage speaker profiles, bios, and topics', path: '/setup', tab: 'speakers' },
      { id: 'page-scripts', title: 'AI Stage Scripts', category: 'Pages', icon: '📝', subtitle: 'Generate opening, closing, intro & transition scripts', path: '/setup', tab: 'scripts' },
    ],
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load and index events, sessions, speakers, and scripts
  const loadSearchData = async () => {
    try {
      setLoading(true);
      const eventsList = await getEvents();
      if (!eventsList || eventsList.length === 0) {
        setLoading(false);
        return;
      }

      const allSessions = [];
      const allSpeakers = [];
      const allScripts = [];

      // Fetch details for available events
      const targetEvents = eventsList.slice(0, 5); // Index up to 5 events for fast performance
      for (const ev of targetEvents) {
        try {
          const detail = await getEvent(ev.id);
          if (detail) {
            // Index sessions
            if (detail.sessions) {
              detail.sessions.forEach((s) => {
                allSessions.push({
                  id: s.id,
                  eventId: ev.id,
                  eventName: ev.name,
                  title: s.title,
                  type: s.type,
                  speakerName: s.speaker?.name || 'Unassigned',
                  speakerTopic: s.speaker?.topic || '',
                  scheduledStart: s.scheduledStart,
                  status: s.status,
                  category: 'Sessions',
                  icon: '📅',
                });

                // Index session-level scripts if present
                if (s.introScript) {
                  allScripts.push({
                    id: `script-intro-${s.id}`,
                    eventId: ev.id,
                    eventName: ev.name,
                    title: `Intro: ${s.speaker?.name || s.title}`,
                    snippet: s.introScript,
                    type: 'Intro Script',
                    category: 'AI Scripts',
                    icon: '🎤',
                  });
                }
                if (s.transitionScript) {
                  allScripts.push({
                    id: `script-trans-${s.id}`,
                    eventId: ev.id,
                    eventName: ev.name,
                    title: `Transition: ${s.title}`,
                    snippet: s.transitionScript,
                    type: 'Transition Script',
                    category: 'AI Scripts',
                    icon: '🔀',
                  });
                }
              });
            }

            // Index speakers
            if (detail.speakers) {
              detail.speakers.forEach((sp) => {
                allSpeakers.push({
                  id: sp.id,
                  eventId: ev.id,
                  eventName: ev.name,
                  name: sp.name,
                  topic: sp.topic,
                  bio: sp.bio,
                  achievements: sp.achievements,
                  category: 'Speakers',
                  icon: '👤',
                });
              });
            }

            // Index meta scripts
            if (detail.meta?.openingScript) {
              allScripts.push({
                id: `script-opening-${ev.id}`,
                eventId: ev.id,
                eventName: ev.name,
                title: `Opening Script · ${ev.name}`,
                snippet: detail.meta.openingScript,
                type: 'Opening Script',
                category: 'AI Scripts',
                icon: '🎪',
              });
            }
            if (detail.meta?.closingScript) {
              allScripts.push({
                id: `script-closing-${ev.id}`,
                eventId: ev.id,
                eventName: ev.name,
                title: `Closing Script · ${ev.name}`,
                snippet: detail.meta.closingScript,
                type: 'Closing Script',
                category: 'AI Scripts',
                icon: '🎯',
              });
            }
          }
        } catch (err) {
          console.error(`Failed to load event details for ${ev.id}`, err);
        }
      }

      setSearchIndex((prev) => ({
        ...prev,
        events: eventsList.map((e) => ({
          id: e.id,
          title: e.name,
          theme: e.theme,
          venue: e.venue,
          status: e.status,
          category: 'Events',
          icon: '🎪',
        })),
        sessions: allSessions,
        speakers: allSpeakers,
        scripts: allScripts,
      }));
    } catch (err) {
      console.error('Error loading search index:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearchData();
  }, [activeEventId]);

  // Global keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement !== inputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matched items
  const matchedResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results = [];

    // 1. Match Sessions
    searchIndex.sessions.forEach((s) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.speakerName.toLowerCase().includes(q) ||
        s.speakerTopic.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: `session-${s.id}`,
          category: 'Sessions',
          icon: '📅',
          title: s.title,
          subtitle: `${s.type} · Speaker: ${s.speakerName} · Event: ${s.eventName}`,
          badge: s.status,
          targetUrl: `/setup/${s.eventId}?tab=agenda`,
        });
      }
    });

    // 2. Match Speakers
    searchIndex.speakers.forEach((sp) => {
      if (
        sp.name.toLowerCase().includes(q) ||
        (sp.topic && sp.topic.toLowerCase().includes(q)) ||
        (sp.bio && sp.bio.toLowerCase().includes(q)) ||
        (sp.achievements && sp.achievements.toLowerCase().includes(q))
      ) {
        results.push({
          id: `speaker-${sp.id}`,
          category: 'Speakers',
          icon: '🎤',
          title: sp.name,
          subtitle: `${sp.topic || 'Speaker'} · Event: ${sp.eventName}`,
          snippet: sp.bio ? (sp.bio.length > 90 ? sp.bio.slice(0, 90) + '…' : sp.bio) : null,
          targetUrl: `/setup/${sp.eventId}?tab=speakers`,
        });
      }
    });

    // 3. Match Scripts
    searchIndex.scripts.forEach((sc) => {
      if (
        sc.title.toLowerCase().includes(q) ||
        sc.snippet.toLowerCase().includes(q) ||
        sc.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: sc.id,
          category: 'AI Scripts',
          icon: '📝',
          title: sc.title,
          subtitle: `${sc.type} · ${sc.eventName}`,
          snippet: sc.snippet ? (sc.snippet.length > 110 ? sc.snippet.slice(0, 110) + '…' : sc.snippet) : null,
          targetUrl: `/setup/${sc.eventId}?tab=scripts`,
        });
      }
    });

    // 4. Match Events
    searchIndex.events.forEach((ev) => {
      if (
        ev.title.toLowerCase().includes(q) ||
        (ev.theme && ev.theme.toLowerCase().includes(q)) ||
        (ev.venue && ev.venue.toLowerCase().includes(q))
      ) {
        results.push({
          id: `event-${ev.id}`,
          category: 'Events',
          icon: '🎪',
          title: ev.title,
          subtitle: `${ev.theme || 'Event'} · Venue: ${ev.venue || 'Main Hall'}`,
          badge: ev.status,
          targetUrl: `/setup/${ev.id}?tab=agenda`,
        });
      }
    });

    // 5. Match Navigation Pages
    searchIndex.pages.forEach((p) => {
      if (
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
      ) {
        let url = p.path;
        if (activeEventId && p.path !== '/') {
          if (p.path === '/live') url = `/live/${activeEventId}`;
          if (p.path === '/setup') url = `/setup/${activeEventId}${p.tab ? `?tab=${p.tab}` : ''}`;
        }
        results.push({
          id: p.id,
          category: 'Navigation',
          icon: p.icon,
          title: p.title,
          subtitle: p.subtitle,
          targetUrl: url,
        });
      }
    });

    return results;
  }, [query, searchIndex, activeEventId]);

  // Handle item navigation
  function handleSelect(item) {
    setIsOpen(false);
    if (item.targetUrl) {
      nav(item.targetUrl);
    }
  }

  // Keyboard navigation inside results
  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (matchedResults.length ? (prev + 1) % matchedResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (matchedResults.length ? (prev - 1 + matchedResults.length) % matchedResults.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedResults.length > 0 && matchedResults[selectedIndex]) {
        handleSelect(matchedResults[selectedIndex]);
      } else if (activeEventId) {
        setIsOpen(false);
        nav(`/setup/${activeEventId}?tab=agenda`);
      }
    }
  }

  // Group matched results by category
  const groupedResults = useMemo(() => {
    const groups = {};
    matchedResults.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [matchedResults]);

  // Flattened items for index matching
  let flatIndex = 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
      {/* Search Input Bar */}
      <div
        className="header-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px 6px 12px',
          transition: 'all var(--transition)',
          boxShadow: isOpen ? '0 0 0 1px #faf6f0, 0 0 0 3px rgba(200, 90, 36, 0.2)' : 'none',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>

        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          placeholder="Search sessions, speakers, scripts, events..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            loadSearchData();
          }}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: 13,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font)',
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            title="Clear search"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '2px 4px',
              borderRadius: '50%',
            }}
          >
            ✕
          </button>
        )}

        {/* Dedicated Search Action Button */}
        <button
          type="button"
          id="header-search-btn"
          onClick={() => {
            setIsOpen(true);
            loadSearchData();
            if (matchedResults.length > 0) {
              handleSelect(matchedResults[0]);
            }
          }}
          className="btn btn-primary"
          style={{
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.02em',
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
          }}
          title="Search website (Enter)"
        >
          Search
        </button>

        <span
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border)',
            padding: '2px 5px',
            borderRadius: 3,
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}
          title="Shortcut: Ctrl+K or /"
        >
          ⌘K
        </span>
      </div>

      {/* Floating Results Palette */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '100%',
            minWidth: 460,
            maxWidth: '92vw',
            maxHeight: 460,
            overflowY: 'auto',
            background: '#faf6f0',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 16px 40px rgba(38, 29, 23, 0.16)',
            zIndex: 1000,
            padding: '10px 0',
          }}
        >
          {loading && (
            <div style={{ padding: '16px 20px', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Indexing events, sessions, and scripts...
            </div>
          )}

          {!query.trim() && !loading && (
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quick Navigation & Popular Searches
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {searchIndex.pages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      let url = p.path;
                      if (activeEventId && p.path !== '/') {
                        if (p.path === '/live') url = `/live/${activeEventId}`;
                        if (p.path === '/setup') url = `/setup/${activeEventId}${p.tab ? `?tab=${p.tab}` : ''}`;
                      }
                      setIsOpen(false);
                      nav(url);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'transparent',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.subtitle}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Jump →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && matchedResults.length === 0 && !loading && (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                No matches found for "{query}"
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                Try searching for speaker names, session topics (e.g., "AI", "Scale"), scripts, or venue locations.
              </div>
            </div>
          )}

          {query.trim() && matchedResults.length > 0 && (
            <div>
              <div style={{ padding: '6px 16px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Found {matchedResults.length} {matchedResults.length === 1 ? 'match' : 'matches'} across website</span>
                <span style={{ fontSize: 10 }}>Press Enter to select</span>
              </div>

              {Object.keys(groupedResults).map((category) => (
                <div key={category} style={{ marginTop: 6 }}>
                  <div style={{ padding: '6px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {category} ({groupedResults[category].length})
                  </div>

                  {groupedResults[category].map((item) => {
                    const thisIndex = flatIndex++;
                    const isSelected = selectedIndex === thisIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-card-alt)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={() => setSelectedIndex(thisIndex)}
                      >
                        <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </div>
                            {item.badge && (
                              <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 99, background: 'var(--bg-card)', border: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.subtitle}
                          </div>

                          {item.snippet && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, background: 'var(--bg-card)', padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', lineHeight: 1.4 }}>
                              "{item.snippet}"
                            </div>
                          )}
                        </div>

                        <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, flexShrink: 0, alignSelf: 'center', opacity: isSelected ? 1 : 0.6 }}>
                          Open →
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Palette Footer */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--text-muted)' }}>
            <span>Navigation: ↑ ↓ arrows · Enter to jump</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
