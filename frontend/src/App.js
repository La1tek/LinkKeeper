import React, { useState, useEffect } from 'react';

const API_URL = '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tabs, setTabs] = useState([]);
  const [links, setLinks] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setTabs(data.tabs || []);
      setLinks(data.links || []);
      if (data.tabs?.length > 0 && !activeTab) {
        setActiveTab(data.tabs[0].id);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegister) {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        alert('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        alert('Registration failed. User might already exist.');
      }
    } else {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${API_URL}/token`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      } else {
        alert('Login failed. Check your credentials.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTabs([]);
    setLinks([]);
    setActiveTab(null);
  };

  const addTab = async () => {
    const name = prompt('Enter tab name:');
    if (!name) return;
    const res = await fetch(`${API_URL}/tabs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const newTab = await res.json();
      setTabs([...tabs, newTab]);
      setActiveTab(newTab.id);
    }
  };

  const deleteTab = async (id) => {
    if (!window.confirm('Delete this tab and all its links?')) return;
    const res = await fetch(`${API_URL}/tabs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setTabs(tabs.filter(t => t.id !== id));
      if (activeTab === id) setActiveTab(tabs[0]?.id || null);
    }
  };

  const addLink = async () => {
    const title = prompt('Link title:');
    const url = prompt('URL (e.g., https://google.com):');
    if (!title || !url) return;
    const res = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ tab_id: activeTab, title, url })
    });
    if (res.ok) {
      const newLink = await res.json();
      setLinks([...links, newLink]);
    }
  };

  const deleteLink = async (id) => {
    const res = await fetch(`${API_URL}/links/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setLinks(links.filter(l => l.id !== id));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-600">LinkKeeper</h1>
          <div className="space-y-4">
            <input 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
            />
            <input 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
            <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setIsRegister(!isRegister)} 
            className="w-full text-sm text-blue-500 mt-4 hover:underline"
          >
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register here'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">LINKKEEPER</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 hidden sm:block">Hello, <span className="font-semibold">{username}</span></span>
            <button onClick={logout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Tabs Row */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <div key={tab.id} className={`flex items-center rounded-lg shadow-sm overflow-hidden border ${activeTab === tab.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200'}`}>
              <button 
                onClick={() => setActiveTab(tab.id)} 
                className={`px-5 py-2.5 font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {tab.name}
              </button>
              <button 
                onClick={() => deleteTab(tab.id)} 
                className={`px-3 py-2.5 transition-colors border-l ${activeTab === tab.id ? 'bg-blue-700 text-blue-100 hover:bg-red-600 hover:text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            onClick={addTab} 
            className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 shadow-sm transition-all active:scale-95"
          >
            + New Tab
          </button>
        </div>

        {/* Content Area */}
        {activeTab ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {tabs.find(t => t.id === activeTab)?.name} <span className="text-gray-400 font-normal text-sm ml-2">({links.filter(l => l.tab_id === activeTab).length} links)</span>
              </h2>
              <button 
                onClick={addLink} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
              >
                + Add Link
              </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.filter(l => l.tab_id === activeTab).map(link => (
                <div key={link.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                  <div className="flex flex-col truncate mr-4">
                    <span className="text-gray-900 font-bold truncate group-hover:text-blue-600 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-gray-400 text-xs truncate mt-1">
                      {link.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Кнопка Открыть */}
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      title="Open Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>

                    {/* Кнопка Удалить */}
                    <button 
                      onClick={() => deleteLink(link.id)} 
                      className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {links.filter(l => l.tab_id === activeTab).length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                  No links here yet. Click "Add Link" to start.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-inner">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-gray-700">Select or create a tab</h3>
            <p className="text-gray-400 mt-2">Organize your bookmarks by categories</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;