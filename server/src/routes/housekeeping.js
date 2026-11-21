import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET all housekeeping tasks
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM housekeeping_tasks ORDER BY task_creation_time DESC');
    const tasks = rows.map(t => ({
      id: t.id,
      roomNumber: t.room_number,
      cleaningStatus: t.cleaning_status,
      assignedStaff: t.assigned_staff,
      priority: t.priority,
      taskCreationTime: t.task_creation_time,
      completionTime: t.completion_time,
      notes: t.notes,
    }));
    return res.json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const countRes = await query('SELECT COUNT(*) as count FROM housekeeping_tasks');
    const newId = data.id || `HK-${(countRes[0].count + 1).toString().padStart(4, '0')}`;
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    await query(`
      INSERT INTO housekeeping_tasks (id, room_number, cleaning_status, assigned_staff, priority, task_creation_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newId, data.roomNumber, data.cleaningStatus || 'Dirty',
      data.assignedStaff || 'Housekeeping Staff', data.priority || 'Medium',
      data.taskCreationTime || nowTime, data.notes || null
    ]);

    // Update room housekeeping status
    await query(`
      UPDATE rooms SET housekeeping_status = ? WHERE room_number = ?
    `, [data.cleaningStatus || 'Dirty', data.roomNumber]);

    return res.status(201).json({ success: true, message: 'Housekeeping task created.', id: newId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const tasks = await query('SELECT * FROM housekeeping_tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const t = tasks[0];
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const isCompleted = status === 'Clean' || status === 'Inspected';

    await query(`
      UPDATE housekeeping_tasks SET
        cleaning_status = ?,
        completion_time = ?
      WHERE id = ?
    `, [status, isCompleted ? nowTime : null, id]);

    // Update corresponding room
    await query(`
      UPDATE rooms SET housekeeping_status = ? WHERE room_number = ?
    `, [status, t.room_number]);

    // If room was 'Cleaning' and is now 'Clean' or 'Inspected', change room status to 'Available' if not occupied
    if (isCompleted) {
      await query(`
        UPDATE rooms SET status = 'Available'
        WHERE room_number = ? AND status = 'Cleaning'
      `, [t.room_number]);
    }

    return res.json({ success: true, message: `Task ${id} updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
