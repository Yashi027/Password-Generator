import { useState, useEffect } from 'react';
import { deriveKey, encryptData, decryptData } from './crypto.js';
import { generatePassword } from './generator.js';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  const [encSalt, setEncSalt] = useState('');
  const [message, setMessage] = useState('');

  const [vault, setVault] = useState([]);
  const [decryptedVault, setDecryptedVault] = useState([]);
  const [title, setTitle] = useState('');
  const [vaultUser, setVaultUser] = useState('');
  const [vaultPass, setVaultPass] = useState('');
  const [vaultURL, setVaultURL] = useState('');
  const [vaultNotes, setVaultNotes] = useState('');
  const [search, setSearch] = useState('');
  const [length, setLength] = useState(8);
  const [numallow, setNumallow] = useState(false);
  const [challow, setChAllow] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const toggleForm = () => {
    setIsLogin(prev => !prev);
    setEmail('');
    setPassword('');
    setMessage('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return setMessage('Enter email & password');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.msg || 'Error');

      setJwtToken(data.token);
      setEncSalt(data.encSalt);

      const derivedKey = await deriveKey(password, data.encSalt);
      setKey(derivedKey);
      setMessage(isLogin ? 'Login successful!' : 'Signup successful!');

      fetchVault(data.token, derivedKey);
    } catch (err) {
      console.error(err);
      setMessage('Server error');
    }
  };

  const fetchVault = async (token, derivedKey) => {
    try {
      const res = await fetch('/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVault(data);

      const decrypted = await Promise.all(
        data.map(item => decryptData(derivedKey, item.encryptedData))
      );
      const decryptedWithId = decrypted.map((d, i) => ({ ...d, _id: data[i]._id }));
      setDecryptedVault(decryptedWithId);
    } catch (err) {
      console.error(err);
    }
  };

  const saveVaultItem = async () => {
    if (!title || !vaultUser || !vaultPass) return;

    const newItem = { title, username: vaultUser, password: vaultPass, url: vaultURL, notes: vaultNotes };
    const encrypted = await encryptData(key, newItem);

    if (editIndex !== null) {
      const itemId = vault[editIndex]._id;
      const res = await fetch(`/vault/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ encryptedData: encrypted })
      });
      const updated = await res.json();
      setVault(prev => {
        const copy = [...prev];
        copy[editIndex] = updated;
        return copy;
      });
      const decryptedUpdated = await decryptData(key, encrypted);
      setDecryptedVault(prev => {
        const copy = [...prev];
        copy[editIndex] = { ...decryptedUpdated, _id: itemId };
        return copy;
      });
      setEditIndex(null);
    } else {
      const res = await fetch('/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ encryptedData: encrypted })
      });
      const saved = await res.json();
      setVault(prev => [...prev, saved]);
      const decryptedSaved = await decryptData(key, encrypted);
      setDecryptedVault(prev => [...prev, { ...decryptedSaved, _id: saved._id }]);
    }

    setTitle(''); setVaultUser(''); setVaultPass('');
    setVaultURL(''); setVaultNotes('');
  };

  const editVaultItem = (index) => {
    const item = decryptedVault[index];
    setTitle(item.title);
    setVaultUser(item.username);
    setVaultPass(item.password);
    setVaultURL(item.url);
    setVaultNotes(item.notes);
    setEditIndex(index);
  };

  const deleteVaultItem = async (index) => {
    const itemId = vault[index]._id;
    await fetch(`/vault/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    setVault(prev => prev.filter((_, i) => i !== index));
    setDecryptedVault(prev => prev.filter((_, i) => i !== index));
  };

  const copyPassword = (id, plainPassword) => {
    navigator.clipboard.writeText(plainPassword);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 15000);
  };

  const genPassword = () => {
    setVaultPass(generatePassword(length, numallow, challow));
  };

  const filteredVault = decryptedVault.filter(item => {
    const text = `${item.title} ${item.username} ${item.url}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  if (key) {
    return (
      <div className="container mx-auto max-w-md mt-10 p-6 bg-gray-700 text-white rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Vault Panel</h1>
        <p className="mb-4 text-green-400">Logged in as: {email}</p>

        <div className="flex flex-col gap-2 mb-4">
          <input value={title} placeholder="Title" onChange={e => setTitle(e.target.value)} className="p-2 rounded text-black" />
          <input value={vaultUser} placeholder="Username" onChange={e => setVaultUser(e.target.value)} className="p-2 rounded text-black" />
          <div className="flex gap-2">
            <input value={vaultPass} placeholder="Password" onChange={e => setVaultPass(e.target.value)} className="p-2 rounded text-black flex-1" />
            <button onClick={genPassword} className="px-3 bg-orange-500 rounded">Generate</button>
          </div>
          <div className="flex gap-2 items-center">
            <label>Length:</label>
            <input type="range" min={4} max={25} value={length} onChange={e => setLength(Number(e.target.value))} />
            <label><input type="checkbox" checked={numallow} onChange={() => setNumallow(prev => !prev)} /> Numbers</label>
            <label><input type="checkbox" checked={challow} onChange={() => setChAllow(prev => !prev)} /> Special</label>
          </div>
          <input value={vaultURL} placeholder="URL" onChange={e => setVaultURL(e.target.value)} className="p-2 rounded text-black" />
          <input value={vaultNotes} placeholder="Notes" onChange={e => setVaultNotes(e.target.value)} className="p-2 rounded text-black" />
          <button onClick={saveVaultItem} className="px-3 py-2 bg-orange-500 rounded">{editIndex !== null ? 'Update Item' : 'Add Item'}</button>
        </div>

        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 rounded mb-2 text-black w-full" />

        <div className="flex flex-col gap-2">
          {filteredVault.map((item, index) => (
            <VaultItem key={item._id} item={item} index={index} copyPassword={copyPassword} editVaultItem={editVaultItem} deleteVaultItem={deleteVaultItem} copiedId={copiedId} />
          ))}
        </div>

        <button onClick={() => { setKey(null); setJwtToken(''); }} className="mt-4 px-3 py-2 bg-red-500 rounded">Logout</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md mt-10 p-6 bg-gray-700 text-white rounded-lg">
      <h1 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h1>
      <form onSubmit={handleAuth} className="flex flex-col gap-3">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 rounded text-black" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 rounded text-black" />
        <button type="submit" className="p-2 bg-orange-500 rounded">{isLogin ? 'Login' : 'Sign Up'}</button>
      </form>

      <p className="mt-4 text-sm">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <button className="text-orange-400 underline" onClick={toggleForm}>{isLogin ? 'Sign Up' : 'Login'}</button>
      </p>

      {message && <p className="mt-2 text-yellow-400">{message}</p>}
    </div>
  );
}

function VaultItem({ item, index, copyPassword, editVaultItem, deleteVaultItem, copiedId }) {
  return (
    <div className="bg-gray-600 p-2 rounded flex justify-between items-center">
      <div>
        <p><strong>{item.title}</strong></p>
        <p>{item.username}</p>
        <p>{item.url}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => copyPassword(index, item.password)} className="bg-orange-500 px-2 rounded">{copiedId === index ? 'Copied!' : 'Copy'}</button>
        <button onClick={() => editVaultItem(index)} className="bg-yellow-500 px-2 rounded">Edit</button>
        <button onClick={() => deleteVaultItem(index)} className="bg-red-500 px-2 rounded">Delete</button>
      </div>
    </div>
  );
}

export default App;
