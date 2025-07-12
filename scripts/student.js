// <--------------------Toast-------------------->

const feeToast = new Notyf({
    position: {
      x: 'right',
      y: 'top' 
    }
  });

const assignmentToast = new Notyf({
    position: {
      x: 'right',
      y: 'top'
    }
  });

// <--------------------roll-Number-------------------->
const urlParams = new URLSearchParams(window.location.search);
const rollNumber = urlParams.get("rollNumber");
if (rollNumber) {
    document.getElementById("rollNumber").innerText = rollNumber
} else {
    document.getElementById("rollNumber").innerText = ""
}
const shortRoll = parseInt(rollNumber.slice(-3));
console.log(shortRoll)
let sectionName
// <--------------------SectionName-------------------->

document.addEventListener("DOMContentLoaded", () => {
    const getSection = roll => {
        const num = parseInt(roll.slice(-3), 10);
        return (num >= 1 && num <= 70) || (num >= 301 && num <= 307) ? "it1" :
               (num >= 71 && num <= 137) || (num >= 308 && num <= 314) ? "it2" :
               (num >= 138 && num <= 210) || (num >= 315 && num <= 320) ? "it3" : "it2";
    };

    console.log(getSection(rollNumber));
    sectionName = getSection(rollNumber);
});


// <--------------------Time Table-------------------->

const timetables = {
    it1: [
        ["Monday", "DBMS", "DAA", "PE - 1", "Lunch", "DCCST", "DBMS", "LAB"],
        ["Tuesday", "DBMS", "Environmental Science", "Mini Project 1", "ALGO Lab", "Mentoring", "PE - 1"],
        ["Wednesday", "DBMS Lab", "DBMS", "PQT", "DCCST", "PE - 1", "Engineering Economics"],
        ["Thursday", "PQT", "DAA", "Environmental Science", "DCCST", "DBMS", "LAB"],
        ["Friday", "DBMS", "PE - 1", "DBMS Lab", "Engineering Economics", "ALGO Lab", "Mini Project 1"]
    ],
    it2: [
        ["Monday", "PQT", "DAA", "PE-1", "Lunch", "DCCST", "DBMS LAB", "DBMS LAB"],
        ["Tuesday", "MP LAB", "MP LAB", "PQT","ES", "EEA", "SPORTS"],
        ["Wednesday", "DBMS", "DAA", "PQT", "PE - 1", "ES", "DCCST"],
        ["Thursday", "PE - 1", "EEA", "DCCST", "DBMS", "MENTORING", "PQT"],
        ["Friday", "EEA", "DAA", "ALGO LAB", "ALGO LAB ", "DBMS", "LIBRARY"]
    ],
    it3: [
        ["Monday", "DAA", "DBMS", "PE - 1", "Lunch", "PQT", "DCCST", "LAB"],
        ["Tuesday", "Mini Project 1", "Environmental Science", "DBMS", "Mentoring", "ALGO Lab", "PQT"],
        ["Wednesday", "DBMS", "DBMS Lab", "DAA", "PQT", "Engineering Economics", "PE - 1"],
        ["Thursday", "DCCST", "PE - 1", "Environmental Science", "DBMS", "DAA", "LAB"],
        ["Friday", "Engineering Economics", "ALGO Lab", "Mini Project 1", "DBMS Lab", "DBMS", "PQT"]
    ]
};

// <--------------------Sections-------------------->

