const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    name: { type: String, required: true },
    salary: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true }, // Ensure employeeId is unique
    skills: { type: Array, required: false },
    details: { type: Object, required: false },
    position: { type: String, required: false }
});

const Employee = mongoose.model('Employee', employeeSchema);

router.post('/addEmployee', async (req, res, next) => {
    const { employeeId, name, salary, position } = req.body;

    // Validate that employeeId is provided
    if (!employeeId) {
        return res.status(400).json({ success: false, error: 'employeeId is required' });
    }

    try {
        // Check if an employee with this employeeId already exists
        const existingEmployee = await Employee.findOne({ employeeId });
        if (existingEmployee) {
            return res.status(409).json({ success: false, error: `Employee with ID ${employeeId} already exists` });
        }

        const newEmployee = new Employee({
            employeeId: employeeId,
            name: name || 'John Doe',
            salary: salary || '50000',
            position: position || 'Software Engineer'
        });

        const result = await newEmployee.save();
        console.log('Saved employee to database');
        res.json({ success: true, employee: result });
    } catch (err) {
        console.log('Failed to add an employee: ' + err);
        res.status(500).json({ success: false, error: err.message });
    }
});


router.get('/getEmployee', async (req, res) => {
    try {
        if (!req.query.employeeId) {
            return res.status(400).json({ success: false, error: 'employeeId query parameter is required' });
        }

        const employee = await Employee.findOne({ employeeId: req.query.employeeId });

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        res.status(200).json({ success: true, employee });
        console.log('Found employee in database');

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.delete('/deleteEmployee', (req, res, next) => {
    Employee.findOneAndRemove({ employeeId: req.query.employeeId })
        .then(result => {
            if (!result) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            console.log('Deleted employee from database');
            res.json({ success: true, message: 'Employee deleted' });
        })
        .catch(err => {
            console.log('Failed to delete employee: ' + err);
            res.json({ success: false, error: err.message });
        });
});

exports.routes = router;