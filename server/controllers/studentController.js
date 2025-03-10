const { Student } = require("../models/student");
const { Counsellor } = require("../models/counsellor");
const fs = require('fs');

//checked
const bulkAddStudents = async (req, res) => {
    try {
        const studentsData = req.fileData;
        for (const studentData of studentsData) {
            const counsellor = await Counsellor.findOne({ counsellorId: studentData.counsellorId });

            if (!counsellor) 
            {
                return res.status(404).json({ message: `Counsellor with ID ${studentData.counsellorId} not found.` });
            }

            await Student.create({
                studentId: studentData.studentId,
                name: {firstName:studentData.firstName, lastName:studentData.lastName},
                email: studentData.email,
                phoneNumber: studentData.phoneNumber,
                fatherName: studentData.fatherName,
                motherName: studentData.motherName,
                fatherPhoneNumber: studentData.fatherPhoneNumber,
                motherPhoneNumber: studentData.motherPhoneNumber,
                currentYear: studentData.currentYear,
                semester: studentData.semester,
                counsellorId: counsellor._id, 
            });
        }

        res.send({ message: 'Students uploaded and saved successfully!' });
    } catch (error) {
        console.error('Error uploading or saving students:', error);
        res.status(500).json({ message: 'Error uploading or saving students', error: error.message });
    }
};
//checked
const addStudent = async (req, res) => {
    const { data } = req.body;

    try {
        // Check if the counsellor exists
        const counsellor = await Counsellor.findOne({ counsellorId: data.counsellorId });

        if (!counsellor) {
            return res.status(404).json({ message: `Counsellor with ID ${data.counsellorId} not found.` });
        }

        // Check for existing student by studentId
        const existingStudentById = await Student.findOne({ studentId: data.studentId });
        if (existingStudentById) {
            return res.status(400).json({
                message: 'Validation Error',
                errors: [{ field: "studentId", message: `Student ID ${data.studentId} is already registered.` }]
            });
        }

        // Check for existing student by email
        const existingStudentByEmail = await Student.findOne({ email: data.email });
        if (existingStudentByEmail) {
            return res.status(400).json({
                message: 'Validation Error',
                errors: [{ field: "email", message: `Email ${data.email} is already registered.` }]
            });
        }

        // Create a new student if validation passes
        const student = new Student({
            ...data,
            counsellorId: counsellor._id, // Map to Counsellor's ObjectId
        });

        await student.save();
        res.send({
            success: true,
            message: "Student added successfully!",
            data: student,
        });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ message: 'Error adding student', error: error.message });
    }
};

//checked
const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    console.log(data);

    try {
        const counsellor = await Counsellor.findById(data.counsellorId);
        if (!counsellor) {
            return res.status(404).json({ message: `Counsellor with ID ${data.counsellorId} not found.` });
        }

        const student = await Student.findOne({ studentId: id });
        if (!student) {
            return res.status(404).json({ message: `Student with ID ${id} not found.` });
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { studentId: id },
            { ...data, counsellorId: counsellor._id },
            { new: true }
        );

        res.send({
            success: true,
            message: "Student updated successfully!",
            data: updatedStudent,
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
};

//checked
const getStudentsByYear = async (req, res) => {
    const year = req.params.year;
    const studentArrays = await Student.find({ currentYear: year });
    console.log(studentArrays);
    
    res.send({
        success: true,
        message: "Student list",
        data: studentArrays,
    });
};
//checked
//single delete student
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    const student = await Student.findOneAndDelete({ studentId: id });
    res.send({
        success: true,
        message: "Student deleted successfully!",
        data: student,
    });
};
//checked
//bulk delete students of a year

//attendance and marks students
const deleteStudentsByYear = async (req, res) => {
    const year = req.params.year;
    const student = await Student.deleteMany({ currentYear: year });
    res.send({
        success: true,
        message: "Students deleted successfully!",
        data: student,
    });
};
const promoteBatch = async (req, res) => {
    try {
      const { year } = req.params;
      const currentYear = parseInt(year);
  
      if (!currentYear || currentYear < 1 || currentYear > 4) {
        return res.status(400).json({ message: "Invalid year provided" });
      }
  
      const students = await Student.find({ currentYear });
  
      if (students.length === 0) {
        return res.status(404).json({ message: "No students found for this year" });
      }
  
      // Check if any students are in their final year
      const finalYearStudents = students.filter((s) => s.currentYear === 4);
      if (finalYearStudents.length > 0) {
        return res.status(400).json({ message: "Some students are in their final year and cannot be promoted" });
      }
  
      // Promote students to the next year
      await Student.updateMany({ currentYear }, { $inc: { currentYear: 1 } });
  
      return res.status(200).json({ message: "Students promoted successfully!" });
    } catch (error) {
      console.error("Error in promoting students:", error);
      return res.status(500).json({ message: "Failed to promote students" });
    }
  };
  
  
  const deleteBatch = async (req, res) => {
    try {
      const { batch, year } = req.params;
      const currentYear = parseInt(year);
  
      if (!currentYear) {
        return res.status(400).json({ error: "Invalid year provided" });
      }
  
      // 1️⃣ Delete students from the Student collection based on batch & currentYear
      const deletedStudents = await Student.deleteMany({ currentYear });
  
      // 2️⃣ Delete corresponding Marks and Attendance data using batch
      await Marks.deleteMany({ batch });
      await Attendance.deleteMany({ batch });
  
      res.status(200).json({
        message: "Students, marks, and attendance data deleted successfully",
        deletedStudents: deletedStudents.deletedCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete students and related data" });
    }
  };
  

module.exports = {
    bulkAddStudents,
    addStudent,
    updateStudent,
    getStudentsByYear,
    deleteStudent,
    deleteStudentsByYear,
    deleteBatch,
    promoteBatch,
};
