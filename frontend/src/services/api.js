export const predictText = async (text, token) => {
  const response = await fetch('http://127.0.0.1:5000/api/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
  return response.json();
};
