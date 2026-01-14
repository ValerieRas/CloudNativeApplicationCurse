const classService = require('../services/classService');

class ClassController {
  async getAllClasses(req, res) {
    try {
      const includeOld = req.query.includeOld === 'true';
      const classes = await classService.getAllClasses(includeOld);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getClassById(req, res) {
    try {
      const { id } = req.params;
      const classItem = await classService.getClassById(id);
      res.json(classItem);
    } catch (error) {
      if (error.message === 'Class not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async createClass(req, res) {
    try {
      const classData = req.body;
      
      // Validate required fields
      if (!classData.title || !classData.coach || !classData.datetime || 
          !classData.duration || !classData.capacity) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, coach, datetime, duration, capacity' 
        });
      }

      // Validate capacity is positive
      if (classData.capacity <= 0) {
        return res.status(400).json({ error: 'Capacity must be greater than 0' });
      }

      // Validate duration is positive
      if (classData.duration <= 0) {
        return res.status(400).json({ error: 'Duration must be greater than 0' });
      }

      const classItem = await classService.createClass(classData);
      res.status(201).json(classItem);
    } catch (error) {
      if (error.message === 'Class datetime must be in the future') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateClass(req, res) {
    try {
      const { id } = req.params;
      const classData = req.body;
      
      const classItem = await classService.updateClass(id, classData);
      res.json(classItem);
    } catch (error) {
      if (error.message === 'Class not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async deleteClass(req, res) {
    try {
      const { id } = req.params;
      await classService.deleteClass(id);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Class not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async purgeOldClasses(req, res) {
    try {
      const daysOld = parseInt(req.query.days) || 30;
      const result = await classService.purgeOldClasses(daysOld);
      res.json({
        message: `Successfully purged ${result.deletedCount} old classes`,
        deletedCount: result.deletedCount,
        daysOld
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ClassController();
