-- ============================================================================
-- Jade Pink Backend Desk — Supabase Seed Data
-- ============================================================================

-- Stock or order piece (Stage 1)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('stock_type', 'SOR', 'Stock (SOR)', 1),
('stock_type', 'Order piece', 'Order piece', 2);

-- Box condition (Stage 1)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('box_condition', 'Intact', 'Intact', 1),
('box_condition', 'Damaged — noted on slip', 'Damaged — noted on slip', 2);

-- Expected? (Stage 1)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('expected', 'Expected dispatch / PO', 'Expected dispatch / PO', 1),
('expected', 'Unexpected — kept unopened', 'Unexpected — kept unopened', 2);

-- Designer tag MRP vs challan / invoice (Stage 2)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('tags_match', 'All tags match the agreed price', 'All tags match the agreed price', 1),
('tags_match', 'Some tags do not match', 'Some tags do not match', 2);

-- QC result (per piece) (Stage 2)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('qc_result', 'accept', 'Accept', 1),
('qc_result', 'reject', 'Reject', 2);

-- Reject reason (Stage 2)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('reject_reason', 'Not as per PO / selection', 'Not as per PO / selection', 1),
('reject_reason', 'Wrong size', 'Wrong size', 2),
('reject_reason', 'Wrong colour', 'Wrong colour', 3),
('reject_reason', 'Stain or damage', 'Stain or damage', 4),
('reject_reason', 'Stitching defect', 'Stitching defect', 5),
('reject_reason', 'Missing part (dupatta, belt, lining)', 'Missing part (dupatta, belt, lining)', 6),
('reject_reason', 'MRP not as agreed', 'MRP not as agreed', 7),
('reject_reason', 'Other', 'Other', 8);

-- Category (Piece data)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('category', 'Kurta set', 'Kurta set', 1),
('category', 'Co-ord set', 'Co-ord set', 2),
('category', 'Dress', 'Dress', 3),
('category', 'Saree', 'Saree', 4),
('category', 'Lehenga', 'Lehenga', 5),
('category', 'Anarkali', 'Anarkali', 6),
('category', 'Shirt', 'Shirt', 7),
('category', 'Top', 'Top', 8),
('category', 'Blouse', 'Blouse', 9),
('category', 'Pant', 'Pant', 10),
('category', 'Skirt', 'Skirt', 11),
('category', 'Jacket', 'Jacket', 12),
('category', 'Dupatta', 'Dupatta', 13),
('category', 'Other', 'Other', 14);

-- Severity (Holds)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('severity', 'A', 'A Stops the piece', 1),
('severity', 'B', 'B Fixed in parallel', 2),
('severity', 'C', 'C Noted only', 3);

-- Hold outcome (Holds)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('hold_outcome', 'fixed', 'Fixed — rejoins lot', 1),
('hold_outcome', 'written_off', 'Write off (Prateek approved)', 2);

-- Hold filter (Holds)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('hold_filter', 'open', 'Open', 1),
('hold_filter', 'resolved', 'Resolved and noted', 2);

-- Open transfer notes (Daily close)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('open_notes', 'None open', 'None open', 1),
('open_notes', 'Some open', 'Some open — listed in notes', 2);

-- Hold shelf (Daily close)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('hold_shelf', 'Cleared', 'Cleared or every hold has an owner', 1),
('hold_shelf', 'Not checked', 'Not checked', 2);

-- Tag destination (Data model only)
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('tag_dest', 'Floor', 'Floor', 1),
('tag_dest', 'Storeroom', 'Storeroom', 2);

-- Piece states
INSERT INTO lookups (list_name, value, label, sort_order) VALUES
('piece_state', 'new', 'Not checked', 1),
('piece_state', 'accepted', 'Accepted', 2),
('piece_state', 'rejected', 'Rejected', 3),
('piece_state', 'tagged', 'Tagged', 4),
('piece_state', 'stored', 'Storeroom', 5),
('piece_state', 'on_floor', 'On floor', 6),
('piece_state', 'sold', 'Sold', 7),
('piece_state', 'loan', 'On loan', 8),
('piece_state', 'pulled', 'At RTV bench', 9),
('piece_state', 'boxed', 'In RTV box', 10),
('piece_state', 'returned', 'Returned', 11),
('piece_state', 'written_off', 'Written off', 12);

-- Default settings
INSERT INTO settings (id, box_count) VALUES (1, 20);