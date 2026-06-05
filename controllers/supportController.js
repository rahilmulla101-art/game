import pool from '../config/db.js';

/**
 * POST /api/support/ticket
 * Creates a support query ticket.
 */
export const createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body;

    if (!subject || !message || subject.trim().length === 0 || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Both support subject and issue message parameters are required.'
      });
    }

    const [insertResult] = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, message, status) VALUES (?, ?, ?, ?)',
      [userId, subject.trim(), message.trim(), 'pending']
    );

    const ticketId = insertResult.insertId;

    return res.status(210).json({
      success: true,
      message: 'Support query ticket submitted successfully. Support team will reply soon.',
      data: {
        ticket_id: ticketId,
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record support request ticket: ' + error.message,
      data: {}
    });
  }
};

/**
 * GET /api/support/tickets
 * Retrieves user's own support tickets history.
 */
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT id, subject, message, status, admin_reply, created_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Support tickets list retrieved successfully.',
      data: {
        tickets: rows
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support queries ledger: ' + error.message,
      data: []
    });
  }
};
