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
    const res = await fetch(`${API_URL}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) logout();
    const data = await res.json();
    setTabs(data.tabs || []);
    setLinks(data.links || []);
    if (data.tabs?.length > 0 && !activeTab) setActiveTab(data.tabs[0].id);
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
        alert('Registered! Now login.');
        setIsRegister(false);
      } else {
        alert('Registration failed');
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
        alert('Login failed');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const addTab = async () => {
    const name = prompt('Tab name:');
    if (!name) return;
    const res = await fetch(`${API_URL}/tabs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    const newTab = await res.json();
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const deleteTab = async (id) => {
    if (!window.confirm('Delete tab?')) return;
    await fetch(`${API_URL}/tabs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setTabs(tabs.filter(t => t.id !== id));
  };

  const addLink = async () => {
    const title = prompt('Title:');
    const url = prompt('URL:');
    if (!title || !url) return;
    const res = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tab_id: activeTab, title, url })
    });
    const newLink = await res.json();
    setLinks([...links, newLink]);
  };

  const deleteLink = async (id) => {
    await fetch(`${API_URL}/links/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setLinks(links.filter(l => l.id !== id));
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">LinkKeeper</h1>
          <input className="w-full p-2 border rounded mb-3" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="w-full p-2 border rounded mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white p-2 rounded mb-4">{isRegister ? 'Register' : 'Login'}</button>
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="w-full text-sm text-blue-500">
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">LinkKeeper</h1>
        <button onClick={logout} className="text-gray-500">Logout</button>
      </nav>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <div key={tab.id} className={`flex items-center border rounded ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white'}`}>
              <button onClick={() => setActiveTab(tab.id)} className="px-4 py-2">{tab.name}</button>
              <button onClick={() => deleteTab(tab.id)} className="px-2 border-l">×</button>
            </div>
          ))}
          <button onClick={addTab} className="px-4 py-2 bg-green-500 text-white rounded">+ Tab</button>
        </div>
        {activeTab && (
          <div>
            <button onClick={addLink} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">+ Add Link</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {links.filter(l => l.tab_id === activeTab).map(link => (
                <div key={link.id} className="bg-white p-4 rounded border shadow-sm flex justify-between items-center">
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 truncate">{link.title}</a>
                  <button onClick={() => deleteLink(link.id)} className="text-red-400">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;