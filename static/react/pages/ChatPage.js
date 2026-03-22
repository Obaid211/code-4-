// Chat Page Component
const { useState, useEffect, useRef } = React;

function ChatPage({ chatLang }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [isLoadingAudioIndex, setIsLoadingAudioIndex] = useState(null);
  const chatBoxRef = useRef(null);
  const audioRef = useRef(null);

  const faqs = [
    'What crops grow best in summer?',
    'How to control aphids naturally?',
    'When should I irrigate my wheat field?',
    'Best fertilizer for rice crop?',
    'How to improve soil health?',
    'Signs of nitrogen deficiency in crops?',
  ];

  // Load chat history from Firebase on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await FirebaseService.loadChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Default greeting if no history exists
          setMessages([
            { text: "Namaste! I'm your AI Farm Assistant. I can help you with crop choices, weather updates, and pest control. How can I assist your farm today?", isUser: false }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  // Sync to Firebase when messages change (and not streaming)
  useEffect(() => {
    if (historyLoaded && !isStreaming && messages.length > 0) {
      FirebaseService.saveChatHistory(messages).catch(err =>
        console.error("Failed to save chat history:", err)
      );
    }

    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isStreaming, historyLoaded]);

  // Clean up audio object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  async function speak(text, index) {
    if (!text) return;

    // If already playing this message, stop it
    if (playingAudioIndex === index) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
      setPlayingAudioIndex(null);
      return;
    }

    try {
      setIsLoadingAudioIndex(index);

      // Stop currently playing audio or browser synthesis if any
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      window.speechSynthesis.cancel();

      // First attempt: High quality ElevenLabs backend API
      const audioBlob = await SmartAgriAPI.textToSpeech(text, chatLang);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioIndex(null);
        URL.revokeObjectURL(audioUrl);
      };

      setIsLoadingAudioIndex(null);
      setPlayingAudioIndex(index);
      await audio.play();

    } catch (err) {
      console.warn('ElevenLabs TTS failed. Falling back to browser Synthesis.', err);
      // Fallback: Browser Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { en: 'en-US', hi: 'hi-IN', bn: 'bn-IN' };
      const targetLang = langMap[chatLang] || 'en-US';
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.replace('_', '-') === targetLang) ||
        voices.find(v => v.lang.startsWith(chatLang));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9;

      utterance.onend = () => setPlayingAudioIndex(null);
      utterance.onerror = () => setPlayingAudioIndex(null);

      setIsLoadingAudioIndex(null);
      setPlayingAudioIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  }

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setMessages((prev) => [...prev, { text: msg, isUser: true }]);
    setInput('');
    setIsStreaming(true);

    // Add empty bot message that will be filled in streaming
    setMessages((prev) => [...prev, { text: '', isUser: false, streaming: true }]);

    try {
      await SmartAgriAPI.chatStream(msg, chatLang, (chunk, fullText) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { text: fullText, isUser: false, streaming: true };
          return updated;
        });
      });

      // Mark streaming complete
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, streaming: false };
        // We stopped auto-speaking here so it's strictly user-initiated
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: `Error: ${err.message}`, isUser: false, streaming: false };
        return updated;
      });
    }

    setIsStreaming(false);
  }

  async function handleMic() {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      setIsRecording(true);

      mediaRecorder.addEventListener('dataavailable', (e) => chunks.push(e.data));
      mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          const result = await SmartAgriAPI.speechToText(blob);
          if (result.text) setInput(result.text);
        } catch (e) {
          console.log('STT error:', e.message);
        }
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      });

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000);
    } catch (e) {
      alert('Microphone access denied or not available');
      setIsRecording(false);
    }
  }

  return (
    <main className="main-content">
      <div className="container chat-container">
        <header className="page-header">
          <div className="header-icon">🤖</div>
          <h1 className="header-title">AI Farm Assistant</h1>
          <p className="header-subtitle">Get instant farming advice powered by advanced AI</p>
        </header>

        <div className="faq-section">
          <div className="faq-header">
            <span className="faq-icon">💡</span>
            <h3 className="faq-title">Quick Questions</h3>
          </div>
          <div className="faq-container" id="faqContainer">
            {faqs.map((q, i) => (
              <button
                key={i}
                className="faq-btn"
                onClick={() => sendMessage(q)}
                style={{
                  background: 'var(--glass, rgba(255,255,255,0.05))',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                  color: 'var(--text, #f0f0f0)',
                  padding: '0.6rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-interface">
          <div className="chat-wrapper">
            <div className="chat-box" id="chatBox" ref={chatBoxRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.isUser ? 'user-message' : 'bot-message'}`}>
                  <div className="message-content">
                    <p>{Array.isArray(msg.text) ? msg.text.join('') : msg.text}</p>                    {!msg.isUser && !msg.streaming && msg.text && (
                      <button
                        className={`playMsg ${playingAudioIndex === i ? 'speaking' : ''} ${isLoadingAudioIndex === i ? 'loading' : ''}`}
                        onClick={() => speak(msg.text, i)}
                        aria-label="Play message"
                        disabled={isLoadingAudioIndex !== null && isLoadingAudioIndex !== i}
                      >
                        {isLoadingAudioIndex === i ? '⏳' : (playingAudioIndex === i ? '⏸️' : '🔊')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="typing-indicator" style={{ display: 'flex' }}>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
            </div>

            <div className="chat-input-wrapper">
              <button
                className="icon-btn mic-btn"
                onClick={handleMic}
                disabled={isRecording}
                title="Record voice"
              >
                {isRecording ? '🎤...' : (
                  <svg className="mic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2-.66 0-1.2-.54-1.2-1.2V4.9zm6.5 6.1c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                id="chatInput"
                className="chat-input"
                placeholder="Ask about crops, weather, pests, fertilizer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isStreaming}
              />
              <button
                className="send-button"
                onClick={() => sendMessage()}
                disabled={isStreaming || !input.trim()}
              >
                <svg className="send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

window.ChatPage = ChatPage;
