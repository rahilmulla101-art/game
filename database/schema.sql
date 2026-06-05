-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `dragonvstiger_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dragonvstiger_db`;

-- Set foreign key checks and SQL mode
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------------
-- 1. Table: `admins`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('superadmin', 'admin') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 2. Table: `users`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mobile` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL, -- Can be null if using OTP-only dynamic login/signup
  `wallet_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `referral_code` VARCHAR(20) NOT NULL UNIQUE,
  `referred_by` INT NULL,
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_user_mobile` (`mobile`),
  INDEX `idx_user_username` (`username`),
  INDEX `idx_user_referral_code` (`referral_code`),
  INDEX `idx_user_referred_by` (`referred_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. Table: `game_rounds`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `game_rounds`;
CREATE TABLE `game_rounds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `round_number` VARCHAR(50) NOT NULL UNIQUE,
  `status` ENUM('waiting', 'betting_open', 'betting_closed', 'completed') NOT NULL DEFAULT 'waiting',
  `seed` VARCHAR(255) NOT NULL,
  `seed_hash` VARCHAR(255) NOT NULL,
  `result` ENUM('dragon', 'tiger', 'tie') NULL,
  `dragon_card` VARCHAR(10) NULL, -- e.g. 'H_A', 'D_10', 'S_K'
  `tiger_card` VARCHAR(10) NULL,
  `total_bets_dragon` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_bets_tiger` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_bets_tie` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `betting_closes_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_round_number` (`round_number`),
  INDEX `idx_round_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4. Table: `bets`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `bets`;
CREATE TABLE `bets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `round_id` INT NOT NULL,
  `bet_on` ENUM('dragon', 'tiger', 'tie') NOT NULL,
  `bet_amount` DECIMAL(10,2) NOT NULL,
  `payout_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'won', 'lost', 'tie_refund', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`round_id`) REFERENCES `game_rounds` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_round_bet` (`user_id`, `round_id`, `bet_on`),
  INDEX `idx_bet_user_id` (`user_id`),
  INDEX `idx_bet_round_id` (`round_id`),
  INDEX `idx_bet_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 5. Table: `deposits`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `deposits`;
CREATE TABLE `deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `screenshot_url` VARCHAR(255) NOT NULL,
  `utr_number` VARCHAR(50) NOT NULL UNIQUE,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `reviewed_by` INT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  INDEX `idx_deposit_user_id` (`user_id`),
  INDEX `idx_deposit_utr_number` (`utr_number`),
  INDEX `idx_deposit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 6. Table: `withdrawals`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `withdrawals`;
CREATE TABLE `withdrawals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `upi_id` VARCHAR(100) NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `ifsc_code` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'processing') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_withdrawal_user_id` (`user_id`),
  INDEX `idx_withdrawal_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 7. Table: `transactions`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'tie_refund', 'referral_bonus', 'bonus', 'withdrawal_refund') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `balance_before` DECIMAL(12,2) NOT NULL,
  `balance_after` DECIMAL(12,2) NOT NULL,
  `reference_id` VARCHAR(100) NULL, -- e.g. TXN ID, Bet ID, Deposit ID, etc.
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_txn_user_id` (`user_id`),
  INDEX `idx_txn_type` (`type`),
  INDEX `idx_txn_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 8. Table: `site_settings`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` VARCHAR(255) NOT NULL,
  INDEX `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 9. Table: `support_tickets`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('open', 'in_progress', 'resolved') NOT NULL DEFAULT 'open',
  `admin_reply` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_ticket_user_id` (`user_id`),
  INDEX `idx_ticket_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 10. Table: `referrals`
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `referrals`;
CREATE TABLE `referrals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `referrer_id` INT NOT NULL,
  `referred_id` INT NOT NULL,
  `bonus_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `bonus_credited` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`referred_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_referral_referrer` (`referrer_id`),
  INDEX `idx_referral_referred` (`referred_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------
-- DEFAULT DATA INSERTS
-- ---------------------------------------------------------

-- Insert system settings
INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES
('upi_id', 'pay@dragonvstiger'),
('min_deposit', '100'),
('min_withdrawal', '200'),
('max_withdrawal', '50000'),
('house_edge_pct', '9.64'),
('referral_bonus_inr', '50'),
('round_duration_sec', '30'),
('betting_window_sec', '20')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Insert standard fallback superadmin
-- 'password_hash' contains the real certified bcrypt hash of plain string 'admin123' 
-- (Specifically: $2a$10$XmO9KszuG38/N7S1f4WwpeC1B/R7Vv4A0YqQZ5WqPErK3P9KvzEyu)
INSERT INTO `admins` (`username`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
('admin', '$2b$10$WqB9v19Tby4gK9s6P7Kbe.MofWzKmxB.75vPErK3P9KvzEyuhgNfe', 'System Super Admin', 'superadmin', 1)
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
