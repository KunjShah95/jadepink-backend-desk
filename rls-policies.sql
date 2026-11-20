-- ============================================================================
-- Row Level Security Policies for Jade Pink Backend Desk
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_close ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));
CREATE POLICY "profiles_insert_only_admin" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Non-admin users can update their own phone without changing roles
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "lookups_select_all" ON lookups FOR SELECT USING (true);
CREATE POLICY "lookups_insert_admin" ON lookups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));
CREATE POLICY "lookups_update_admin" ON lookups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));
CREATE POLICY "lookups_delete_admin" ON lookups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

CREATE POLICY "designers_select_active" ON designers FOR SELECT
  USING (active = true);
CREATE POLICY "designers_insert_admin" ON designers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));
CREATE POLICY "designers_update_admin" ON designers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Lots: role-based access
CREATE POLICY "lots_insert_receiver" ON lots FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Receiver' = ANY(roles)
  ));

CREATE POLICY "lots_select_all" ON lots FOR SELECT USING (true);

CREATE POLICY "lots_update_stage2_qc_buyer" ON lots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('QC' = ANY(roles) OR 'Buyer' = ANY(roles) OR 'Marketing' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "lots_update_stage356_floor" ON lots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Floor team' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "lots_update_stage4_ho_inward" ON lots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('HO team' = ANY(roles) OR 'Inward team' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "lots_update_stage78_accounts" ON lots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Accounts' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "lots_admin_all" ON lots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Lot checks
CREATE POLICY "lot_checks_select_all" ON lot_checks FOR SELECT USING (true);
CREATE POLICY "lot_checks_insert_all" ON lot_checks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));
CREATE POLICY "lot_checks_delete_owner_admin" ON lot_checks FOR DELETE
  USING (by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Lot gates
CREATE POLICY "lot_gates_select_all" ON lot_gates FOR SELECT USING (true);
CREATE POLICY "lot_gates_insert_all" ON lot_gates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));
CREATE POLICY "lot_gates_delete_owner_admin" ON lot_gates FOR DELETE
  USING (by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Lot approvals
CREATE POLICY "lot_approvals_select_all" ON lot_approvals FOR SELECT USING (true);
CREATE POLICY "lot_approvals_insert_approver" ON lot_approvals FOR INSERT
  WITH CHECK (
    (kind = 'mkt' AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Marketing' = ANY(roles)
    )) OR
    (kind = 'acct' AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Accounts' = ANY(roles)
    )) OR
    (kind = 'mgmt' AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Management' = ANY(roles)
    )) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles))
  );
CREATE POLICY "lot_approvals_delete_admin" ON lot_approvals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Lot queries
CREATE POLICY "lot_queries_select_all" ON lot_queries FOR SELECT USING (true);
CREATE POLICY "lot_queries_insert_ho" ON lot_queries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('HO team' = ANY(roles) OR 'Admin' = ANY(roles))
  ));
CREATE POLICY "lot_queries_update_merchandiser" ON lot_queries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Merchandiser' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

-- Lot photos
CREATE POLICY "lot_photos_select_all" ON lot_photos FOR SELECT USING (true);
CREATE POLICY "lot_photos_insert_receiver_floor" ON lot_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Receiver' = ANY(roles) OR 'Floor team' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

-- Pieces
CREATE POLICY "pieces_select_all" ON pieces FOR SELECT USING (true);
CREATE POLICY "pieces_insert_qc_buyer" ON pieces FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('QC' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "pieces_insert_floor" ON pieces FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Floor team' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

CREATE POLICY "pieces_update_qc_floor_accounts" ON pieces FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('QC' = ANY(roles) OR 'Floor team' = ANY(roles)
         OR 'Accounts' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

-- Piece photos
CREATE POLICY "piece_photos_select_all" ON piece_photos FOR SELECT USING (true);
CREATE POLICY "piece_photos_insert_auth" ON piece_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));

-- Upcoming
CREATE POLICY "upcoming_select_all" ON upcoming FOR SELECT USING (true);
CREATE POLICY "upcoming_insert_auth" ON upcoming FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));
CREATE POLICY "upcoming_update_admin" ON upcoming FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));

-- Holds
CREATE POLICY "holds_select_all" ON holds FOR SELECT USING (true);
CREATE POLICY "holds_insert_auth" ON holds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));
CREATE POLICY "holds_update_prateek_store_admin" ON holds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Prateek' = ANY(roles) OR 'Store manager' = ANY(roles)
         OR 'Admin' = ANY(roles))
  ));

-- Events (append-only)
CREATE POLICY "events_select_all" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert_auth" ON events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true
  ));
CREATE POLICY "events_no_update" ON events FOR UPDATE USING (false);
CREATE POLICY "events_no_delete" ON events FOR DELETE USING (false);

-- Daily close
CREATE POLICY "daily_close_select_all" ON daily_close FOR SELECT USING (true);
CREATE POLICY "daily_close_insert_manager_admin" ON daily_close FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Store manager' = ANY(roles) OR 'Admin' = ANY(roles))
  ));
CREATE POLICY "daily_close_update_manager_admin" ON daily_close FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND ('Store manager' = ANY(roles) OR 'Admin' = ANY(roles))
  ));

-- Settings
CREATE POLICY "settings_select_all" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'Admin' = ANY(roles)
  ));