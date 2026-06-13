import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import axios from 'axios';
import qs from 'qs';

// Get the system JWT Secret
const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key';

/**
 * POST /api/auth/register
 * Request payload: { mobile, password, full_name, referral_code (optional), username (optional) }
 */

export const sendOtp = async (req, res) => {
  console.log('OTP Request Started',req.body);
  const { mobile } = req.body;



  try {

    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required.'
      });
    }

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number.'
      });
    }

    // Check existing user
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE mobile = ?',
      [mobile]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered.'
      });
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    console.log(`Generated OTP for ${mobile}: ${otp}`);

    // Delete old OTP
    await pool.query(
      'DELETE FROM mobile_otps WHERE mobile = ?',
      [mobile]
    );

    // Save new OTP
    await pool.query(
      'INSERT INTO mobile_otps (mobile, otp) VALUES (?, ?)',
      [mobile, otp]
    );

    // UltraMsg
  


      var data = qs.stringify({
          "token": "d10qpsqqnm2lplpv",
          "to": `+91${mobile}`,
          "body": `Dragon vs Tiger

Your OTP is: ${otp}

Valid for 3 minutes.

Do not share this OTP.`
      });
      
      var config = {
        method: 'post',
        url: 'https://api.ultramsg.com/instance180512/messages/chat',
        headers: {  
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data : data
      };

      const ultraResponse = await axios(config);

console.log('UltraMsg Response');
console.log(ultraResponse.data);

    return res.json({
      success: true,
      message: 'OTP sent to whatsapp number successfully.'
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const register = async (req, res) => {
  try {
    const { mobile, password, full_name, referral_code, username, otp } = req.body;
    console.log('Registration Request Received', { mobile, full_name, referral_code, username, otp });
    // 1. Inputs validation
    // 1. Inputs validation
    if (!mobile || !password || !full_name || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number, OTP, password, and full name are required fields.'
      });
    }

    // Standard 10-digit Indian Telephone Number check
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid 10-digit Indian mobile number.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 2. Uniqueness checklist validation
    const [existingMobile] = await pool.query('SELECT id FROM users WHERE mobile = ?', [mobile]);
    if (existingMobile && existingMobile.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this mobile number already exists.'
      });
    }
    // OTP Validation
const [otpRows] = await pool.query(
  'SELECT * FROM mobile_otps WHERE mobile = ? AND otp = ?',
  [mobile, otp]
);

if (!otpRows || otpRows.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'Invalid OTP.'
  });
}

const otpRecord = otpRows[0];

const otpAge =
  Date.now() -
  new Date(otpRecord.created_at).getTime();

if (otpAge > 3 * 60 * 1000) {
  await pool.query(
    'DELETE FROM mobile_otps WHERE mobile = ?',
    [mobile]
  );

  return res.status(400).json({
    success: false,
    message: 'OTP expired. Please generate a new OTP.'
  });
}

    // 3. Optional Referral mapping verification
    let referredById = null;
    if (referral_code) {
      const [referrer] = await pool.query('SELECT id FROM users WHERE referral_code = ?', [referral_code]);
      if (referrer && referrer.length > 0) {
        referredById = referrer[0].id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code provided.'
        });
      }
    }

    // 4. Generate highly randomized secure referral_code: DRG + 5 random digits
    let uniqueReferralCode = '';
    let isReferralUnique = false;
    let fallbackAttempts = 15;
    while (!isReferralUnique && fallbackAttempts > 0) {
      const randomPart = Math.floor(10000 + Math.random() * 90000); // 5 digits
      uniqueReferralCode = `DRG${randomPart}`;
      const [existingMatches] = await pool.query('SELECT id FROM users WHERE referral_code = ?', [uniqueReferralCode]);
      if (existingMatches && existingMatches.length === 0) {
        isReferralUnique = true;
      }
      fallbackAttempts--;
    }

    // 5. Generate secure user login alias/username to avoid unique constraints errors
    let cleanUsername = username;
    if (!cleanUsername) {
      // Create user fallback
      cleanUsername = 'player_' + mobile.slice(-6) + Math.floor(10 + Math.random() * 90);
    }
    
    let isUsernameUnique = false;
    let uAttempts = 15;
    while (!isUsernameUnique && uAttempts > 0) {
      const [userMatches] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
      if (userMatches && userMatches.length === 0) {
        isUsernameUnique = true;
      } else {
        cleanUsername = 'player_' + mobile.slice(-6) + Math.floor(1000 + Math.random() * 9000);
      }
      uAttempts--;
    }

    // 6. Secure Hashing of Password using standard bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 7. Write to MySQL Database
    const [insertResult] = await pool.query(
      'INSERT INTO users (mobile, password_hash, full_name, username, referral_code, referred_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [mobile, passwordHash, full_name, cleanUsername, uniqueReferralCode, referredById, 'active']
    );

    const insertedUserId = insertResult.insertId;
    // OTP consumed successfully
