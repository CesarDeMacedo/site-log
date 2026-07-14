-- Rename assigned_to → contractor (preserves existing data) and add the two
-- optional link fields shown on the RFI form and log.
alter table public.rfis rename column assigned_to to contractor;
alter table public.rfis add column link_design_package text;
alter table public.rfis add column link_blue_bin_section text;
