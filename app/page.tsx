// app/page.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Stack,
  Avatar,
  Chip,
  Collapse,
  Button,
  CircularProgress,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Place as PlaceIcon,
  Home as HomeIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useColorMode } from './theme-provider';

// -------------------- Types --------------------

type ApiRole = 'user' | 'assistant';
type ApiMessage = { role: ApiRole; content: string };

type Match = {
  score: number;        // base similarity
  boostedScore: number; // after small intent boost
  type: string;         // dorm | study_place | text_chunk | ...
  title: string;        // name or section
  snippet: string;      // preview text
};

type Message = {
  id: string;
  role: ApiRole;
  content: string;
  matches?: Match[];
};

// -------------------- UI helpers --------------------

const scrollbarStyles = {
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(145, 158, 171, 0.48)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
};

const MAX_MESSAGES_TO_SEND = 12;

function typeIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'study_place') return <PlaceIcon sx={{ fontSize: 18 }} />;
  if (t === 'dorm') return <HomeIcon sx={{ fontSize: 18 }} />;
  return <ArticleIcon sx={{ fontSize: 18 }} />;
}

function typeLabel(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'study_place') return 'Study place';
  if (t === 'dorm') return 'Dorm';
  if (t === 'text_chunk' || t === 'text') return 'Guide';
  return 'Source';
}

// -------------------- Page --------------------

export default function ChatPage() {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I’m your Munich Student Assistant. I can help with study places, dorms, visas, health insurance, blocked accounts, cheap food, transport, and more.\n\nTry asking:\n• Where can I study quietly on Sunday?\n• Suggest dorms under €450 near Garching.\n• How does a blocked account work?\n• Cheap places to eat near Maxvorstadt?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function sendMessage() {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setError(null);
    setLoading(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    // deterministic state for payload
    const nextMessages: Message[] = [...messages, userMsg];
    setMessages(nextMessages);

    try {
      const payloadMessages: ApiMessage[] = nextMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-MAX_MESSAGES_TO_SEND)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/prof-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }

      const data: { answer?: string; matches?: Match[] } = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No answer returned.',
        matches: Array.isArray(data.matches) ? data.matches : [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 900,
          height: { xs: '90vh', md: '85vh' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: (theme) =>
            `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(
              theme.palette.grey[500],
              0.12
            )}`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                boxShadow: (theme) => `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.24)}`,
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Munich Student Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Study spots • Dorms • Visa/Insurance • Budget tips • Transport
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={toggleColorMode}
            sx={{
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.16) },
            }}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, ...scrollbarStyles }}>
          <Stack spacing={3}>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}

            {loading && (
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <SchoolIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    borderRadius: 2,
                    px: 2.5,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={16} thickness={5} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Error */}
        {error && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'error.main',
                display: 'block',
                bgcolor: alpha(theme.palette.error.main, 0.08),
                p: 1.5,
                borderRadius: 1,
              }}
            >
              {error}
            </Typography>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder='Try: "Quiet study place open late", "Dorms under €450 near Garching", "Blocked account steps"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            multiline
            minRows={1}
            maxRows={4}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': {
                        bgcolor: alpha(theme.palette.grey[500], 0.24),
                        color: alpha(theme.palette.grey[500], 0.8),
                      },
                    }}
                  >
                    <SendIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { pr: 1 },
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}

// -------------------- Message Bubble --------------------

type MessageBubbleProps = {
  message: Message;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
};

function MessageBubble({ message, expandedId, setExpandedId }: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const matches = message.matches || [];

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
    >
      {!isUser && (
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
          <SchoolIcon sx={{ fontSize: 20 }} />
        </Avatar>
      )}

      <Box sx={{ maxWidth: '75%' }}>
        <Box
          sx={{
            bgcolor: isUser ? 'primary.main' : alpha(theme.palette.grey[500], 0.08),
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            px: 2.5,
            py: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 0.5, opacity: 0.72, fontWeight: 600 }}
          >
            {isUser ? 'You' : 'Assistant'}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        </Box>

        {!isUser && matches.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              onClick={() => setExpandedId(expandedId === message.id ? null : message.id)}
              endIcon={
                expandedId === message.id ? (
                  <ExpandLessIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 18 }} />
                )
              }
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.08) },
              }}
            >
              {matches.length} source{matches.length > 1 ? 's' : ''} (tap to view)
            </Button>

            <Collapse in={expandedId === message.id}>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {matches.map((m, idx) => (
                  <Card
                    key={`${m.title}-${idx}`}
                    variant="outlined"
                    sx={{ borderColor: alpha(theme.palette.grey[500], 0.16), boxShadow: 'none' }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                            }}
                          >
                            {typeIcon(m.type)}
                          </Avatar>

                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
                              {m.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              {typeLabel(m.type)}
                            </Typography>
                          </Box>
                        </Stack>

                        <Chip
                          label={`${Math.round((m.boostedScore ?? m.score) * 100)}%`}
                          size="small"
                          sx={{
                            height: 24,
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                            color: 'success.dark',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1, lineHeight: 1.5 }}
                      >
                        {m.snippet}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
          <PersonIcon sx={{ fontSize: 20 }} />
        </Avatar>
      )}
    </Stack>
  );
}
