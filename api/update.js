// api/update.js - Endpoint untuk update data (dengan auth)
const FIREBASE_URL = 'https://epin-3b848-default-rtdb.asia-southeast1.firebasedatabase.app/';

// Password akses API (jaga-jaga)
const API_PASSWORD = 'epineek2';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { password, action, phoneNumber, numbers } = req.body;
    
    // Validasi password
    if (password !== API_PASSWORD) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized - Password salah!' 
        });
    }
    
    try {
        let result;
        
        switch(action) {
            case 'add':
                if (!phoneNumber) {
                    return res.status(400).json({ success: false, error: 'Phone number required' });
                }
                
                // Ambil data existing
                const addResponse = await fetch(`${FIREBASE_URL}epin_active_numbers.json`);
                let existingNumbers = await addResponse.json() || [];
                
                if (existingNumbers.includes(phoneNumber)) {
                    return res.status(400).json({ success: false, error: 'Number already exists' });
                }
                
                existingNumbers.push(phoneNumber);
                
                // Save ke Firebase
                await fetch(`${FIREBASE_URL}epin_active_numbers.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(existingNumbers)
                });
                
                result = { success: true, message: 'Number added', total: existingNumbers.length };
                break;
                
            case 'delete':
                if (!phoneNumber) {
                    return res.status(400).json({ success: false, error: 'Phone number required' });
                }
                
                // Ambil data existing
                const delResponse = await fetch(`${FIREBASE_URL}epin_active_numbers.json`);
                let currentNumbers = await delResponse.json() || [];
                
                if (!currentNumbers.includes(phoneNumber)) {
                    return res.status(400).json({ success: false, error: 'Number not found' });
                }
                
                const newNumbers = currentNumbers.filter(num => num !== phoneNumber);
                
                // Save ke Firebase
                await fetch(`${FIREBASE_URL}epin_active_numbers.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newNumbers)
                });
                
                result = { success: true, message: 'Number deleted', total: newNumbers.length };
                break;
                
            case 'update_all':
                if (!numbers || !Array.isArray(numbers)) {
                    return res.status(400).json({ success: false, error: 'Numbers array required' });
                }
                
                await fetch(`${FIREBASE_URL}epin_active_numbers.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(numbers)
                });
                
                result = { success: true, message: 'Database updated', total: numbers.length };
                break;
                
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }
        
        // Log aktivitas
        await fetch(`${FIREBASE_URL}epin_activity_log.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: `API_${action.toUpperCase()}`,
                role: 'API',
                details: phoneNumber ? `via API: ${phoneNumber}` : 'via API',
                date: new Date().toLocaleDateString('id-ID'),
                time: new Date().toLocaleTimeString('id-ID'),
                timestamp: new Date().toISOString()
            })
        });
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
      }
