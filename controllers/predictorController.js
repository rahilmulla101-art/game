// controllers/predictorController.js
import pool from '../config/db.js';

export const verifyPredictorToken = async (req, res) => {
  const { token, deviceId } = req.body; // deviceId from Capacitor/Browser fingerprint

  try {
    const [rows] = await pool.query(
      'SELECT * FROM predictor_tokens WHERE token_string = ? AND is_active = 1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const tokenData = rows[0];

    // Check Expiry
    if (new Date(tokenData.expiry_date) < new Date()) {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }

    // Device Binding Logic
    if (!tokenData.device_id) {
      // First time login - Bind the device
      await pool.query(
        'UPDATE predictor_tokens SET device_id = ?, ip_address = ? WHERE id = ?',
        [deviceId, req.ip, tokenData.id]
      );
    } else if (tokenData.device_id !== deviceId) {
      // Shared token detection
      return res.status(403).json({ success: false, message: 'This token is registered to another device.' });
    }

    return res.json({ 
      success: true, 
      type: tokenData.access_type,
      message: 'Access granted.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};