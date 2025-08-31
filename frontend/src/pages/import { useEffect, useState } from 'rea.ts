import { useEffect, useState } from 'react';

function App() {
  const [results, setResults] = useState([]);
  useEffect(() => {
    fetch(`${import.meta.env.API_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Sample text' })
    })
      .then(res => res.json())
      .then(data => setResults([data]));
  }, []);
  return <div>{JSON.stringify(results)}</div>;
}

export default App;