await pool.query(
  'DELETE FROM mobile_otps WHERE mobile = ?',
  [mobile]
);

    // 8. Handle Referrals Ledger if a valid referrer referenced them
    if (referredById) {
      const referralBonusAmount = 50.00; // Standalone referral reward configuration fallback
      await pool.query(
        'INSERT INTO referrals (referrer_id, referred_id, bonus_amount, bonus_credited) VALUES (?, ?, ?, ?)',
        [referredById, insertedUserId, referralBonusAmount, 1]
      );
      // Give referral bonus credits to the referencing partner user
      await pool.query(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [referralBonusAmount, referredById]
      );
      // Log transactional footprint
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
        [referredById, 'referral_bonus', referralBonusAmount, 0, referralBonusAmount, `Referral sign-up bonus for introducing username: @${cleanUsername}`]
      );
    }

    // 9. Fetch registered transaction details securely
    const [fetchedUsers] = await pool.query(
      'SELECT id, mobile, full_name, username, wallet_balance, referral_code, referred_by, is_banned, status, created_at FROM users WHERE id = ?',
      [insertedUserId]
    );
    const completeUserObject = fetchedUsers[0];

    // 10. Generate access token expiration window JWT
    const token = jwt.sign(
      { id: completeUserObject.id, username: completeUserObject.username, mobile: completeUserObject.mobile },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // ✅ SET JWT AS HTTP-ONLY COOKIE (for color.html secure access)
    res.cookie('authToken', token, {
      httpOnly: true,        // Secure: JavaScript cannot access
      secure: false,         // Set to true in production (HTTPS only)
      sameSite: 'lax',       // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: completeUserObject
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error processing registration request: ' + error.message,
      data: {}
    });
  }
};

/**
 * POST /api/auth/login
 * Request payload: { mobile, password }
 */
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both mobile number and password to sign in.'
      });
    }

    // Check database user existence
    const [rows] = await pool.query(
      'SELECT id, mobile, password_hash, full_name, username, wallet_balance, referral_code, referred_by, is_banned, status, created_at FROM users WHERE mobile = ?',
      [mobile]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or incorrect password credentialslllll.'
      });
    }

    const matchedUser = rows[0];

    // Protect suspended player profiles
    if (matchedUser.is_banned === 1 || matchedUser.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by support team limits.lllllllllllllfffff'
      });
    }
    console.log("Payload:", { mobile, password });
    console.log("DB Hash:", matchedUser.password_hash);
    // Match secret credentials passwords
    const isValidPassword = await bcrypt.compare(password, matchedUser.password_hash);
    // --- ADDED FOR DEBUGINIG BY JUNIOR ---
