const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// ✅ POST /api/courses/create — Create a new course
router.post('/create', async (req, res) => {
  const { title, description, createdBy } = req.body;

  if (!title || !description || !createdBy) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const course = new Course({ title, description, createdBy });
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course', error });
  }
});

// ✅ GET /api/courses — Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error });
  }
});

module.exports = router;
