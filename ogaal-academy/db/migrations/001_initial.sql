-- OGAAL certificate management: initial schema.
-- All employee, training, assessment and certificate data lives in employee_certificates.
-- users holds accounts. The remaining tables support login, auditing and configuration only;
-- none of them holds employee, training, assessment or certificate records.

CREATE TABLE users (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name            VARCHAR(150) NOT NULL,
  username             VARCHAR(60)  NOT NULL,
  email                VARCHAR(190) NOT NULL,
  phone_number         VARCHAR(30)  NULL,
  password_hash        VARCHAR(255) NOT NULL,
  must_change_password TINYINT(1)   NOT NULL DEFAULT 0,
  profile_photo        VARCHAR(255) NULL,
  role                 ENUM('Super Admin','Admin','Staff','Verification User') NOT NULL,
  assigned_company     VARCHAR(150) NULL,
  account_status       ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  last_login           DATETIME     NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employee_certificates (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name                VARCHAR(150) NOT NULL,
  company_name             VARCHAR(150) NOT NULL,
  employee_id              VARCHAR(50)  NOT NULL,
  phone_number             VARCHAR(30)  NOT NULL,
  blood_group              ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown') NOT NULL DEFAULT 'Unknown',
  employee_photo           VARCHAR(255) NULL,
  date_of_birth            DATE         NOT NULL,
  job_position             VARCHAR(120) NOT NULL,
  training_date            DATE         NULL,
  -- Certificate (NULL until issued)
  certificate_number       VARCHAR(30)  NULL,
  certificate_issue_date   DATE         NULL,
  certificate_expiry_date  DATE         NULL,
  certificate_validity     VARCHAR(20)  NOT NULL DEFAULT '1 Year',
  certificate_status       ENUM('Active','Expired','Revoked') NULL,
  certificate_revocation_reason VARCHAR(255) NULL,
  certificate_pdf_path     VARCHAR(255) NULL,
  verification_token       CHAR(32)     NULL,
  -- Earlier certificates of this employee, kept in this row
  certificate_history      JSON         NULL,
  -- Assessment (records an authorised assessor's result; the system never derives one)
  mental_assessment        TEXT         NULL,
  assessment_result        ENUM('Pending','Passed','Failed') NOT NULL DEFAULT 'Pending',
  assessment_remarks       TEXT         NULL,
  assessment_date          DATE         NULL,
  assessor_name            VARCHAR(150) NULL,
  assessment_answers       JSON         NULL,
  assessment_approved_by   BIGINT UNSIGNED NULL,
  assessment_approved_at   DATETIME     NULL,
  -- Signature in force when the certificate was issued
  authorized_signature     VARCHAR(255) NULL,
  authorized_signatory     VARCHAR(150) NULL,
  created_by               BIGINT UNSIGNED NOT NULL,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ec_employee_id (employee_id),
  UNIQUE KEY uq_ec_certificate_number (certificate_number),
  UNIQUE KEY uq_ec_verification_token (verification_token),
  KEY idx_ec_full_name (full_name),
  KEY idx_ec_company (company_name),
  KEY idx_ec_position (job_position),
  KEY idx_ec_status_expiry (certificate_status, certificate_expiry_date),
  KEY idx_ec_result (assessment_result),
  KEY idx_ec_training_date (training_date),
  KEY idx_ec_issue_date (certificate_issue_date),
  KEY idx_ec_created_at (created_at),
  KEY idx_ec_created_by (created_by),
  CONSTRAINT fk_ec_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_ec_approved_by FOREIGN KEY (assessment_approved_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  token_hash   CHAR(64)        NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  expires_at   DATETIME        NOT NULL,
  ip_address   VARCHAR(64)     NULL,
  user_agent   VARCHAR(255)    NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_resets (
  token_hash   CHAR(64)        NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  expires_at   DATETIME        NOT NULL,
  used_at      DATETIME        NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_resets_user (user_id),
  CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- record_ref is a plain value, not a foreign key: log entries must outlive deleted employee rows.
CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NULL,
  action       VARCHAR(60)     NOT NULL,
  record_type  VARCHAR(40)     NULL,
  record_ref   VARCHAR(60)     NULL,
  details      JSON            NULL,
  ip_address   VARCHAR(64)     NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_user (user_id, created_at),
  KEY idx_audit_action (action, created_at),
  KEY idx_audit_created (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Also holds the certificate number counters (cert_seq_<year>).
CREATE TABLE system_settings (
  setting_key   VARCHAR(80) NOT NULL,
  setting_value TEXT        NULL,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