console.log('\n======================================');
console.log('=== PASSWORD & HASH DEVIATION LOG ===');
console.log('======================================');
console.log('1. User Mobile:        ', matchedUser.mobile);
console.log('2. Input Plaintext Pass:', `"${password}"`);
console.log('3. Input Pass Length:  ', password ? password.length : 0);
console.log('4. Stored Hash in DB:  ', `"${matchedUser.password_hash}"`);
console.log('5. Stored Hash Length: ', matchedUser.password_hash ? matchedUser.password_hash.length : 0);
console.log('6. Stored Hash Type:   ', typeof matchedUser.password_hash);
console.log('7. Exact Byte Buffer:  ', matchedUser.password_hash ? Buffer.from(matchedUser.password_hash).toString('hex') : 'N/A');

// Let's do a safe test attempt
try {
  const check = await bcrypt.compare(password, matchedUser.password_hash);
  console.log('8. Bcrypt test match:  ', check);
} catch (e) {
  console.log('8. Bcrypt test error:  ', e.message);
}
console.log('======================================\n');
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or incorrect password credentials. ddddddddd'
      });
    }

    // Mask security password before shipping credentials object
    delete matchedUser.password_hash;

    // Generate authenticated JWT claim token
    const token = jwt.sign(
      { id: matchedUser.id, username: matchedUser.username, mobile: matchedUser.mobile },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // ✅ SET JWT AS HTTP-ONLY COOKIE (for color.html secure access)
    res.cookie('authToken', token, {
      httpOnly: true,        // Secure: JavaScript cannot access
      secure: false,         // Set to true in production (HTTPS only)
      sameSite: 'lax',       // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        token,
        user: matchedUser
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error parsing authenticated sign-in: ' + error.message,
      data: {}
    });
  }
};

// 1. ADD THIS TO YOUR ROUTE CONTROLLERS list in your backend auth flow:

/**
 * POST /api/auth/forgot-send-otp
 * Payload: { mobile }
 */
/**
 * POST /api/auth/forgot-send-otp
 * Request payload: { mobile }
 */
export const forgotSendOtp = async (req, res) => {
  console.log('Forgot Password OTP Request Started', req.body);
  const { mobile } = req.body;

  try {
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required.'
      });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format.'
      });
    }

    // Check if the user is registered first! (Unlike sign-up, they MUST exist)
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE mobile = ?',
      [mobile]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mobile number is not registered on this platform.'
      });
    }

    // Generate 6-digit secure OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated Forgot Pass OTP for ${mobile}: ${otp}`);

    // Flush old temporary OTPs
    await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);

    // Save the new OTP
    await pool.query(
      'INSERT INTO mobile_otps (mobile, otp) VALUES (?, ?)',
      [mobile, otp]
    );

    // Send through UltraMsg Instance
    var data = qs.stringify({
      "token": "d10qpsqqnm2lplpv",
      "to": `+91${mobile}`,
      "body": `Dragon vs Tiger Arena \n\nRESET CODE: ${otp}\n\nYour OTP to reset your password is valid for 3 minutes. Do not share this pin.`
    });
    
    var config = {
      method: 'post',
      url: 'https://api.ultramsg.com/instance180512/messages/chat',
      headers: {  
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const ultraResponse = await axios(config);
    console.log('UltraMsg Forgot OTP Response:', ultraResponse.data);

    // ✅ FIXING THE JSON ERROR: Always return strict JSON
    return res.json({
      success: true,
      message: 'OTP sent to your WhatsApp successfully.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error sending verification code: ' + error.message
    });
  }
};

/**
 * POST /api/auth/forgot-reset
 * Request payload: { mobile, otp, password }
 */
/**
 * POST /api/auth/forgot-reset
 * Request payload: { mobile, otp, password }
 */
