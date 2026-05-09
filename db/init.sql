-- StatNerds Datenbankschema

-- Sportarten
CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  sport_id INT REFERENCES sports(id),
  sportsdb_api_id VARCHAR(50),
  stadium VARCHAR(100),
  country VARCHAR(50),
  founded INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spiele
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  home_team_id INT REFERENCES teams(id),
  away_team_id INT REFERENCES teams(id),
  match_date TIMESTAMP,
  league VARCHAR(50),
  season VARCHAR(10),
  status VARCHAR(20) DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Statistiken (penibel!)
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  team_id INT REFERENCES teams(id),
  is_home BOOLEAN,
  possession DECIMAL(5,2),
  shots_total INT,
  shots_on_target INT,
  xg DECIMAL(4,3),
  corners INT,
  fouls INT,
  yellow_cards INT,
  red_cards INT,
  passes_total INT,
  passes_accuracy DECIMAL(5,2),
  km_run DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Themes (Vereinsfarben)
CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id),
  theme_name VARCHAR(100),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  text_color VARCHAR(7) DEFAULT '#FFFFFF',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Einstellungen
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Standarddaten
INSERT INTO sports (name) VALUES ('Fussball'), ('Basketball'), ('Tennis')
  ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('default_theme', 'dark'),
  ('live_polling_interval', '60'),
  ('cleanup_days', '30')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO teams (name, primary_color, secondary_color, country) VALUES
  ('FC Bayern München', '#ED1C24', '#FFFFFF', 'Deutschland'),
  ('Borussia Dortmund', '#FCEA92', '#000000', 'Deutschland'),
  ('Bayer 04 Leverkusen', '#E32221', '#000000', 'Deutschland')
  ON CONFLICT (name) DO NOTHING;
