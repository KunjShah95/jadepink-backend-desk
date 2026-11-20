-- ============================================================================
-- Jade Pink Backend Desk — Supabase Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE profiles (
    id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    roles           TEXT[] NOT NULL DEFAULT '{}',
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE designers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    legal_name      VARCHAR(100),
    gst_reg         VARCHAR(20),
    gst_no          VARCHAR(20),
    pan             VARCHAR(20),
    alpha_vendor_code VARCHAR(50),
    whatsapp_group  VARCHAR(100),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES profiles(id)
);

CREATE TABLE lookups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_name   VARCHAR(50) NOT NULL,
    value       VARCHAR(100) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (list_name, value)
);

CREATE TABLE lots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_no          VARCHAR(20) NOT NULL UNIQUE,
    example         BOOLEAN NOT NULL DEFAULT false,
    created_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    designer        VARCHAR(100),
    courier         VARCHAR(100),
    tracking        VARCHAR(100),
    boxes           INTEGER CHECK (boxes >= 1),
    stock_type      VARCHAR(20),
    condition_      VARCHAR(50),
    expected_       VARCHAR(50),
    po_ref          VARCHAR(100),
    upcoming_id     UUID REFERENCES upcoming(id),
    blind_count     INTEGER CHECK (blind_count >= 0 AND blind_count <= 300),
    challan_qty     INTEGER CHECK (challan_qty >= 0),
    po_qty          INTEGER CHECK (po_qty >= 0),
    diff_note       TEXT,
    tags_match      VARCHAR(50),
    price_hold_at   TIMESTAMPTZ,
    iron_count      INTEGER,
    ho_done_by      UUID REFERENCES profiles(id),
    ho_done_at      TIMESTAMPTZ,
    tag_count       INTEGER,
    tag_dest        VARCHAR(20),
    display_start   DATE,
    review_date     DATE,
    designer_accept_at TIMESTAMPTZ,
    rtv_box         VARCHAR(20),
    rtv_no          VARCHAR(50),
    rtv_challan     VARCHAR(50),
    rtv_courier     VARCHAR(100),
    rtv_tracking    VARCHAR(100),
    ack_count       INTEGER,
    ack_date        DATE,
    sell_bill_no    VARCHAR(50),
    pay_note        TEXT,
    legal_name      VARCHAR(100),
    gst_reg         VARCHAR(20),
    gst_no          VARCHAR(20),
    pan             VARCHAR(20),
    doc_type        VARCHAR(50),
    challan_no      VARCHAR(50),
    maker           VARCHAR(100),
    maker_at        TIMESTAMPTZ,
    checker         VARCHAR(100),
    checker_at      TIMESTAMPTZ,
    rack_no         VARCHAR(20),
    buyer           VARCHAR(100),
    tn_out_by       UUID REFERENCES profiles(id),
    tn_out_count    INTEGER,
    tn_in_by        UUID REFERENCES profiles(id),
    tn_in_count     INTEGER
);

CREATE TABLE lot_checks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    stage       VARCHAR(3) NOT NULL CHECK (stage IN ('s1','s2','s3','s4','s5','s6','s7','s8')),
    item_key    VARCHAR(50) NOT NULL,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lot_id, stage, item_key)
);

CREATE TABLE lot_gates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    stage       VARCHAR(3) NOT NULL CHECK (stage IN ('s1','s2','s3','s4','s5','s6','s7','s8')),
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    test        BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (lot_id, stage)
);

CREATE TABLE lot_approvals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    kind        VARCHAR(10) NOT NULL CHECK (kind IN ('mkt','acct','mgmt')),
    approver    UUID REFERENCES profiles(id),
    note        TEXT,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lot_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    by              UUID REFERENCES profiles(id),
    at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered')),
    answer          TEXT,
    answered_by     UUID REFERENCES profiles(id),
    answered_at     TIMESTAMPTZ
);

