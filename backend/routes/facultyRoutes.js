const express = require('express');
const router = express.Router();
const { createFaculty, getAllFaculties } = require('../controllers/facultyController');

router.post('/', createFaculty);
router.get('/', getAllFaculties);

module.exports = router;
