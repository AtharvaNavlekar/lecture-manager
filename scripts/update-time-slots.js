const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🗑️  Clearing time_slots table...');
  db.run('DELETE FROM time_slots', (err) => {
    if (err) {
      console.error('❌ Error deleting:', err.message);
      return;
    }
    console.log('✅ Cleared');

    console.log('📝 Inserting corrected time slots...');
    const slots = [
      ['Period 1',     '08:00', '10:00', 'practical', 1],
      ['Short Break',  '10:00', '10:15', 'break',      2],
      ['Period 2',     '10:15', '11:15', 'lecture',    3],
      ['Period 3',     '11:15', '12:15', 'lecture',    4],
      ['Lunch Break',  '12:15', '12:45', 'break',      5],
      ['Period 4',     '12:45', '13:45', 'lecture',    6],
      ['Period 5',     '13:45', '14:45', 'lecture',    7]
    ];

    const stmt = db.prepare(`
      INSERT INTO time_slots (name, start_time, end_time, slot_type, sort_order) 
      VALUES (?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    slots.forEach((slot, index) => {
      stmt.run(...slot, (err) => {
        if (err) {
          console.error(`❌ Error inserting slot ${index + 1}:`, err.message);
        } else {
          inserted++;
        }
        
        if (inserted === slots.length) {
          console.log(`✅ All ${inserted} time slots inserted successfully`);
          
          console.log('\n📊 Verification:');
          db.all('SELECT * FROM time_slots ORDER BY sort_order', (err, rows) => {
            if (err) {
              console.error('❌ Error verifying:', err.message);
            } else {
              rows.forEach(row => {
                console.log(`  ${row.sort_order}. ${row.name} (${row.start_time}-${row.end_time}) [${row.slot_type}]`);
              });
            }
            
            db.close(() => {
              console.log('\n✅ Database updated successfully!');
              process.exit(0);
            });
          });
        }
      });
    });
  });
});
