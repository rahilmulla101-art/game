/**
 * Dragon vs Tiger Casino API Gateway Client
 * Handles authenticated request logic, response mapping, toast logs and spinner coordination
 */

// const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
//   ? 'http://localhost:3000/api'
//   : window.location.origin + '/api';

// api.js - Update the BASE_URL
const BASE_URL = 'https://game-beqs.onrender.com/api';

// Dynamic Loading Spinner Injector
function showLoadingSpinner() {
  let spinner = document.getElementById('global-api-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'global-api-spinner';
    spinner.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] transition-opacity duration-300';
    spinner.innerHTML = `
      <div class="bg-gray-900 border border-amber-500/20 px-8 py-6 rounded-2xl flex flex-col items-center shadow-2xl text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
        <p class="text-amber-500 font-mono text-sm tracking-widest uppercase">TRANSACTION IN PROGRESS...</p>
      </div>
    `;
    document.body.appendChild(spinner);
  }
  spinner.classList.remove('pointer-events-none', 'opacity-0');
  spinner.classList.add('flex');
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('global-api-spinner');
  if (spinner) {
    spinner.classList.add('pointer-events-none', 'opacity-0');
    setTimeout(() => {
      const liveSpinner = document.getElementById('global-api-spinner');
      if (liveSpinner && liveSpinner.classList.contains('opacity-0')) {
        liveSpinner.remove();
      }
    }, 300);
  }
}

// Custom Toast System
function showToast(type, message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-6 right-6 z-[10000] flex flex-col gap-3 max-w-sm w-full';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30' : 'bg-red-950/95 border-red-500/30';
  const textColor = type === 'success' ? 'text-emerald-400' : 'text-red-400';
  const icon = type === 'success' ? '✅' : '❌';

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor} ${textColor} shadow-2xl transition-all duration-300 translate-x-12 opacity-0`;
  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span class="font-sans text-sm font-medium mr-2">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger entering animation
  setTimeout(() => {
    toast.classList.remove('translate-x-12', 'opacity-0');
  }, 10);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Base Fetch Wrapper
async function apiCall(method, endpoint, body = null, isFormData = false) {
  // Determine correct authorization token
  let tokenKey = 'dvt_token';
  if (endpoint.startsWith('admin/') || endpoint.startsWith('/admin/') || window.location.pathname.includes('admin')) {
    tokenKey = 'dvt_admin_token';
  }
  const token = localStorage.getItem(tokenKey);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let options = {
    method,
    headers
  };

  if (body) {
    if (isFormData) {
      options.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  showLoadingSpinner();

  try {
    const url = `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
    const response = await fetch(url, options);

    if (response.status === 401) {
      hideLoadingSpinner();
      
      // Perform automated local authentication cleanups
      localStorage.removeItem('dvt_token');
      localStorage.removeItem('dvt_admin_token');
      localStorage.removeItem('dvt_user');
      localStorage.removeItem('dvt_admin_user');

      // Check current path to prevent infinite redirect loops
      const currentPath = window.location.pathname;
      if (!currentPath.endsWith('login.html')) {
        showToast('error', 'Session expired. Please log in.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }
      return { success: false, error: 'Unauthorized credentials.' };
    }

    // 1. Read response body as raw text first
    const responseText = await response.text();
    let data = {};
    
    // 2. Safely parse ONLY if there is actual text in the response body
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.error('JSON parsing failed. Raw body text:', responseText);
        hideLoadingSpinner();
        showToast('error', 'Server returned invalid format.');
        return { success: false, error: 'Invalid JSON response.' };
      }
    } else {
      // Create a fallback object for 200/204 No Content responses
      data = { 
        success: response.ok, 
        message: response.ok ? 'Operation completed successfully.' : 'API operation failed.' 
      };
    }

    hideLoadingSpinner();

    if (!response.ok) {
      showToast('error', data.message || 'API operation failed.');
      return { success: false, error: data.message || 'Network operation failed.' };
    }

    // Standard API wrapper mapping back
    return { success: true, data: data.data, message: data.message };
  } catch (err) {
    hideLoadingSpinner();
    console.error('API Error Execution:', err);
    showToast('error', 'Unable to reach game server. Checking connection...');
    return { success: false, error: 'Network error or service offline.' };
  }
}

// ==========================================
// 1. CLIENT AUTH OPERATIONS
// ==========================================
const register = async (mobile, password, full_name, referral_code,otp) => {
  return apiCall('POST', 'auth/register', { mobile, password, full_name, referral_code,otp });
};

const sendOtp = async (mobile) => {
  return apiCall('POST', 'auth/send-otp', { mobile });
};

const login = async (mobile, password) => {
  return apiCall('POST', 'auth/login', { mobile, password });
};

const adminLogin = async (username, password,otp) => {
  return apiCall('POST', 'auth/admin-login', { username, password, otp });
};

const adminSendOtp = async (
  username,
  password
) => {

  return apiCall(
    'POST',
    'auth/admin-send-otp',
    {
      username,
      password
    }
  );

};

// Add these function signatures to api.js:
const forgotSendOtp = async (mobile) => {
  return apiCall('POST', 'auth/forgot-send-otp', { mobile });
};

const changePasswordDirect = async (oldPassword, newPassword) => {
  return apiCall('POST', 'auth/change-password-direct', { oldPassword, newPassword });
};

const changePasswordSendOtp = async () => {
  return apiCall('POST', 'auth/change-password-send-otp');
};
const sendChangePasswordOtp = changePasswordSendOtp; // Safety alias

