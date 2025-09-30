// Vercel API route to proxy requests to your HTTP backend
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path, ...queryParams } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Construct the backend URL
  const backendUrl = `https://goalhub.site/api/${apiPath}`;
  
  // Add query parameters (excluding the path parameter)
  const queryString = new URLSearchParams(queryParams).toString();
  const fullUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;
  
  console.log('Proxying request:', {
    method: req.method,
    originalPath: req.url,
    apiPath,
    backendUrl: fullUrl
  });
  
  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Backend error', 
        status: response.status,
        message: response.statusText 
      });
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      details: error.toString()
    });
  }
}
