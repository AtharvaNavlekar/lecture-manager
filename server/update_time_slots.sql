DELETE FROM time_slots;

INSERT INTO time_slots (name, start_time, end_time, slot_type, sort_order) VALUES
  ('Period 1',     '08:00', '10:00', 'practical', 1),
  ('Short Break',  '10:00', '10:15', 'break',      2),
  ('Period 2',     '10:15', '11:15', 'lecture',    3),
  ('Period 3',     '11:15', '12:15', 'lecture',    4),
  ('Lunch Break',  '12:15', '12:45', 'break',      5),
  ('Period 4',     '12:45', '13:45', 'lecture',    6),
  ('Period 5',     '13:45', '14:45', 'lecture',    7);
