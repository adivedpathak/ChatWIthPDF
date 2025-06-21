import { useState, useRef, useEffect } from 'react'
import { Upload, Send, FileText, Trash2, MessageSquare, Bot, User } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Enhanced Greeting Component
const Greeting = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const hour = currentTime.getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 18) greeting = 'Good Afternoon';
  
  return (
    <div className="greeting">
      <h1>PDF Chat Assistant</h1>
      <p>{greeting}! Upload your PDFs and start asking questions.</p>
    </div>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button 
      className="theme-toggle"
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

// Text Highlighter Component
const TextHighlighter = ({ children }) => {
  return <div className="text-highlighter">{children}</div>;
};

// File Item Component
const FileItem = ({ file, onRemove, index }) => (
  <div className="file-item">
    <FileText size={16} />
    <span className="file-name">{file.name}</span>
    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
    <button 
      className="remove-file"
      onClick={() => onRemove(index)}
      aria-label="Remove file"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

// Chat Message Component
const ChatMessage = ({ message, isUser }) => (
  <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
    <div className="message-avatar">
      {isUser ? <User size={20} /> : <Bot size={20} />}
    </div>
    <div className="message-content">
      <div className="message-header">
        <span className="message-sender">{isUser ? 'You' : 'Assistant'}</span>
        <span className="message-time">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <TextHighlighter>
        <div className="message-text">{message}</div>
      </TextHighlighter>
    </div>
  </div>
);

// Loading Component
const LoadingIndicator = () => (
  <div className="loading-indicator">
    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span>Processing...</span>
  </div>
);

function App() {
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const createSession = async () => {
    try {
      setConnectionStatus('connecting')
      const response = await fetch(`${API_URL}/start-session`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to start session')
      const data = await response.json()
      setSessionId(data.session_id)
      setConnectionStatus('connected')
      return data.session_id
    } catch (error) {
      console.error('Error starting session:', error)
      setConnectionStatus('error')
      throw error
    }
  }

  useEffect(() => {
    const startSession = async () => {
      try {
        await createSession()
      } catch (error) {
        console.error('Error starting session:', error)
      }
    }
    startSession()

    return () => {
      if (sessionId) {
        fetch(`${API_URL}/session/${sessionId}`, {
          method: 'DELETE'
        }).catch(error => console.error('Error cleaning up session:', error))
      }
    }
  }, [])

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files)
    
    // Validate file types and sizes
    const validFiles = uploadedFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        alert(`${file.name} is not a PDF file. Only PDF files are allowed.`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} is too large. Maximum file size is 10MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setFiles(prev => [...prev, ...validFiles])
    
    let currentSessionId = sessionId
    
    if (!currentSessionId) {
      try {
        currentSessionId = await createSession()
      } catch (error) {
        console.error('Failed to create session:', error)
        alert('Failed to create session. Please try again.')
        return
      }
    }
    
    const formData = new FormData()
    if (currentSessionId) {
      formData.append('session_id', currentSessionId)
    }
    validFiles.forEach(file => {
      formData.append('files', file)
    })
    
    try {
      setIsLoading(true)
      setUploadProgress(0)
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }
      
      const result = await response.json()
      console.log('Upload successful:', result)
      
      if (!sessionId && result.session_id) {
        setSessionId(result.session_id)
      }
      
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 2000)
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(error.message)
      // Remove failed files
      setFiles(prev => prev.filter(f => !validFiles.includes(f)))
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const clearChat = () => {
    setChatHistory([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    let currentSessionId = sessionId
    if (!currentSessionId) {
      try {
        currentSessionId = await createSession()
      } catch (error) {
        console.error('Failed to create session:', error)
        alert('Failed to create session. Please try again.')
        return
      }
    }

    const userMessage = message.trim()
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: currentSessionId
        })
      })

      if (!response.ok) throw new Error('Chat request failed')
      
      const result = await response.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }])
    } catch (error) {
      console.error('Error sending message:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="app">
      <style>{`
        :root {
          --primary-color: #4f46e5;
          --primary-hover: #4338ca;
          --secondary-color: #6b7280;
          --success-color: #10b981;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
          --border-radius: 12px;
          --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --transition: all 0.2s ease;
        }

        [data-theme="light"] {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --border-color: #e5e7eb;
          --message-user-bg: #4f46e5;
          --message-user-text: #ffffff;
          --message-assistant-bg: #f3f4f6;
          --message-assistant-text: #1f2937;
        }

        [data-theme="dark"] {
          --bg-primary: #111827;
          --bg-secondary: #1f2937;
          --bg-tertiary: #374151;
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --border-color: #374151;
          --message-user-bg: #4f46e5;
          --message-user-text: #ffffff;
          --message-assistant-bg: #374151;
          --message-assistant-text: #f9fafb;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          line-height: 1.6;
          transition: var(--transition);
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          gap: 20px;
        }

        .header {
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          padding: 24px;
          box-shadow: var(--box-shadow);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .greeting h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 4px;
        }

        .greeting p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .header-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .connection-status.connected {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-color);
        }

        .connection-status.connecting {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }

        .connection-status.error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .theme-toggle {
          background: var(--bg-tertiary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: var(--transition);
          font-size: 1.2rem;
        }

        .theme-toggle:hover {
          background: var(--border-color);
          transform: scale(1.05);
        }

        .upload-section {
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          padding: 24px;
          box-shadow: var(--box-shadow);
        }

        .upload-area {
          border: 2px dashed var(--border-color);
          border-radius: var(--border-radius);
          padding: 32px;
          text-align: center;
          transition: var(--transition);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .upload-area:hover {
          border-color: var(--primary-color);
          background: var(--bg-tertiary);
        }

        .upload-area.dragover {
          border-color: var(--primary-color);
          background: rgba(79, 70, 229, 0.05);
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          color: var(--primary-color);
        }

        .upload-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .upload-subtext {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .upload-button {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upload-button:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), var(--success-color));
          transition: width 0.3s ease;
        }

        .file-list {
          margin-top: 20px;
        }

        .file-list h3 {
          margin-bottom: 12px;
          color: var(--text-primary);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 8px;
          transition: var(--transition);
        }

        .file-item:hover {
          background: var(--border-color);
        }

        .file-name {
          flex: 1;
          font-weight: 500;
          color: var(--text-primary);
        }

        .file-size {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .remove-file {
          background: none;
          border: none;
          color: var(--error-color);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: var(--transition);
        }

        .remove-file:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .chat-container {
          flex: 1;
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          display: flex;
          flex-direction: column;
          min-height: 500px;
        }

        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .clear-chat {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }

        .clear-chat:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .chat-history {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-message {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .chat-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chat-message.user .message-avatar {
          background: var(--message-user-bg);
          color: var(--message-user-text);
        }

        .chat-message.assistant .message-avatar {
          background: var(--message-assistant-bg);
          color: var(--message-assistant-text);
        }

        .message-content {
          flex: 1;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .message-sender {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .message-time {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .message-text {
          background: var(--message-assistant-bg);
          color: var(--message-assistant-text);
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
        }

        .chat-message.user .message-text {
          background: var(--message-user-bg);
          color: var(--message-user-text);
        }

        .chat-input-area {
          padding: 20px;
          border-top: 1px solid var(--border-color);
        }

        .chat-input-form {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .input-container {
          flex: 1;
          position: relative;
        }

        .chat-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 1rem;
          line-height: 1.4;
          min-height: 48px;
          max-height: 120px;
          resize: vertical;
          transition: var(--transition);
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .send-button {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          min-width: 80px;
          justify-content: center;
        }

        .send-button:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-2px);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          color: var(--text-secondary);
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary-color);
          animation: loadingDots 1.4s infinite ease-in-out;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes loadingDots {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .empty-state-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .app {
            padding: 12px;
            gap: 16px;
          }

          .header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .greeting h1 {
            font-size: 1.5rem;
          }

          .chat-message {
            max-width: 95%;
          }

          .chat-input-form {
            flex-direction: column;
            gap: 8px;
          }

          .send-button {
            align-self: stretch;
          }
        }
      `}</style>

      <div className="header">
        <Greeting />
        <div className="header-controls">
          <div className={`connection-status ${connectionStatus}`}>
            <div className="status-dot"></div>
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'error' && 'Connection Error'}
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="upload-section">
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf"
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <Upload size={48} className="upload-icon" />
            <div className="upload-text">
              {isLoading ? 'Uploading Files...' : 'Upload PDF Documents'}
            </div>
            <div className="upload-subtext">
              Click here or drag and drop PDF files (Max 10MB each)
            </div>
            {!isLoading && (
              <button className="upload-button" type="button">
                <Upload size={16} />
                Choose Files
              </button>
            )}
          </div>
        </div>
        
        {uploadProgress > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {files.length > 0 && (
          <div className="file-list">
            <h3>
              <FileText size={20} />
              Uploaded Files ({files.length})
            </h3>
            {files.map((file, index) => (
              <FileItem 
                key={index} 
                file={file} 
                index={index} 
                onRemove={removeFile} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <MessageSquare size={20} />
            Chat Assistant
          </div>
          {chatHistory.length > 0 && (
            <button className="clear-chat" onClick={clearChat}>
              <Trash2 size={14} />
              Clear Chat
            </button>
          )}
        </div>

        <div className="chat-history">
          {chatHistory.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} className="empty-state-icon" />
              <h3>No messages yet</h3>
              <p>Upload some PDF files and start asking questions!</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <ChatMessage 
                key={index} 
                message={msg.content} 
                isUser={msg.role === 'user'} 
              />
            ))
          )}
          
          {isLoading && <LoadingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-form">
            <div className="input-container">
              <textarea
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                disabled={isLoading}
                rows="1"
              />
            </div>
            <button 
              onClick={handleSubmit}
              className="send-button"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
                
      </div>
    </div>
  )
}

export default App