// Change Password - OTP Method (Removed oldPassword parameter)
const changePasswordOtp = async (otp, newPassword) => {
  return apiCall('POST', 'auth/change-password-otp', { otp, newPassword });
};
// Fix: Name the function resetPassword to match your login.html form, and use the correct endpoint
const resetPassword = async (mobile, otp, password) => {
  return apiCall('POST', 'auth/forgot-reset', { mobile, otp, password });
};

const getMe = async () => {
  return apiCall('GET', 'auth/me');
};

// ==========================================
// 2. FUNDING & WALLET MANAGEMENT
// ==========================================
const getBalance = async () => {
  return apiCall('GET', 'wallet/balance');
};

const getTransactions = async (page = 1, type = '') => {
  return apiCall('GET', `wallet/transactions?page=${page}&type=${type}`);
};

const submitDeposit = async (formData) => {
  return apiCall('POST', 'wallet/deposits/submit', formData, true);
};

const getDepositHistory = async () => {
  return apiCall('GET', 'wallet/deposits/history');
};

const requestWithdrawal = async (data) => {
  return apiCall('POST', 'wallet/withdrawals/request', data);
};

const getWithdrawalHistory = async () => {
  return apiCall('GET', 'wallet/withdrawals/history');
};

const getWithdrawalSettings = async () => {
  return apiCall('GET', 'wallet/settings');
};

// window.api.getWithdrawalSettings = getWithdrawalSettings;

const getUpiSettings = async () => {
  return apiCall('GET', 'wallet/settings/upi');
};

// ==========================================
// 3. CASINO GAME ENGINE CALLS
// ==========================================
const getCurrentRound = async () => {
  return apiCall('GET', 'game/current-round');
};

const getRecentRounds = async () => {
  return apiCall('GET', 'game/rounds');
};

const placeBet = async (round_id, bet_on, bet_amount) => {
  return apiCall('POST', 'bets/place', { round_id, bet_on, bet_amount });
};

const getBetHistory = async () => {
  return apiCall('GET', 'bets/history');
};

// ==========================================
// 4. USER CHANNELS & PROFILES
// ==========================================
const getProfile = async () => {
  return apiCall('GET', 'user/profile');
};

const updateProfile = async (data) => {
  return apiCall('PUT', 'user/profile', data);
};

const getStats = async () => {
  return apiCall('GET', 'user/stats');
};

const getReferrals = async () => {
  return apiCall('GET', 'user/referrals');
};

// ==========================================
// 5. GAIN LEADERBOARDS
// ==========================================
const getLeaderboard = async (type) => {
  return apiCall('GET', `leaderboard/${type}`);
};

// ==========================================
// 6. SUPPORT TICKETS MANAGEMENT
// ==========================================
const submitTicket = async (subject, message) => {
  return apiCall('POST', 'support/ticket', { subject, message });
};

const getTickets = async () => {
  return apiCall('GET', 'support/tickets');
};

// ==========================================
// 7. PLATFORM ADMINISTRATIVE ACTIONS
// ==========================================
const getDashboard = async () => {
  return apiCall('GET', 'admin/dashboard');
};

const getDeposits = async (status = '', page = 1) => {
  return apiCall('GET', `admin/deposits?status=${status}&page=${page}`);
};

const approveDeposit = async (id) => {
  return apiCall('POST', `admin/deposits/${id}/approve`);
};

const rejectDeposit = async (id, note) => {
  return apiCall('POST', `admin/deposits/${id}/reject`, { note });
};

const getWithdrawals = async (status = '', page = 1) => {
  return apiCall('GET', `admin/withdrawals?status=${status}&page=${page}`);
};

const approveWithdrawal = async (id) => {
  return apiCall('POST', `admin/withdrawals/${id}/approve`);
};

const rejectWithdrawal = async (id, note) => {
  return apiCall('POST', `admin/withdrawals/${id}/reject`, { note });
};

const getUsers = async (search = '', page = 1) => {
  return apiCall('GET', `admin/users?search=${search}&page=${page}`);
};

const getUserDetail = async (id) => {
  return apiCall('GET', `admin/users/${id}`);
};

const banUser = async (id) => {
  return apiCall('POST', `admin/users/${id}/ban`);
};

const addUserBalance = async (id, amount, note) => {
  return apiCall('POST', `admin/users/${id}/add-balance`, { amount, note });
};

const getSettings = async () => {
  return apiCall('GET', 'admin/settings');
};


const updateSettings = async (data) => {
  return apiCall('PUT', 'admin/settings', data);
};



const getTicketsAdmin = async (status = '') => {
  return apiCall('GET', `admin/tickets?status=${status}`);
};

const replyTicket = async (id, reply) => {
  return apiCall('POST', `admin/tickets/${id}/reply`, { reply });
};

// Expose public API helper functions
window.api = {
  BASE_URL,
  showToast,
  showLoadingSpinner,
  hideLoadingSpinner,
  register,
  login,
  adminLogin,
  getMe,
  getBalance,
  getTransactions,
  submitDeposit,
  getDepositHistory,
  requestWithdrawal,
  getWithdrawalHistory,
  getWithdrawalSettings,
  getUpiSettings,
    changePasswordDirect,
  changePasswordSendOtp,
  changePasswordOtp,
  getCurrentRound,
  getRecentRounds,
  placeBet,
  getBetHistory,
  getProfile,
  updateProfile,
  getStats,
  getReferrals,
  getLeaderboard,
  submitTicket,
  getTickets,
  getDashboard,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  adminSendOtp,
  approveWithdrawal,
  rejectWithdrawal,
  getUsers,
  getUserDetail,
  banUser,
  addUserBalance,
  getSettings,
  updateSettings,
  sendOtp,
  getTicketsAdmin,
  resetPassword,
  forgotSendOtp,
  replyTicket
};