function showSection(section) {
    fetch(`sections/student/${section}.html`)
        .then(response => response.text())
        .then(data => {
            document.getElementById("mainbar").innerHTML = data;

            requestAnimationFrame(() => {

                if (section === "timetable") updateTimetable(sectionName);
                if (section === "Fees") fetchFees(shortRoll);
                if (section === "announcements") loadAnnouncements();
                if (section === "records") recordsLoad();
                if (section === "assignments") {
                    openDatabase(function () {
                        AssignmentsFunction();
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error loading section:", error);
            document.getElementById("mainbar").innerHTML = `<h2>Error Loading ${section}</h2>`;
        });
}

function logout() {
    window.location.href = "index.html";
}

// <--------------------GSAP-------------------->

var tl = gsap.timeline();

tl.from(".ani", {
    y: -30,
    opacity: 0,
    duration: 0.5,
    delay: 0.5,
    stagger: 0.2
})

tl.from(".maincontent h2, .maincontent p", {
    y: 20,
    scale: 0.8,
    opacity: 0,
    duration: 0.5
})

gsap.from(".ani2", {
    x: -30,
    opacity: 0,
    duration: 0.5,
    delay: 0.5,
    stagger: 0.2
})

// <--------------------Attendance-------------------->

document.addEventListener("DOMContentLoaded", () => {
    const attendanceButton = document.getElementById("attendanceBtn");

    if (attendanceButton) {
        attendanceButton.addEventListener("click", async () => {
            setTimeout(async () => {
                await updateAttendanceTable(rollNumber);

            }, 100);
        });
    } else {
        console.error("Attendance button not found!");
    }
});

async function fetchAttendance(rollNumber) {
    try {
        const response = await fetch(`http://localhost:3000/get-attendance?rollNumber=${rollNumber}`);
        const data = await response.json();

        console.log(data)

        populateDateDropdown(data);

        return data;
    } catch (error) {
        console.error("Error fetching attendance data:", error);
        return [];
    }
}

function populateDateDropdown(attendanceData) {
    const dateDropdown = document.getElementById("dateDropdown");

    if (!dateDropdown) {
        console.error("Date dropdown not found!");
        return;
    }

    const uniqueDates = [...new Set(attendanceData.map(record => record.date))];

    dateDropdown.innerHTML = '<option value="">---Select date---</option>';

    uniqueDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dateDropdown.appendChild(option);
    });

    dateDropdown.addEventListener("change", () => {
        const selectedDate = dateDropdown.value;
        displayAttendanceByDate(selectedDate, attendanceData);
    });
}

function displayAttendanceByDate(selectedDate, attendanceData) {
    const table = document.querySelector(".date-attendance table");

    if (!table) {
        console.error("Attendance table not found!");
        return;
    }

    table.innerHTML = `
        <tr>
          <th>Date</th>
          <th>Subject</th>
          <th>Status</th>
        </tr>
    `;

    const filteredData = attendanceData.filter(record => record.date === selectedDate);

    filteredData.forEach(record => {
        record.students.forEach(student => {
            if (student.rollNumber === rollNumber) {
                const row = document.createElement("tr");
                const statusClass = student.status.toLowerCase() === "present" ? "present" : "absent";
                const statusText = student.status.charAt(0).toUpperCase() + student.status.slice(1).toLowerCase();
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.subject}</td>
                    <td class="${statusClass}">${statusText}</td>
                `;
                table.appendChild(row);
            }
        });
    });
}

function processAttendance(attendanceData) {
    let attendanceSummary = {};

    attendanceData.forEach(record => {
        const subject = record.subject;

        if (!attendanceSummary[subject]) {
            attendanceSummary[subject] = { held: 0, attended: 0 };
        }

        attendanceSummary[subject].held += 1;

        const student = record.students.find(s => s.rollNumber === rollNumber);

        if (student && student.status.toLowerCase() === "present") {
            attendanceSummary[subject].attended += 1;
        }
    });

    return attendanceSummary;
}

async function updateAttendanceTable(rollNumber) {
    const tableBody = document.querySelector(".subject-attendance-table tbody");

    if (!tableBody) {
        console.error("Error: Attendance table body not found! Ensure the section is visible before updating.");
        return;
    }

    try {
        const attendanceData = await fetchAttendance(rollNumber);
        const attendanceSummary = processAttendance(attendanceData);

        let totalClassesHeld = 0;
        let totalClassesAttended = 0;

        for (let i = 0; i < tableBody.rows.length; i++) {
            let subjectCell = tableBody.rows[i].cells[1];
            let heldCell = tableBody.rows[i].cells[2];
            let attendedCell = tableBody.rows[i].cells[3];
            let percentageCell = tableBody.rows[i].cells[4];

            let subject = subjectCell.textContent.trim();
            if (attendanceSummary[subject]) {
                let held = attendanceSummary[subject].held;
                let attended = attendanceSummary[subject].attended;
                let percentage = ((attended / held) * 100).toFixed(2);

                heldCell.textContent = held;
                attendedCell.textContent = attended;
                percentageCell.textContent = `${percentage}%`;

                totalClassesHeld += held;
                totalClassesAttended += attended;
            }
        }

        TotalAttendance = totalClassesHeld > 0 ? `${((totalClassesAttended / totalClassesHeld) * 100).toFixed(2)}` : "0";

        let totalRow = tableBody.rows[tableBody.rows.length - 1];
        totalRow.cells[2].textContent = totalClassesHeld;
        totalRow.cells[3].textContent = totalClassesAttended;
        totalRow.cells[4].textContent = TotalAttendance

        document.querySelector(".att-percentage").textContent = TotalAttendance + "%"
        console.log(TotalAttendance)

        let message = "";
        let messageColor = "green";

        if (TotalAttendance >= 90) {
            message = "Excellent attendance! Keep it up.";
        } else if (TotalAttendance >= 75) {
            message = "Good attendance. Maintain consistency.";
        } else if (TotalAttendance >= 60) {
            message = "Your attendance is low. Try to attend more classes.";
            messageColor = "red";
        } else if (TotalAttendance >= 45) {
            message = "Warning: Your attendance is below the required level.";
            messageColor = "red";
        } else {
            message = "Critical alert: Immediate improvement needed.";
            messageColor = "red";
        }

        const messageElement = document.querySelector(".att-message");
        messageElement.textContent = message;
        messageElement.style.color = messageColor;

    } catch (error) {
        console.error("Error updating attendance table:", error);
    }
}

function showDateWise() {
    gsap.to(".subject-wise", { opacity: 0, y: -20, duration: 0.3, display: "none" });
    gsap.fromTo(".date-wise",
        { opacity: 0, y: 50, display: "none" },
        { opacity: 1, y: 0, duration: 0.5, display: "flex" }
    );
}

function showOverall() {
    gsap.to(".date-wise", { opacity: 0, y: -50, duration: 0.5, display: "none" });
    gsap.fromTo(".subject-wise",
        { opacity: 0, y: 50, display: "none" },
        { opacity: 1, y: 0, duration: 0.5, display: "flex" }
    );
}

// <--------------------Time Table-------------------->

function updateTimetable(section) {
    if (section) {

        const timetableBody = document.getElementById("timetableBody");
        timetableBody.innerHTML = "";
        timetables[section].forEach((row) => {
            let tr = "<tr>";
            tr += `<th>${row[0]}</th>`;
            console.log(timetableBody.innerHTML)
            row.slice(1).forEach(subject => {
                if (subject === "Lunch") {
                    
                    tr += '<td rowspan="5" class="lunch-break">Lunch Break</td>';
                } else {
                    tr += `<td>${subject}</td>`;
                }
            });
            tr += "</tr>";
            timetableBody.innerHTML += tr;
        });
    }
}

// <--------------------Assignment-------------------->

let db;

function openDatabase(callback) {
    const request = indexedDB.open("AttendZ_DB", 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("assignments")) {
            const assignmentStore = db.createObjectStore("assignments", { keyPath: "id" });
            assignmentStore.createIndex("title", "title", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("IndexedDB opened successfully.");
        if (callback) callback();
    };

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.errorCode);
    };
}

function AssignmentsFunction() {
    const assignmentItems = document.querySelectorAll(".assignment-item");
    const assignmentView = document.querySelector(".assignment-view");
    const assignmentDetails = document.querySelector(".assignment-details");
    const backButton = document.querySelector(".details-heading button");

    assignmentItems.forEach(item => {
        item.addEventListener("click", () => {
            gsap.to(assignmentView, {
                x: 2000,
                duration: 0.5,
                onComplete: () => {
                    assignmentView.style.display = "none";
                    assignmentDetails.style.display = "flex";
                    gsap.fromTo(assignmentDetails, { opacity: 0, x: -500 }, { opacity: 1, x: 0, duration: 0.5 });
                }
            });
        });
    });

    backButton.addEventListener("click", () => {
        gsap.to(assignmentDetails, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                assignmentDetails.style.display = "none";
                assignmentView.style.display = "flex";
                gsap.fromTo(assignmentView, { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 0.5 });
            }
        });
    });

    console.log("called")
    getAssignmentsBySection(sectionName, displayAssignments);
}

function getAssignmentsBySection(sectionName, callback) {
    const transaction = db.transaction(['assignments'], 'readonly');
    const store = transaction.objectStore('assignments');
    const request = store.openCursor();

    const assignments = [];

    request.onsuccess = function (event) {
        const cursor = event.target.result;
        console.log("YUP")
        if (cursor) {
            const assignment = cursor.value;

            if (assignment.sectionName === sectionName) {
                assignments.push(assignment);
            }
            cursor.continue();
        } else {
            console.log(assignments)
            console.log("Finished")
            callback(assignments);
        }
    };

    request.onerror = function (event) {
        console.error('Error fetching assignments:', event.target.error);
    };
}

function displayAssignments(assignments) {
    const assignmentContainer = document.querySelector('.assignment-items');
    assignmentContainer.innerHTML = '';

    assignments.forEach(assignment => {
        const assignmentItem = document.createElement('li');
        assignmentItem.classList.add('assignment-item');
        assignmentItem.textContent = assignment.title;

        assignmentItem.setAttribute('data-assignment-title', assignment.title);

        assignmentItem.addEventListener('click', () => {
            document.querySelectorAll('.assignment-item').forEach(item => item.classList.remove('clicked'));
            console.log("Removed")
            assignmentItem.classList.add('clicked');

            showAssignmentDetails(assignment);
        });
        assignmentContainer.appendChild(assignmentItem);
    });
}

function showAssignmentDetails(assignment) {
    const assignmentDetails = document.querySelector('.assignment-details');
    const assignmentView = document.querySelector('.assignment-view');
    const assignmentInfoContainer = document.getElementById('assignment-info');
    const fileInput = document.getElementById('assignmentFile');
    const fileNameDisplay = document.getElementById('file-name');
    fileInput.value = '';
    fileNameDisplay.textContent = 'No file chosen';

    assignmentInfoContainer.innerHTML = `
        <div><h3>Title:</h3><p>${assignment.title}</p></div>
        <div><h3>Description:</h3><p>${assignment.description}</p></div>
        <div><h3>File:</h3><button class="view-file" onclick="viewAssignmentFile('${assignment.file}')">View File</button></div>
    `;

    gsap.to(assignmentView, {
        opacity: 0, duration: 0.5, onComplete: () => {
            assignmentView.style.display = 'none';
            assignmentDetails.style.display = 'flex';
            gsap.fromTo(assignmentDetails, { opacity: 0, x: -500 }, { opacity: 1, x: 0, duration: 0.5 });
        }
    });
}

function viewAssignmentFile(fileData) {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = 'assignment.pdf';
    link.click();
}

function submitAssignment() {
    const fileInput = document.getElementById('assignmentFile');
    const fileNameDisplay = document.getElementById('file-name');
    const file = fileInput.files[0];

    if (!file) {
        assignmentToast.error({message: 'Please choose a file to submit.',className: 'assignment-toast'});
        return;
    }

    console.log(file.name);
    fileNameDisplay.textContent = file.name;

    const section = getStudentSection();
    const assignmentItem = document.querySelector('.assignment-item.clicked'); 
    const assignmentName = assignmentItem ? assignmentItem.getAttribute('data-assignment-title') : 'Unknown Assignment';
    const assignmentId = Date.now();

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const fileData = event.target.result;

        const assignmentData = {
            id: assignmentId,
            rollNumber: rollNumber,
            section: section,
            assignmentName: assignmentName,
            fileName: file.name,
            file: fileData,
        };

        saveAssignmentData(assignmentData);
    };

    reader.readAsDataURL(file);
}

function saveAssignmentData(data) {
    const request = indexedDB.open('studentAssignmentsDB', 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('assignments')) {
            db.createObjectStore('assignments', { keyPath: 'id' });
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;

        const transaction = db.transaction(['assignments'], 'readwrite');
        const store = transaction.objectStore('assignments');

        store.add(data);

        transaction.oncomplete = () => {
            
        assignmentToast.success({message: 'Assignment submitted successfully!',className: 'assignment-toast'});
            console.log('Assignment saved:', data);
        };

        transaction.onerror = (error) => {
            console.error('Error saving assignment:', error);
        };
    };

    request.onerror = (error) => {
        console.error('Error opening IndexedDB:', error);
    };
}

function getStudentSection() {
    return sectionName || "it2";
}

// <--------------------Assignment-------------------->

function loadAnnouncements() {
    fetch("http://localhost:3000/get-announcements")
        .then(response => response.json())
        .then(data => {
            let announcementList = document.querySelector(".announcement-list");

            announcementList.innerHTML = ""; 

            let filteredAnnouncements = data.filter(announcement => 
                announcement.section.toUpperCase() === sectionName.toUpperCase()
            );

            if (filteredAnnouncements.length === 0) {
                announcementList.innerHTML = "<p>No announcements for your section.</p>";
                return;
            }

            filteredAnnouncements.forEach(announcement => {
                let announcementDiv = document.createElement("div");
                announcementDiv.classList.add("announce-card");

                announcementDiv.innerHTML = `
                    <h3>${announcement.subject}</h3>
                    <p>${announcement.message}</p>
                    <small>${new Date(announcement.date).toLocaleString()} | Section: <strong>${announcement.section.toUpperCase()}</strong></small>
                `;

                announcementList.appendChild(announcementDiv);
            });
        })
        .catch(error => console.error("Error loading announcements:", error));
}

// <--------------------Marks Details-------------------->
function moveSlider(index, btn) {
    const slider = document.querySelector('.record-slider');
    const buttons = document.querySelectorAll('.record-header button');
    const subjectDropdown = document.getElementById("subject-records-dropdown");

    slider.style.transform = `translateX(${index * 100}%)`;

    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const subjectCIE = document.querySelector('.subject-cie-section');
    const fullCIE = document.querySelector('.full-cie-table-section');

    subjectCIE.style.display = index === 0 ? 'block' : 'none';
    fullCIE.style.display = index === 1 ? 'block' : 'none';

    if (index === 0) {
        subjectDropdown.value = "";
        const dropdown = document.getElementById("subject-records-dropdown");
        const selectedValue = dropdown.value;

        if (selectedValue === "Theory") {
            loadSubjectCIE();
        } else if (selectedValue === "Labs") {
            loadLabCIE();
        } 
    } else if (index === 1) {
        const dropdown = document.getElementById("subject-records-dropdown");
        const selectedValue = dropdown.value;
        loadFullCIE(); 
    }
}

function recordsLoad() {
    const dropdown = document.getElementById("subject-records-dropdown");
    const subjectTable = document.getElementById("subject-cie-table");
    const labTable = document.getElementById("lab-cie-table");

    const theorySubjects = [
        "PQT : Probability and Queueing Theory",
        "DCCST : DC Circuits Sensors and Transducers",
        "DBMS : Database Management Systems",
        "DAA : Design and Analysis of Algorithms",
        "EEA : Engineering Economics and Accountancy",
        "PE - 1 : Professional Elective - 1"
    ];

    const labSubjects = [
        "DBMS Lab : Database Management Systems Lab",
        "ALG Lab : Algorithms Lab",
        "MP-I : Mini Project – I"
    ];

    if (dropdown) {
        dropdown.addEventListener("change", async function () {
            const selected = this.value;

            if (selected === "Theory") {
                subjectTable.style.display = "block";
                labTable.style.display = "none";
                await loadSubjectCIE(theorySubjects);
            } else if (selected === "Labs") {
                subjectTable.style.display = "none";
                labTable.style.display = "block";
                await loadLabCIE(labSubjects);
            } else {
                selected = "";
                subjectTable.style.display = "none";
                labTable.style.display = "none";
            }
        });

        if (dropdown.value === "Theory") {
            subjectTable.style.display = "block";
            labTable.style.display = "none";
            loadSubjectCIE(theorySubjects);
        } else if (dropdown.value === "Labs") {
            subjectTable.style.display = "none";
            labTable.style.display = "block";
            loadLabCIE(labSubjects);
        }
    }
}

async function loadSubjectCIE(subjects) {
    const tbody = document.querySelector("#subject-cie-table tbody");
    tbody.innerHTML = "";

    for (const subject of subjects) {
        const res = await fetch(`http://localhost:3000/get-subject-cie/${shortRoll}/${encodeURIComponent(subject)}`);
        const data = await res.json();

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${subject}</td>
            <td>${data.sliptests[0]}</td>
            <td>${data.sliptests[1]}</td>
            <td>${data.sliptests[2]}</td>
            <td>${data.slipAvg}</td>
            <td>${data.assignments[0]}</td>
            <td>${data.assignments[1]}</td>
            <td>${data.assignAvg}</td>
            <td>${data.mids[0]}</td>
            <td>${data.mids[1]}</td>
            <td>${data.midAvg}</td>
            <td>${data.attendanceMarks}</td>
            <td>${data.totalCIE}</td>
        `;
        tbody.appendChild(row);
    }
}

async function loadLabCIE(labs) {
    const tbody = document.querySelector("#lab-cie-table tbody");
    tbody.innerHTML = "";

    for (const lab of labs) {
        const res = await fetch(`http://localhost:3000/get-lab-cie/${shortRoll}/${encodeURIComponent(lab)}`);
        const data = await res.json();
        console.log(data)

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${lab}</td>
            <td>${data.internals[0]}</td>
            <td>${data.internals[1]}</td>
            <td>${data.internalAvg}</td>
            <td>${data.record}</td>
            <td>${data.totalCIE}</td>
        `;
        tbody.appendChild(row);
    }
}

async function loadFullCIE() {
    const tableHead = document.querySelector("#full-cie-table thead");
    const tableBody = document.querySelector("#full-cie-table tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    try {
        const response = await fetch(`http://localhost:3000/get-total-cie/${shortRoll}`);
        const data = await response.json();

        const allKeys = [
            "PQT : Probability and Queueing Theory",
            "DCCST : DC Circuits Sensors and Transducers",
            "DBMS : Database Management Systems",
            "DAA : Design and Analysis of Algorithms",
            "EEA : Engineering Economics and Accountancy",
            "PE - 1 : Professional Elective - 1",
            "DBMS Lab : Database Management Systems Lab",
            "ALG Lab : Algorithms Lab",
            "MP-I : Mini Project – I"
        ];

        tableHead.innerHTML = `
            <tr>
                <th>Subject / Lab</th>
                <th>Total CIE Marks</th>
            </tr>
        `;

        allKeys.forEach(name => {
            const tr = document.createElement("tr");
            const total = data[name] || 0;

            tr.innerHTML = `
                <td>${name}</td>
                <td>${total}</td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error loading Full CIE:", error);
    }
}

// <--------------------Fees-------------------->

async function fetchFees(rollNo) {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("receipt-date").value = today;

    const res = await fetch(`http://localhost:3000/get-fee-details/${rollNo}`);
    const data = await res.json();
    updateFeeTable(data);
    updatePaymentDetails(data.fees);
}

function updateFeeTable(data) {
    data.fees.forEach(fee => {
        const typeKey = fee.type.toLowerCase().split(" ")[0];
        const row = document.getElementById(`${typeKey}-fee`);
        if (!row) return;

        row.querySelector("td:nth-child(2)").textContent = fee.amount.toLocaleString();

        const statusTd = row.querySelector(".status");
        statusTd.innerText = fee.status.charAt(0).toUpperCase() + fee.status.slice(1);
        statusTd.className = `status ${fee.status.toLowerCase()}`;

        row.style.display = "table-row";
    });
}

function showFees(fee) {
    const fees = {
        college: document.getElementById("college-fee"),
        transport: document.getElementById("transport-fee"),
        hostel: document.getElementById("hostel-fee"),
    };

    Object.values(fees).forEach(feeElement => {
        feeElement.style.display = "none";
    });

    if (!fee) {
        Object.values(fees).forEach(feeElement => {
            feeElement.style.display = "table-row";
        });
    } else if (fees[fee]) {
        fees[fee].style.display = "table-row";
    }

    updatePaymentDetailsFromDOM();
}

const feeAmounts = {
    college: 165000,
    transport: 45000,
    hostel: 115000
  };
  
function updatePaymentDetailsFromDOM() {
    let totalFee = 0;
    let amountToPay = 0;
  
    ["college", "transport", "hostel"].forEach(type => {
      const row = document.getElementById(`${type}-fee`);
  
      if (row && row.style.display === "table-row") {
        totalFee += feeAmounts[type]; 
  

        const amountText = row.querySelector("td:nth-child(2)").textContent.replace(/,/g, "");
        const amount = parseInt(amountText) || 0;

        const status = row.querySelector(".status").innerText.toLowerCase();
  
        if (status === "unpaid" && amount > 0) {
          amountToPay += amount;
        }
      }
    });

    document.querySelector(".total-fee").innerText = `Total Fee: ₹${totalFee.toLocaleString()}`;
    document.querySelector(".to-pay").innerText = `Amount to Pay: ₹${amountToPay.toLocaleString()}`;
    document.querySelector(".total-amount-upi strong").innerText = `₹${amountToPay.toLocaleString()}`;
    document.querySelector(".total-amount-credit strong").innerText = `₹${amountToPay.toLocaleString()}`;

    const proceedButton = document.querySelector(".proceed-payment");
    const payButton = document.querySelector(".pay-btn");
  
    const enable = amountToPay > 0;
    proceedButton.style.background = enable ? "#ff4d4d" : "#818181";
    payButton.style.background = enable ? "#FF6F61" : "#818181";
    proceedButton.style.cursor = enable ? "pointer" : "not-allowed";
    payButton.style.cursor = enable ? "pointer" : "not-allowed";
    proceedButton.disabled = !enable;
    payButton.disabled = !enable;
}
  
async function updatePaymentDetails(fees) {
    let totalFee = 0;
    let amountToPay = 0;
    Object.keys(feeAmounts).forEach(type => {
      const row = document.getElementById(`${type}-fee`);

      if (row && row.style.display !== "none") {
        totalFee += feeAmounts[type];
  
        const feeData = fees.find(fee => fee.type.toLowerCase().includes(type));
        const isUnpaid = feeData?.status?.toLowerCase() === "unpaid";
  
        if (isUnpaid) {
          amountToPay += feeData.amount || 0;
        }
      }
    });

    document.querySelector(".total-fee").innerText = `Total Fee: ₹${totalFee.toLocaleString()}`;
    document.querySelector(".to-pay").innerText = `Amount to Pay: ₹${amountToPay.toLocaleString()}`;
    document.querySelector(".total-amount-upi strong").innerText = `₹${amountToPay.toLocaleString()}`;
    document.querySelector(".total-amount-credit strong").innerText = `₹${amountToPay.toLocaleString()}`;

    const proceedButton = document.querySelector(".proceed-payment");
    const payButton = document.querySelector(".pay-btn");
  
    const enable = amountToPay > 0;
    proceedButton.style.background = enable ? "#ff4d4d" : "#818181";
    payButton.style.background = enable ? "#FF6F61" : "#818181";
    proceedButton.style.cursor = enable ? "pointer" : "not-allowed";
    payButton.style.cursor = enable ? "pointer" : "not-allowed";
    proceedButton.disabled = !enable;
    payButton.disabled = !enable;
}

function showPaymodes() {
    const paymentType = document.getElementById("pay-options").value;
    const upiSection = document.getElementById("upi");
    const creditCardSection = document.getElementById("credit-card");

    upiSection.style.display = "none";
    creditCardSection.style.display = "none";

    if (paymentType === "upi") {
        upiSection.style.display = "flex";
        gsap.fromTo(upiSection,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5 }
        );
    } else if (paymentType === "credit-card") {
        creditCardSection.style.display = "flex";
        gsap.fromTo(creditCardSection,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5 }
        );
    }
}

function showPayments() {
    const paymentContainer = document.querySelector(".fee-details-right");
    const feeHeadRight = document.querySelector(".fee-head-right");

    if (paymentContainer) {
        paymentContainer.style.display = "flex";
    }

    if (feeHeadRight) {
        feeHeadRight.style.display = "flex";
    }

    const feeDetailsLeft = document.querySelector(".fee-details-left");
    feeDetailsLeft.style.height = "25vh";
}

function handleCustomPayment(method) {
    let totalDue = 0;
    let enteredAmount = 0;
  
    if (method === "upi") {
      totalDue = parseInt(document.querySelector(".total-amount-upi strong").innerText.replace(/[₹,]/g, ""));
      enteredAmount = parseInt(document.getElementById("upi-willing-amount").value);
  
      if (isNaN(enteredAmount) || enteredAmount <= 0) {
        feeToast.error({message: "Please enter a valid amount.",className: 'fee-toast-error'});
        return;
    }
    if (enteredAmount > totalDue) {
          feeToast.error({message: "Entered amount exceeds the total amount due.",className: 'fee-toast-error'});
          return;
        }
        
        feeToast.success({message: `Successfully paid ₹${enteredAmount.toLocaleString()} via UPI! 🎉`,className: 'fee-toast-success'});
    }
  
    else if (method === "credit") {
      totalDue = parseInt(document.querySelector(".total-amount-credit strong").innerText.replace(/[₹,]/g, ""));
      enteredAmount = parseInt(document.getElementById("credit-willing-amount").value);
  
      const cardNumber = document.getElementById("card-number").value.trim();
      const expiry = document.getElementById("expiry").value.trim();
      const cvv = document.getElementById("cvv").value.trim();
  
      if (isNaN(enteredAmount) || enteredAmount <= 0) {
        feeToast.error({message: "Please enter a valid amount.",className: 'fee-toast-error'});
        return;
      }
  
      if (enteredAmount > totalDue) {
        feeToast.error({message: "Entered amount exceeds the total amount due.",className: 'fee-toast-error'});
        return;
      }
  
      if (!cardNumber || cardNumber.length < 16) {
        feeToast.error({message: "Please enter a valid 16-digit card number.",className: 'fee-toast-error'});
        return;
    }
    
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        feeToast.error({message: "Please enter a valid expiry date in MM/YY format.",className: 'fee-toast-error'});
        return;
    }
    
    if (!cvv || !/^\d{3}$/.test(cvv)) {
          feeToast.error({message: "Please enter a valid 3-digit CVV.",className: 'fee-toast-error'});
        return;
      }
      feeToast.success({message: `Successfully paid ₹${enteredAmount.toLocaleString()} via Credit Card 💳!`,className: 'fee-toast-success'});
    }

    const updatedFees = [];
    const originalEnteredAmount = enteredAmount;
  
    ["college", "transport", "hostel"].forEach(type => {
        const row = document.getElementById(`${type}-fee`);
        if (row) {
          const amountText = row.querySelector("td:nth-child(2)").textContent.replace(/,/g, "");
          const amount = parseInt(amountText) || 0;
          const status = row.querySelector(".status").innerText.toLowerCase();
      
          if (status === "unpaid" && enteredAmount > 0 && amount > 0) {
            if (enteredAmount >= amount) {
              updatedFees.push({ type: capitalize(type), amount: 0, status: "paid" });
              enteredAmount -= amount;
            } else {
              updatedFees.push({ type: capitalize(type), amount: amount - enteredAmount, status: "unpaid" });
              enteredAmount = 0;
            }
          } else {
            updatedFees.push({ type: capitalize(type), amount, status });
          }
        }
      });      
    
    console.log(JSON.stringify({ fees: updatedFees }));
    fetch(`http://localhost:3000/update-fee-details/${shortRoll}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fees: updatedFees })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Updated in DB:", data.message);
        fetchFees(shortRoll); 
      })
      .catch(err => {
        console.error("Error updating DB:", err);
        alert("Something went wrong while updating payment. Please try again.");
      });
  
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainbar = document.querySelector('.mainbar');

    sidebar.classList.toggle('active');
    mainbar.classList.toggle('hidden');
}