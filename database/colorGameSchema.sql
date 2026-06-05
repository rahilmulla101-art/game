-- Color Game Database Schema
-- Tables for the color betting game (Red, Green, Violet)

-- 1. Color Rounds Table
CREATE TABLE IF NOT EXISTS color_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_number BIGINT UNIQUE NOT NULL,
  status ENUM('betting_open', 'betting_closed', 'result_declared') DEFAULT 'betting_open',
  winning_color ENUM('red', 'green', 'violet', 'number') DEFAULT NULL,
  winning_number INT DEFAULT NULL COMMENT '0-9 for number bets',
  total_bets_red DECIMAL(15, 2) DEFAULT 0,
  total_bets_green DECIMAL(15, 2) DEFAULT 0,
  total_bets_violet DECIMAL(15, 2) DEFAULT 0,
  total_bets_number DECIMAL(15, 2) DEFAULT 0,
  betting_open_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  betting_close_at DATETIME DEFAULT NULL,
  result_declared_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_period (period_number),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- 2. Color Bets Table
CREATE TABLE IF NOT EXISTS color_bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  user_id INT NOT NULL,
  bet_type ENUM('color', 'number') DEFAULT 'color',
  bet_on VARCHAR(50) NOT NULL COMMENT 'red, green, violet, or number (0-9)',
  bet_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'won', 'lost', 'refunded') DEFAULT 'pending',
  winnings DECIMAL(15, 2) DEFAULT 0,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES color_rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_round (round_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_bet (round_id, user_id, bet_on)
);

-- 3. Color Results History Table
CREATE TABLE IF NOT EXISTS color_results_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL UNIQUE,
  winning_color ENUM('red', 'green', 'violet', 'number') NOT NULL,
  winning_number INT DEFAULT NULL,
  total_winners INT DEFAULT 0,
  total_winnings_paid DECIMAL(15, 2) DEFAULT 0,
  house_profit DECIMAL(15, 2) DEFAULT 0,
  declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES color_rounds(id) ON DELETE CASCADE,
  INDEX idx_round (round_id),
  INDEX idx_declared (declared_at)
);

-- 4. User Color Betting Statistics
CREATE TABLE IF NOT EXISTS user_color_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  total_bets_placed INT DEFAULT 0,
  total_bet_amount DECIMAL(15, 2) DEFAULT 0,
  total_winnings DECIMAL(15, 2) DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  last_bet_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
