const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGO_URI);
client.connect();

const db = client.db(process.env.DB_NAME);

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Attendance Backend is Running...');
});

app.post('/submit-attendance', async (req, res) => {
    try {
        console.log("Received Request Body:", req.body);

        const { date, subject, section, students } = req.body;

        if (!date || !subject || !section || !students || !Array.isArray(students)) {
            return res.status(400).json({ error: "Invalid request format" });
        }

        const attendanceData = {
            date,
            subject,
            section,
            students
        };

        const result = await db.collection('attendance').insertOne(attendanceData);

        res.json({ message: "Attendance recorded successfully!", insertedId: result.insertedId });

    } catch (error) {
        console.error("Error saving attendance:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/get-attendance', async (req, res) => {
    try {
        const { rollNumber } = req.query;

        if (!rollNumber) {
            return res.status(400).json({ error: "Roll number is required" });
        }

        const attendanceData = await db.collection('attendance').find({
            "students.rollNumber": rollNumber
        }).toArray();

        res.json(attendanceData);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/submit-announcement', async (req, res) => {
    try {
        console.log("Received Request Body:", req.body);

        const { date, subject, section, message } = req.body;

        if (!date || !subject || !section || !message) {
            return res.status(400).json({ error: "All fields are required: date, subject, section, message" });
        }

        const announcementData = {
            date,
            subject,
            section,
            message
        };

        const announcement = await db.collection('announcements').insertOne(announcementData);

        res.json({ message: "Announcement added successfully!", insertedId: announcement.insertedId });

    } catch (error) {
        console.error("Error posting announcement:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-announcements', async (req, res) => {
    try {
        const announcements = await db.collection('announcements').find().toArray();
        res.json(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete('/delete-announcement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid announcement ID" });
        }

        const result = await db.collection('announcements').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Announcement not found" });
        }

        res.json({ message: "Announcement deleted successfully!" });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-subject-cie/:rollNo/:subject', async (req, res) => {
    const rollNo = parseInt(req.params.rollNo);
    const subject = req.params.subject;

    const data = await db.collection('subject_cie').findOne({ rollNo, subject });

    if (data) {
        res.json(data);
    } else {
        res.json({
            rollNo,
            subject,
            sliptests: [0, 0, 0],
            assignments: [0, 0],
            mids: [0, 0],
            attendance: 0,
            slipAvg: 0,
            assignAvg: 0,
            midAvg: 0,
            attendanceMarks: 0,
            totalCIE: 0
        });
    }
});

app.get('/get-lab-cie/:rollNo/:lab', async (req, res) => {
    const rollNo = parseInt(req.params.rollNo);
    const lab = req.params.lab;

    const data = await db.collection('lab_cie').findOne({ rollNo, lab });

    if (data) {
        res.json(data);
    } else {
        res.json({
            rollNo,
            lab,
            internals: [0, 0],
            record: 0,
            internalAvg: 0,
            totalCIE: 0
        });
    }
});

app.get('/get-total-cie/:rollNo', async (req, res) => {

    const rollNo = parseInt(req.params.rollNo);
    
    const subjects = [
        "PQT : Probability and Queueing Theory",
        "DCCST : DC Circuits Sensors and Transducers",
        "DBMS : Database Management Systems",
        "DAA : Design and Analysis of Algorithms",
        "EEA : Engineering Economics and Accountancy",
        "PE - 1 : Professional Elective - 1"
    ];

    const labs = [
        "DBMS Lab : Database Management Systems Lab",
        "ALG Lab : Algorithms Lab",
        "MP-I : Mini Project – I"
    ];

    const cieData = { rollNo };

    for (const subject of subjects) {
        const subData = await db.collection('subject_cie').findOne({ rollNo, subject });
        cieData[subject] = subData ? subData.totalCIE : 0;
    }

    for (const lab of labs) {
        const labData = await db.collection('lab_cie').findOne({ rollNo, lab });
        cieData[lab] = labData ? labData.totalCIE : 0;
    }

    res.json(cieData);
});

app.put('/update-subject-cie/:rollNo/:subject', async (req, res) => {
    try {
        const rollNo = parseInt(req.params.rollNo);
        const subject = req.params.subject;
        const { sliptests, assignments, mids, attendance } = req.body;

        const slipAvg = averageTopTwo(sliptests);
        const assignAvg = average(assignments);
        const midAvg = average(mids);
        const attendanceMarks = attendance;
        const totalCIE = slipAvg + assignAvg + midAvg + attendanceMarks;

        await db.collection('subject_cie').updateOne(
            { rollNo, subject },
            {
                $set: {
                    rollNo,
                    subject,
                    sliptests,
                    assignments,
                    mids,
                    attendance,
                    slipAvg,
                    assignAvg,
                    midAvg,
                    attendanceMarks,
                    totalCIE
                }
            },
            { upsert: true }
        );

        res.json({ message: "Subject CIE updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.put('/update-lab-cie/:rollNo/:lab', async (req, res) => {
    try {
        const rollNo = parseInt(req.params.rollNo);
        const lab = req.params.lab;
        const { internals, record } = req.body;

        const internalAvg = average(internals);
        const totalCIE = internalAvg + record;

        await db.collection('lab_cie').updateOne(
            { rollNo, lab },
            {
                $set: {
                    rollNo,
                    lab,
                    internals,
                    record,
                    internalAvg,
                    totalCIE
                }
            },
            { upsert: true }
        );

        res.json({ message: "Lab CIE updated!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/get-fee-details/:rollNo', async (req, res) => {
    try {
        const rollNo = parseInt(req.params.rollNo);
        const feeData = await db.collection('fee_details').findOne({ rollNo });

        if (!feeData) {
            return res.json({
                rollNo,
                fees: [
                    { type: "College Fee", amount: 0, status: "paid" },
                    { type: "Transport Fee", amount: 0, status: "paid" },
                    { type: "Hostel Fee", amount: 0, status: "paid" }
                ]
            });
        }

        res.json(feeData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.put('/update-fee-details/:rollNo', async (req, res) => {
    try {
        const rollNo = parseInt(req.params.rollNo);
        const { fees } = req.body;

        await db.collection('fee_details').updateOne(
            { rollNo },
            {
                $set: {
                    rollNo,
                    fees
                }
            },
            { upsert: true }
        );

        res.json({ message: "Fee details updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

function average(arr) {
    const valid = arr.filter(n => !isNaN(n));
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function averageTopTwo(arr) {
    const sorted = arr.filter(n => !isNaN(n)).sort((a, b) => b - a);
    return sorted.length >= 2 ? Math.round((sorted[0] + sorted[1]) / 2) : sorted[0] || 0;
}


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});