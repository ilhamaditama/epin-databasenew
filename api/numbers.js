export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const response = await fetch('https://epin-3b848-default-rtdb.asia-southeast1.firebasedatabase.app/epin_active_numbers.json');
        const data = await response.json();
        const numbers = Array.isArray(data) ? data : [];
        
        res.status(200).json({ 
            status: 'success', 
            total: numbers.length, 
            numbers,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}q