export const forgotResetPassword = async (req, res) => {
  try {
    const mobile = req.body.mobile?.toString().trim();
    const otp = req.body.otp?.toString().trim();
    const password = req.body.password?.toString().trim();

    if (!mobile || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number, verification OTP, and new password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // 1. Is there an OTP matching this profile? Force MySQL to return UNIX integer to bypass timezone offsets
    const [otpRows] = await pool.query(
      'SELECT *, UNIX_TIMESTAMP(created_at) AS created_timestamp FROM mobile_otps WHERE mobile = ? AND otp = ?',
      [mobile, otp]
    );

    if (!otpRows || otpRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code received. Please request a new one.'
      });
    }

    // 2. Perform Timezone-independent age check
    const otpRecord = otpRows[0];
    const createdTimeMs = otpRecord.created_timestamp 
      ? otpRecord.created_timestamp * 1000 
      : new Date(otpRecord.created_at).getTime();

    const otpAge = Date.now() - createdTimeMs;

    // Guard against both real expiration (> 3 mins) and future-skewed clocks (< -3 mins)
    if (otpAge > 3 * 60 * 1000 || otpAge < -3 * 60 * 1000) {
      await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);
      return res.status(400).json({
        success: false,
        message: 'Your reset OTP has expired. Please try again.'
      });
    }

    // 3. Hash the secure new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Update the database records
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE mobile = ?',
      [passwordHash, mobile]
    );

    // 5. Flush the consumed OTP record
    await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);

    return res.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database action crash: ' + error.message
    });
  }
};

/**
 * POST /api/auth/change-password-direct
 * Request format: { oldPassword, newPassword }
 */
export const changePasswordDirect = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // 1. Fetch user hash from database
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // 2. Compare existing password hash
    const isMatched = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: 'Your current password matches incorrect credentials.'
      });
    }

    // 3. Hash and store new credentials
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({
      success: true,
      message: 'Password modernized successfully.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'System processing error: ' + error.message });
  }
};

/**
 * POST /api/auth/change-password-send-otp
 * Authenticated handler to dispatch OTP for change confirmation
 */
export const changePasswordSendOtp = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch registered mobile number
    const [users] = await pool.query('SELECT mobile FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Identity not found.' });
    }
    const mobile = users[0].mobile;

    // Generate 6-digit OTP code to clear previous logs
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);
    await pool.query('INSERT INTO mobile_otps (mobile, otp) VALUES (?, ?)', [mobile, otp]);

    // Dispatch via UltraMsg
    var data = qs.stringify({
      "token": "d10qpsqqnm2lplpv",
      "to": `+91${mobile}`,
      "body": `Dragon vs Tiger Arena \n\nCHANGE PASSWORD CODE: ${otp}\n\nYour security confirmation OTP code is valid for 3 minutes. Do not share this pin.`
    });
    
    var config = {
      method: 'post',
      url: 'https://api.ultramsg.com/instance180512/messages/chat',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: data
    };

    await axios(config);

    return res.json({
      success: true,
      message: 'OTP dispatched to your registered WhatsApp.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to dispatch verification: ' + error.message });
  }
};

/**
 * POST /api/auth/change-password-otp
 * Request format: { otp, newPassword, oldPassword }
 */
/**
 * POST /api/auth/change-password-otp
 * Request format: { otp, newPassword }
 */
export const changePasswordOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, newPassword } = req.body;

    // Validate only OTP and New Password are provided
    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'OTP code and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // 1. Check user state and retrieve registered mobile
    const [users] = await pool.query('SELECT mobile FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Identity target expired.' });
    }
    const userMatched = users[0];
    const mobile = userMatched.mobile;

    // 2. Validate OTP code match
    const [otpRows] = await pool.query(
      'SELECT *, UNIX_TIMESTAMP(created_at) AS created_timestamp FROM mobile_otps WHERE mobile = ? AND otp = ?',
      [mobile, otp]
    );

    if (!otpRows || otpRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid verification OTP code.' });
    }

    // Checking age (3 minutes window)
    const otpAge = Date.now() - (otpRows[0].created_timestamp * 1000);
    if (otpAge > 3 * 60 * 1000) {
      await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);
      return res.status(400).json({ success: false, message: 'OTP verification expired.' });
    }

    // 3. Complete changes by hashing new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    await pool.query('DELETE FROM mobile_otps WHERE mobile = ?', [mobile]);

    return res.json({
      success: true,
      message: 'Password updated through cryptographic OTP matching!'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Verification processing crash: ' + error.message });
  }
};

