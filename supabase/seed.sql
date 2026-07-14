-- ============================================================================
-- Site Log — sample data mirroring reference/mockup.html
-- Dates are relative to current_date so the overdue/days-open logic stays
-- meaningful whenever the seed is run. Numbers are provided explicitly, so the
-- auto-numbering triggers skip these rows (next auto RFI will be RFI-119).
-- ============================================================================

insert into public.projects (id, name, general_contractor, pm_name)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Niagara WTP Upgrade — Phase 2',
  'Bridgeview Construction Ltd.',
  'T. Paulo'
);

insert into public.rfis
  (project_id, rfi_number, description, discipline, contractor,
   date_submitted, due_date, date_answered, status, created_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'RFI-113',
   'Construction sequencing clarification — phase 2A', 'PM / General', 'PM',
   current_date - 20, current_date - 10, current_date - 12, 'closed', now() - interval '20 days'),
  ('a0000000-0000-4000-8000-000000000001', 'RFI-114',
   'Anchoring detail — pipe support', 'Structural', 'Structural Eng.',
   current_date - 14, current_date - 7, current_date - 6, 'answered', now() - interval '14 days'),
  ('a0000000-0000-4000-8000-000000000001', 'RFI-115',
   'Material substitution — tank lining', 'Architecture', 'Architecture',
   current_date - 2, current_date + 5, null, 'open', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000001', 'RFI-116',
   'Elevation confirmation — east foundation', 'Survey', 'Survey',
   current_date - 4, current_date + 3, null, 'in_review', now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000001', 'RFI-117',
   'Electrical/mechanical drawing conflict — pump room', 'Mechanical', 'Mechanical Eng.',
   current_date - 9, current_date - 2, null, 'in_review', now() - interval '9 days'),
  ('a0000000-0000-4000-8000-000000000001', 'RFI-118',
   'Expansion joint specification — Block B', 'Structural', 'Structural Eng.',
   current_date - 11, current_date - 4, null, 'open', now() - interval '11 days');

insert into public.submittals
  (project_id, submittal_number, item, supplier,
   review_step, review_steps_total, due_date, status, created_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'SUB-040',
   'Main electrical panel — specification', 'Ontario Electric',
   3, 3, current_date - 1, 'approved', now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000001', 'SUB-041',
   'Control valves — shop drawing', 'Flowmaster Inc.',
   1, 3, current_date + 6, 'in_review', now() - interval '6 days'),
  ('a0000000-0000-4000-8000-000000000001', 'SUB-042',
   'Centrifugal pumps — data sheet', 'HydroTech Supply',
   2, 3, current_date + 2, 'in_review', now() - interval '4 days');

insert into public.change_orders
  (project_id, pco_number, description, estimated_cost, status, created_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'PCO-008',
   'Additional dewatering — east excavation', 42750.00, 'draft', now() - interval '8 days'),
  ('a0000000-0000-4000-8000-000000000001', 'PCO-009',
   'Revised tank lining system per RFI-115', 186400.00, 'under_review', now() - interval '3 days');
