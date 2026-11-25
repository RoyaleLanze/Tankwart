-- Same day, same odometer: the order of two refuelings would be ambiguous (ADR 0012, #61).
-- The app rejects this too (odometerDuplicateSameDay); the constraint also covers other clients and seeds.
alter table public.refuelings
  add constraint refuelings_vehicle_day_odometer_key unique (vehicle_id, refueled_on, odometer_km);

-- The unique index starts with (vehicle_id, refueled_on), so the old index is redundant.
drop index public.refuelings_vehicle_id_refueled_on_idx;