/**
 * POST /api/auth/admin-login
 * Request payload: { username, password }
 */
export const adminLogin = async (req, res) => {
  try {

    const { username, password, otp } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide administrative credentials username and password parameters.'
      });
    }

    const [admins] = await pool.query(
      `
      SELECT
        id,
        username,
        password_hash,
        full_name,
        role,
        is_active,
        mobile
      FROM admins
      WHERE username = ?
      `,
      [username]
    );

    if (!admins || admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator login parameters or permissions.'
      });
    }

    const matchedAdmin = admins[0];

    if (matchedAdmin.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: 'This administration portal account has been deactivated.'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      matchedAdmin.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator login parameters or permissions.'
      });
    }

    // OTP Validation
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP required'
      });
    }

    const [otpRows] = await pool.query(
      `
      SELECT *
      FROM mobile_otps
      WHERE mobile = ?
      AND otp = ?
      `,
      [
        matchedAdmin.mobile,
        otp
      ]
    );

    if (!otpRows || otpRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const otpRecord = otpRows[0];

    const age =
      Date.now() -
      new Date(otpRecord.created_at).getTime();

    if (age > 3 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    // Consume OTP
    await pool.query(
      `
      DELETE FROM mobile_otps
      WHERE mobile = ?
      `,
      [matchedAdmin.mobile]
    );

    delete matchedAdmin.password_hash;

    const token = jwt.sign(
      {
        id: matchedAdmin.id,
        username: matchedAdmin.username,
        role: matchedAdmin.role,
        isAdmin: true
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Administrator session authenticated.',
      data: {
        token,
        admin: matchedAdmin
      }
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message:
        'Server failure parsing admin auth signature: ' +
        error.message,
      data: {}
    });

  }
};

export const adminSendOtp = async (
  req,
  res
) => {

  try {

    const {
      username,
      password
    } = req.body;

    const [admins] =
      await pool.query(
        `
        SELECT *
        FROM admins
        WHERE username = ?
        `,
        [username]
      );

    if (
      !admins ||
      admins.length === 0
    ) {

      return res.status(401).json({
        success: false,
        message: 'Invalid admin'
      });

    }

    const admin =
      admins[0];

    const valid =
      await bcrypt.compare(
        password,
        admin.password_hash
      );

    if (!valid) {

      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });

    }

    const otp =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

    await pool.query(
      `
      DELETE
      FROM mobile_otps
      WHERE mobile = ?
      `,
      [admin.mobile]
    );

    await pool.query(
      `
      INSERT INTO mobile_otps
      (
        mobile,
        otp
      )
      VALUES
      (
        ?,
        ?
      )
      `,
      [
        admin.mobile,
        otp
      ]
    );

    // Use your existing UltraMsg code here

var data = qs.stringify({
    "token": "d10qpsqqnm2lplpv",
    "to": `91${admin.mobile}`,
    "body": `Dragon vs Tiger Admin Login

Your OTP is: ${otp}

Valid for 3 minutes.

Do not share this OTP.`
});

var config = {
    method: 'post',
    url: 'https://api.ultramsg.com/instance180512/messages/chat',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
};

const ultraResponse = await axios(config);

console.log(
    'Admin OTP Sent:',
    ultraResponse.data
);

return res.json({
    success: true,
    message: 'OTP sent to whatsapp number successfully.'
});

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

/**
 * GET /api/auth/me
 * Protected caller authentication signature
 */
export const me = async (req, res) => {
  try {
    const activeUserId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, mobile, full_name, username, wallet_balance, referral_code, referred_by, is_banned, status, created_at FROM users WHERE id = ?',
      [activeUserId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found in database registry.'
      });
    }

    const fullProfileObj = users[0];

    return res.json({
      success: true,
      message: 'Fetched current user authenticated state identity.',
      data: {
        user: fullProfileObj
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to synchronize authenticated context profile: ' + error.message,
      data: {}
    });
  }
};
