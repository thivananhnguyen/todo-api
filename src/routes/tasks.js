const express = require('express');
const taskController = require('../controllers/tasksController');
const {
	validateCreateTask,
	validateUpdateTask,
} = require('../middleware/taskValidation');

const router = express.Router();

// Keep routes thin: validation and business logic are delegated.
router.post('/', validateCreateTask, taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', validateUpdateTask, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