CREATE TABLE lot_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    VARCHAR(100) NOT NULL,
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pieces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    idx             INTEGER NOT NULL,
    piece_label     VARCHAR(50) GENERATED ALWAYS AS (
        (SELECT lot_no FROM lots WHERE id = lot_id) || '-' || idx::text
    ) STORED,
    style_code      VARCHAR(50),
    product         VARCHAR(100),
    colour          VARCHAR(50),
    size            VARCHAR(20),
    tag_mrp         NUMERIC(10,2),
    category        VARCHAR(50),
    hsn             VARCHAR(20),
    gst_pct         NUMERIC(5,2),
    cost            NUMERIC(10,2),
    margin          NUMERIC(5,2),
    qc              VARCHAR(10) CHECK (qc IN ('accept','reject','')),
    reject_reason   VARCHAR(100),
    barcode         VARCHAR(50) UNIQUE,
    tag_scanned     BOOLEAN NOT NULL DEFAULT false,
    tag_dest        VARCHAR(20),
    location        VARCHAR(50),
    stored_at       TIMESTAMPTZ,
    refilled_at     TIMESTAMPTZ,
    refill_from     VARCHAR(50),
    refill_to       VARCHAR(50),
    state           VARCHAR(30) NOT NULL DEFAULT 'new',
    sold_bill       VARCHAR(50),
    sold_at         TIMESTAMPTZ,
    loan_to         VARCHAR(100),
    loan_at         TIMESTAMPTZ,
    box_no          VARCHAR(20),
    hold_id         UUID REFERENCES holds(id),
    UNIQUE (lot_id, idx)
);

CREATE TABLE piece_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    VARCHAR(100) NOT NULL,
    piece_id    UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
    kind        VARCHAR(20) NOT NULL CHECK (kind IN ('product','tag')),
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE upcoming (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer    VARCHAR(100) NOT NULL,
    expected_date DATE,
    boxes       INTEGER,
    pieces      INTEGER,
    courier     VARCHAR(100),
    tracking    VARCHAR(100),
    po_ref      VARCHAR(100),
    status      VARCHAR(20) NOT NULL DEFAULT 'expected' CHECK (status IN ('expected','received')),
    lot_id      UUID REFERENCES lots(id),
    received_at TIMESTAMPTZ,
    source      VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','portal')),
    added_by    UUID REFERENCES profiles(id),
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE holds (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID REFERENCES lots(id) ON DELETE CASCADE,
    piece_id    UUID REFERENCES pieces(id) ON DELETE CASCADE,
    error       VARCHAR(100) NOT NULL,
    err_key     VARCHAR(50),
    home_stage  VARCHAR(3),
    found_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sev         VARCHAR(2) NOT NULL CHECK (sev IN ('A','B','C')),
    note        TEXT,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','noted')),
    outcome     VARCHAR(20) CHECK (outcome IN ('fixed','written_off')),
    fix         TEXT,
    fix_by      UUID REFERENCES profiles(id),
    fix_at      TIMESTAMPTZ
);

CREATE TABLE events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID REFERENCES lots(id) ON DELETE CASCADE,
    action      VARCHAR(50) NOT NULL,
    entity      VARCHAR(50) NOT NULL,
    entity_id   VARCHAR(100),
    before      JSONB,
    after       JSONB,
    text        TEXT,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_close (
    date        DATE PRIMARY KEY,
    locations   JSONB,
    system_qty  INTEGER,
    scanned_qty INTEGER,
    open_notes  VARCHAR(50),
    hold_shelf  VARCHAR(50),
    manager     UUID REFERENCES profiles(id),
    notes       TEXT,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE settings (
    id          INTEGER PRIMARY KEY DEFAULT 1,
    box_count   INTEGER NOT NULL DEFAULT 20 CHECK (box_count >= 1 AND box_count <= 200),
    updated_by  UUID REFERENCES profiles(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lots_lot_no ON lots(lot_no);
CREATE INDEX idx_lots_designer ON lots(designer);
CREATE INDEX idx_pieces_lot_id ON pieces(lot_id);
CREATE INDEX idx_pieces_barcode ON pieces(barcode);
CREATE INDEX idx_pieces_state ON pieces(state);
CREATE INDEX idx_pieces_location ON pieces(location);
CREATE INDEX idx_holds_piece_id ON holds(piece_id);
CREATE INDEX idx_holds_status ON holds(status);
CREATE INDEX idx_holds_sev ON holds(sev);
CREATE INDEX idx_lot_checks_lot_id ON lot_checks(lot_id);
CREATE INDEX idx_lot_gates_lot_id ON lot_gates(lot_id);
CREATE INDEX idx_lot_approvals_lot_id ON lot_approvals(lot_id);
CREATE INDEX idx_lot_queries_lot_id ON lot_queries(lot_id);
CREATE INDEX idx_events_lot_id ON events(lot_id);
CREATE INDEX idx_events_action_entity ON events(action, entity);
CREATE INDEX idx_lookups_list ON lookups(list_name);
CREATE INDEX idx_profiles_roles ON profiles USING GIN(roles);
    answered_at     TIMESTAMPTZ
);

CREATE TABLE lot_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    VARCHAR(100) NOT NULL,
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    by          UUID REFERENCES profiles(id),
    at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);