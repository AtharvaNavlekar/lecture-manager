const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../server/database.sqlite'));

console.log('🔧 Applying all database fixes...\n');

// Fix 1: Add read_at to notifications
try { 
  db.exec(`ALTER TABLE notifications ADD COLUMN read_at DATETIME DEFAULT NULL`);
  console.log('✅ notifications.read_at added');
} catch(e) { console.log('⏭️  notifications.read_at already exists'); }

// Fix 2: Add assignment_type to substitute_assignments
try {
  db.exec(`ALTER TABLE substitute_assignments ADD COLUMN assignment_type TEXT DEFAULT 'manual'`);
  console.log('✅ substitute_assignments.assignment_type added');
} catch(e) { console.log('⏭️  assignment_type already exists'); }

// Fix 3: Fix time slots
db.exec(`DELETE FROM time_slots`);
db.exec(`
  INSERT INTO time_slots (name,start_time,end_time,slot_type,sort_order) VALUES
  ('Period 1','08:00','10:00','practical',1),
  ('Short Break','10:00','10:15','break',2),
  ('Period 2','10:15','11:15','lecture',3),
  ('Period 3','11:15','12:15','lecture',4),
  ('Lunch Break','12:15','12:45','break',5),
  ('Period 4','12:45','13:45','lecture',6),
  ('Period 5','13:45','14:45','lecture',7)
`);
console.log('✅ time_slots corrected');

// Fix 4: Fix class years
db.exec(`UPDATE classes SET class_year='FY' WHERE class_year IN ('FE','First Year')`);
db.exec(`UPDATE classes SET class_year='SY' WHERE class_year IN ('SE','Second Year')`);
db.exec(`UPDATE classes SET class_year='TY' WHERE class_year IN ('TE','Third Year')`);
db.exec(`DELETE FROM classes WHERE class_year NOT IN ('FY','SY','TY')`);
console.log('✅ class_years fixed → FY / SY / TY only');

db.close();
console.log('\n🎉 All DB fixes applied! Now restart the server: npm run dev');
