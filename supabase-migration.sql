-- ============================================================
-- MIGRATION SUPABASE — Billetterie DUSK EVE × BASALTE
-- Projet: BasaltexDES
-- Exécute ce script dans: Supabase → SQL Editor → New Query
-- ============================================================

-- ── TABLE : ticket_tiers ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         text        NOT NULL DEFAULT 'xperimental_vol2',
  name             text        NOT NULL,
  price            numeric(10,2) NOT NULL,
  quantity_total   int         NOT NULL,
  quantity_sold    int         NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- ── TABLE : tickets ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         text        NOT NULL DEFAULT 'xperimental_vol2',
  tier_id          uuid        REFERENCES ticket_tiers(id),
  tier             text        NOT NULL,
  buyer_name       text,
  buyer_email      text        NOT NULL,
  stripe_session_id text,
  qr_code_data     text        UNIQUE NOT NULL,
  status           text        NOT NULL DEFAULT 'paid'
                               CHECK (status IN ('paid', 'scanned', 'cancelled')),
  created_at       timestamptz DEFAULT now(),
  scanned_at       timestamptz
);

-- ── DONNÉES INITIALES : Paliers ──────────────────────────────
INSERT INTO ticket_tiers (event_id, name, price, quantity_total, quantity_sold) VALUES
  ('xperimental_vol2', 'Early Bird',          10.00,  30,  0),
  ('xperimental_vol2', 'Admission Générale',  15.00,  40,  0),
  ('xperimental_vol2', 'Last Chance',         20.00, 230,  0)
ON CONFLICT DO NOTHING;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tiers (stock affiché sur le site)
CREATE POLICY "Public can read ticket_tiers"
  ON ticket_tiers FOR SELECT USING (true);

-- Lecture publique des tickets (pour validation QR)
CREATE POLICY "Public can read tickets"
  ON tickets FOR SELECT USING (true);

-- Service role peut insérer + modifier tickets
CREATE POLICY "Service role insert tickets"
  ON tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update tickets"
  ON tickets FOR UPDATE USING (true);

-- Service role peut modifier les tiers (quantity_sold)
CREATE POLICY "Service role update ticket_tiers"
  ON ticket_tiers FOR UPDATE USING (true);

-- ── INDEX ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_qr      ON tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_tickets_email   ON tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_tiers_event    ON ticket_tiers(event_id);

-- ── VÉRIFICATION ─────────────────────────────────────────────
-- Lance cette requête pour vérifier que les tiers sont bien créés :
SELECT id, name, price, quantity_total, quantity_sold FROM ticket_tiers;
