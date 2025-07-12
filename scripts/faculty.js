// <--------------------Toast-------------------->

const attendanceToast = new Notyf({
    position: {
      x: 'center',
      y: 'top'    
    }
  });

const feeToast = new Notyf({
    position: {
      x: 'right',
      y: 'top'    
    }
  });

const recordsToast = new Notyf({
    position: {
      x: 'right',
      y: 'top'    
    }
  });

const announcementToast = new Notyf({
    position: {
      x: 'center',
      y: 'top'    
    }
  });

const assignmentToast = new Notyf({
    position: {
      x: 'center',
      y: 'top'    
    }
  });
  

// <--------------------Section Name-------------------->
const sectionName = new URLSearchParams(window.location.search).get("section") || "it2";

// <--------------------Total Students-------------------->

let TotStudents = [];

if (sectionName === "it1") {
    TotStudents = [...Array(70).keys()].map(i => (i + 1).toString())
        .concat([...Array(7).keys()].map(i => (301 + i).toString()));

} else if (sectionName === "it2") {
    TotStudents = [...Array(67).keys()].map(i => (71 + i).toString())
        .concat([...Array(7).keys()].map(i => (308 + i).toString()));

} else if (sectionName === "it3") {
    TotStudents = [...Array(70).keys()].map(i => (138 + i).toString())
        .concat([...Array(6).keys()].map(i => (315 + i).toString()));

} else {
    console.log("Invalid Section Name");
}

const batchData = {
    "Batch-1": TotStudents.slice(0, 26),
    "Batch-2": TotStudents.slice(26, 51),
    "Batch-3": TotStudents.slice(51)
};

console.log("Batches:", batchData);

// <--------------------Total Subjects-------------------->

const subjects = [
    "PQT : Probability and Queueing Theory",
    "DCCST : DC Circuits Sensors and Transducers",
    "DBMS : Database Management Systems",
    "DAA : Design and Analysis of Algorithms",
    "EEA : Engineering Economics and Accountancy",
    "ES : Environmental Science",
    "PE - 1 : Professional Elective - 1",
    "DBMS Lab : Database Management Systems Lab",
    "ALG Lab : Algorithms Lab",
    "MP-I : Mini Project – I",
    "MENTORING : MENTORING"
];

// <--------------------Show Sections-------------------->
let db;

function showSection(section) {
    fetch(`sections/faculty/${section}.html`)
        .then(response => response.text())
        .then(data => {
            document.getElementById("mainbar").innerHTML = data;

            requestAnimationFrame(() => {
                if (section === "Fees") loadFeesSection();
                if (section === "announcements") loadAnnouncements();
                if (section === "records") recordsLoad();
                if (section === "assignments") {
                    if (!db) {
                        openDatabase(() => {
                            getAssignmentsFromDB();
                            AssignmentsFunction();
                        });
                    } else {
                        getAssignmentsFromDB();
                        AssignmentsFunction();
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error loading section:", error);
            document.getElementById("mainbar").innerHTML = `<h2>Error Loading ${section}</h2>`;
        });
}

// <--------------------Logout-------------------->

function logout() {
    window.location.href = "index.html";
}

function formatRollNumber(roll) {
    return `160123737${String(roll).padStart(3, '0')}`;
}

// <--------------------Attendance-------------------->

let rollNumbers = [];
let attendance = {};

function selectType(type) {
    const rollNumbersDiv = document.getElementById('rollNumbers');
    const batchSelect = document.getElementById('batch-select');
    const subjectSelect = document.getElementById('subject-dropdown');
    rollNumbersDiv.innerHTML = '';

    if (!subjectSelect.value) {
        attendanceToast.error({message: "Select a subject",className: "attendance-toast"});
        return;
    }

    document.getElementById('absenteesList').innerHTML = '';

    if (type === "class") {
        batchSelect.value = "";
        rollNumbers = [...TotStudents];
    } else if (type === "batch") {
        const selectedBatch = batchSelect.value;
        rollNumbers = batchData[selectedBatch] || [];
    }

    rollNumbers.forEach(roll => {
        const rollNumberDiv = document.createElement('div');
        rollNumberDiv.className = 'roll-number';
        rollNumberDiv.textContent = roll;
        rollNumberDiv.setAttribute('data-roll', roll);
        rollNumberDiv.addEventListener('click', () => markAttendance(roll));
        rollNumbersDiv.appendChild(rollNumberDiv);
    });
}

// <--------------------Attendance Marking-------------------->

function markAttendance(roll) {
    const rollNumberDiv = document.querySelector(`.roll-number[data-roll="${roll}"]`);

    if (!attendance[roll]) {
        attendance[roll] = 'present';
    } else if (attendance[roll] === 'present') {
        attendance[roll] = 'absent';
    } else {
        attendance[roll] = 'present';
    }

    gsap.to(rollNumberDiv, {
        scale: 0,
        duration: 0.1,
        onComplete: () => {
            updateRollNumberDisplay(roll);
            gsap.to(rollNumberDiv, {
                scale: 1,
                duration: 0.1
            })
        }
    })
}

function updateRollNumberDisplay(roll) {
    const rollNumberDivs = document.querySelectorAll('.roll-number');
    rollNumberDivs.forEach(div => {
        if (div.textContent === roll) {
            div.style.backgroundColor = attendance[roll] === 'present' ? '#4CAF50' : '#FF0000';
        }
    });
}

async function finalizeAttendance() {
    rollNumbers.forEach(roll => {
        if (!(roll in attendance)) {
            attendance[roll] = 'Absent';
        }
    });

    const selectedSubject = document.getElementById('subject-dropdown');

    if (!selectedSubject.value) {
        attendanceToast.error({message: "Please select a subject!",className: "attendance-toast"});
        return;
    }

    const attendanceData = {
        date: new Date().toISOString().split('T')[0],
        subject: selectedSubject.value,
        section: sectionName,
        students: rollNumbers.map(roll => ({
            rollNumber: formatRollNumber(roll),
            status: attendance[roll]
        }))
    };

    const absentees = Object.keys(attendance).filter(roll => attendance[roll] === 'Absent');
    const absenteesListDiv = document.getElementById('absenteesList');
    absenteesListDiv.innerHTML = `<h3>Absentees: ${absentees.join(', ')}</h3>`;

    try {
        const response = await fetch('http://localhost:3000/submit-attendance', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attendanceData)
        });

        const result = await response.json();
    } catch (error) {
        console.error("Error submitting attendance:", error);
    }

    rollNumbers.forEach(updateRollNumberDisplay);
    document.getElementById("clear-button").style.display = "block";
}

function clearAttendance() {
    attendance = {};
    document.getElementById('absenteesList').innerHTML = '';
    document.getElementById('rollNumbers').innerHTML = '';
    document.getElementById("clear-button").style.display = "none";
}

/*<---------------GSAP--------------->*/

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

function BreakText() {
    var h1tag = document.getElementById("heading")
    var h1Text = h1tag.textContent;
    var splittedText = h1Text.split("");
    var clutter = ""
    splittedText.forEach(function (elem) {
        clutter += `<span>${elem}</span>`
    })
    h1tag.innerHTML = clutter;
}
BreakText();
gsap.from("#heading span", {
    y: 100,
    opacity: 0,
    duration: 0.5,
    delay: 0.2,
    stagger: 0.1
})

/*<---------------Fees--------------->*/

function loadFeesSection() {
    const rollContainer = document.getElementById('roll-container');
    const feeDetailsDiv = document.getElementById('fee-details');
    const backBtn = document.getElementById('back-btn');

    for (const i of TotStudents) {
        createRollDiv(i);
    }

    function createRollDiv(rollNo) {
        const rollDiv = document.createElement('div');
        rollDiv.classList.add('roll');
        rollDiv.textContent = `Roll No: ${rollNo}`;
        rollDiv.addEventListener('click', () => showFeeDetails(rollNo));
        rollContainer.appendChild(rollDiv);
    }

    function showFeeDetails(rollNo) {
        const feeHeading = document.querySelector('.fee-heading h1');
        feeHeading.textContent = `Fee details for Roll No: ${rollNo}`;

        fetch(`http://localhost:3000/get-fee-details/${rollNo}`)
            .then(response => response.json())
            .then(data => {
                renderFeeTable(data.fees);
                animateInFeeDetails();
            })
            .catch(err => console.error('Error fetching fee details:', err));
    }

    function renderFeeTable(fees) {
        const table = document.querySelector('.fee-table tbody');
        table.innerHTML = '';

        fees.forEach(fee => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${fee.type}</td>
                <td contenteditable="true">${fee.amount}</td>
                <td contenteditable="true" class="status ${fee.status.toLowerCase()}">${fee.status}</td>
            `;

            const amountCell = row.querySelector('td:nth-child(2)');
            const statusCell = row.querySelector('td:nth-child(3)');

            amountCell.addEventListener('input', () => {
                const amount = parseFloat(amountCell.textContent.trim()) || 0;
                const newStatus = amount > 0 ? 'Unpaid' : 'Paid';

                statusCell.textContent = newStatus;
                statusCell.classList.remove('paid', 'unpaid');
                statusCell.classList.add(newStatus.toLowerCase());
            });

            table.appendChild(row);
        });
    }

    function animateInFeeDetails() {
        gsap.to(rollContainer, {
            duration: 0.5,
            opacity: 0,
            y: -50,
            onComplete: () => {
                rollContainer.style.display = "none";
                feeDetailsDiv.classList.remove('hidden');
                gsap.fromTo(feeDetailsDiv,
                    { opacity: 0, y: 50 },
                    { duration: 0.5, opacity: 1, y: 0 }
                );
            }
        });
    }

    backBtn.addEventListener('click', () => {
        gsap.to(feeDetailsDiv, {
            duration: 0.5,
            opacity: 0,
            y: 50,
            onComplete: () => {
                feeDetailsDiv.classList.add('hidden');
                rollContainer.style.display = "grid";
                gsap.fromTo(rollContainer,
                    { opacity: 0, y: -50 },
                    { duration: 0.5, opacity: 1, y: 0 }
                );
            }
        });
    });

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveFeeDetails);
}

function saveFeeDetails() {
    const rows = document.querySelectorAll('.fee-table tbody tr');
    const fees = [];

    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        const type = cells[0].textContent.trim();
        const amountText = cells[1].textContent.trim();

        if (amountText === '' || isNaN(amountText)) {
            feeToast.error({message: `Amount for "${type}" cannot be empty or invalid.`,className: 'fee-toast-error'});
            return;
        }

        const amount = parseFloat(amountText);
        const status = amount > 0 ? 'unpaid' : 'paid';

        fees.push({ type, amount, status });
    }

    const rollNo = document.querySelector('.fee-heading h1').textContent.split(': ')[1];

    fetch(`http://localhost:3000/update-fee-details/${rollNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fees })
    })
        .then(response => response.json())
        .then(data => {
            feeToast.success({message: 'Fee details updated successfully!',className: 'fee-toast-success'});
            console.log(data);
        })
        .catch(error => {
            feeToast.error({message: 'Failed to update fee details.',className: 'fee-toast-error'});
            console.error('Error:', error);
        });
}

/*<---------------Records--------------->*/

function recordsLoad() {
    const subjectDropdown = document.getElementById("subject-records-dropdown");
    const labDropdown = document.getElementById("lab-records-dropdown");

    if (subjectDropdown) {
        subjectDropdown.addEventListener("change", async function () {
            const subject = this.value;
            if (subject) {
                document.getElementById("subject-cie-table").style.display = "block";
                document.getElementById("lab-cie-table").style.display = "none";
                await loadSubjectCIE(subject);
            }
        });

        if (subjectDropdown.value) {
            document.getElementById("subject-cie-table").style.display = "block";
            document.getElementById("lab-cie-table").style.display = "none";
            loadSubjectCIE(subjectDropdown.value);
        }
    }

    if (labDropdown) {
        labDropdown.addEventListener("change", async function () {
            const lab = this.value;
            if (lab) {
                document.getElementById("lab-cie-table").style.display = "block";
                document.getElementById("subject-cie-table").style.display = "none";
                await loadLabCIE(lab);
            }
        });

        if (labDropdown.value) {
            document.getElementById("lab-cie-table").style.display = "block";
            document.getElementById("subject-cie-table").style.display = "none";
            loadLabCIE(labDropdown.value);
        }
    }
}

function moveSlider(index, btn) {
    const slider = document.querySelector('.record-slider');
    const buttons = document.querySelectorAll('.record-header button');

    slider.style.transform = `translateX(${index * 100}%)`;

    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const subjectCIE = document.querySelector('.subject-cie-section');
    const fullCIE = document.querySelector('.full-cie-table-section');

    if (index === 0) {
        subjectCIE.style.display = 'block';
        fullCIE.style.display = 'none';

        const subjectDropdown = document.getElementById("subject-records-dropdown");
        const labDropdown = document.getElementById("lab-records-dropdown");

        if (subjectDropdown.value) {
            loadSubjectCIE(subjectDropdown.value);
            document.getElementById("subject-cie-table").style.display = "block";
            document.getElementById("lab-cie-table").style.display = "none";
        } else if (labDropdown.value) {
            loadLabCIE(labDropdown.value);
            document.getElementById("lab-cie-table").style.display = "block";
            document.getElementById("subject-cie-table").style.display = "none";
        }
    } else if (index === 1) {
        subjectCIE.style.display = 'none';
        fullCIE.style.display = 'block';
        populateCieTable();
        console.log("frequent")
    }
}

async function loadSubjectCIE(subject) {

    const tbody = document.querySelector("#subject-cie-table tbody");
    tbody.innerHTML = "";


    for (const roll of TotStudents) {
        const res = await fetch(`http://localhost:3000/get-subject-cie/${roll}/${encodeURIComponent(subject)}`);
        const s = await res.json();

        const rowHTML = `
        <tr>
            <td class="roll">${s.rollNo}</td>
            <td contenteditable class="slip1">${s.sliptests[0]}</td>
            <td contenteditable class="slip2">${s.sliptests[1]}</td>
            <td contenteditable class="slip3">${s.sliptests[2]}</td>
            <td class="slipAvg">0</td>
            <td contenteditable class="assign1">${s.assignments[0]}</td>
            <td contenteditable class="assign2">${s.assignments[1]}</td>
            <td class="assignAvg">0</td>
            <td contenteditable class="mid1">${s.mids[0]}</td>
            <td contenteditable class="mid2">${s.mids[1]}</td>
            <td class="midAvg">0</td>
            <td contenteditable class="attendance">${s.attendance}</td>
            <td class="totalCIE">0</td>
            <td><button onclick="saveSubjectRow(this, '${subject}')">Save</button></td>
        </tr>`;

        tbody.insertAdjacentHTML("beforeend", rowHTML);
    }

    requestAnimationFrame(() => {
        document.querySelectorAll("#subject-cie-table tbody tr").forEach(updateSubjectRow);
        setupSubjectLiveUpdate();
    });
}

function setupSubjectLiveUpdate() {
    document.querySelectorAll("#subject-cie-table tbody tr").forEach(row => {
        row.querySelectorAll("[contenteditable]").forEach(cell => {
            cell.addEventListener("input", () => updateSubjectRow(row));
        });
    });
}

function updateSubjectRow(row) {
    const get = cls => parseInt(row.querySelector("." + cls)?.innerText) || 0;

    const slips = [get("slip1"), get("slip2"), get("slip3")];
    const assigns = [get("assign1"), get("assign2")];
    const mids = [get("mid1"), get("mid2")];
    const attendanceMarks = get("attendance");

    const slipAvg = averageTopTwo(slips);
    const assignAvg = average(assigns);
    const midAvg = average(mids);
    const total = slipAvg + assignAvg + midAvg + attendanceMarks;

    row.querySelector(".slipAvg").innerText = slipAvg;
    row.querySelector(".assignAvg").innerText = assignAvg;
    row.querySelector(".midAvg").innerText = midAvg;
    row.querySelector(".totalCIE").innerText = total;
}

async function saveSubjectRow(button, subject) {
    const row = button.closest("tr");
    const rollNo = parseInt(row.querySelector(".roll").innerText);

    const sliptests = [".slip1", ".slip2", ".slip3"].map(cls => parseInt(row.querySelector(cls).innerText));
    const assignments = [".assign1", ".assign2"].map(cls => parseInt(row.querySelector(cls).innerText));
    const mids = [".mid1", ".mid2"].map(cls => parseInt(row.querySelector(cls).innerText));
    const attendance = parseInt(row.querySelector(".attendance").innerText);

    const res = await fetch(`http://localhost:3000/update-subject-cie/${rollNo}/${encodeURIComponent(subject)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sliptests, assignments, mids, attendance })
    });

    const data = await res.json();
    recordsToast.success({message: data.message || "Subject CIE updated!",className: "records-toast"});    

}

async function loadLabCIE(lab) {
    const tbody = document.querySelector("#lab-cie-table tbody");
    tbody.innerHTML = "";

    for (const roll of TotStudents) {
        const res = await fetch(`http://localhost:3000/get-lab-cie/${roll}/${encodeURIComponent(lab)}`);
        const s = await res.json();

        const rowHTML = `
        <tr>
            <td class="roll">${s.rollNo}</td>
            <td contenteditable class="int1">${s.internals[0]}</td>
            <td contenteditable class="int2">${s.internals[1]}</td>
            <td class="intAvg">0</td>
            <td contenteditable class="record">${s.record}</td>
            <td class="totalCIE">0</td>
            <td><button onclick="saveLabRow(this, '${lab}')">Save</button></td>
        </tr>`;

        tbody.insertAdjacentHTML("beforeend", rowHTML);
    }

    requestAnimationFrame(() => {
        document.querySelectorAll("#lab-cie-table tbody tr").forEach(updateLabRow);
        setupLabLiveUpdate();
    });
}

function setupLabLiveUpdate() {
    document.querySelectorAll("#lab-cie-table tbody tr").forEach(row => {
        row.querySelectorAll("[contenteditable]").forEach(cell => {
            cell.addEventListener("input", () => updateLabRow(row));
        });
    });
}

function updateLabRow(row) {
    const get = cls => parseInt(row.querySelector("." + cls)?.innerText) || 0;
    const intAvg = average([get("int1"), get("int2")]);
    const total = intAvg + get("record");

    row.querySelector(".intAvg").innerText = intAvg;
    row.querySelector(".totalCIE").innerText = total;
}

async function saveLabRow(button, lab) {
    const row = button.closest("tr");
    const rollNo = parseInt(row.querySelector(".roll").innerText);
    const internals = [".int1", ".int2"].map(cls => parseInt(row.querySelector(cls).innerText));
    const record = parseInt(row.querySelector(".record").innerText);

    const res = await fetch(`http://localhost:3000/update-lab-cie/${rollNo}/${encodeURIComponent(lab)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internals, record })
    });

    const data = await res.json();
    recordsToast.success({message: data.message || "Lab CIE updated!",className: "records-toast"});
}

function average(arr) {
    const valid = arr.filter(n => !isNaN(n));
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function averageTopTwo(arr) {
    const sorted = arr.sort((a, b) => b - a);
    return Math.round((sorted[0] + sorted[1]) / 2);
}

const subjectsAndLabs = [
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

function createHeader() {
    const table = document.getElementById("full-cie-table");
    const thead = table.querySelector("thead");
    thead.innerHTML = "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<th>Roll No</th>`;
    for (const sub of subjectsAndLabs) {
        tr.innerHTML += `<th>${sub}</th>`;
    }
    tr.innerHTML += `<th>Total</th>`;
    thead.appendChild(tr);
}

async function populateCieTable() {
    const table = document.getElementById("full-cie-table");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";
    createHeader();

    for (const roll of TotStudents) {
        const res = await fetch(`http://localhost:3000/get-total-cie/${roll}`);
        const data = await res.json();

        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${data.rollNo}</td>`;

        let total = 0;
        for (const sub of subjectsAndLabs) {
            const cie = data[sub] || 0;
            total += cie;
            tr.innerHTML += `<td>${cie}</td>`;
        }

        tr.innerHTML += `<td><strong>${total}</strong></td>`;
        tbody.appendChild(tr);
    }
}

/*<---------------SideBar--------------->*/

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainbar = document.getElementById('mainbar');
    const isVisible = sidebar.classList.contains('active');

    if (isVisible) {
        sidebar.classList.remove('active');
        mainbar.classList.remove('hidden');
    } else {
        sidebar.classList.add('active');
        mainbar.classList.add('hidden');
    }
}

function handleSidebarButtonClick() {
    const sidebar = document.getElementById('sidebar');
    const mainbar = document.getElementById('mainbar');

    sidebar.classList.remove('active');
    mainbar.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sidebar button').forEach(button => {
        button.addEventListener('click', handleSidebarButtonClick);
    });
});

/*<---------------Announcement--------------->*/

function togglePostButton() {
    let dropSubject = document.getElementById("subjectDropdown").value;
    let inputField = document.getElementById("announcementInput");
    let postButton = document.getElementById("postButton");

    if (dropSubject !== "") {
        inputField.disabled = false;
        postButton.disabled = false;
    } else {
        inputField.disabled = true;
        postButton.disabled = true;
    }
}

function addAnnouncement() {
    let input = document.getElementById("announcementInput").value.trim();
    let section = document.getElementById("current-section").value;
    let subject = document.getElementById("subjectDropdown").value;

    if (input === "" || section === "" || subject === "") {
        announcementToast.error({message: "Please fill out all fields!",className: "announcement-toast-error"});     
        return;
    }

    let newAnnouncement = {
        date: new Date().toISOString(),
        subject: subject,
        section: section,
        message: input
    };

    fetch("http://localhost:3000/submit-announcement", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newAnnouncement)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Announcement added:", data);
            announcementToast.success({message: "Announcement added successfully!",className: "announcement-toast-success"});
            document.getElementById("announcementInput").value = "";
            loadAnnouncements();
        })
        .catch(error => console.error("Error adding announcement:", error));
}

function loadAnnouncements() {

    let sectionInput = document.getElementById("current-section");
    sectionInput.value = sectionName.toUpperCase();

    fetch("http://localhost:3000/get-announcements")
        .then(response => response.json())
        .then(data => {
            let announcementList = document.getElementById("announcementsList");

            announcementList.innerHTML = "";

            let filteredAnnouncements = data.filter(announcement => announcement.section.toLowerCase() === sectionName.toLowerCase());

            if (filteredAnnouncements.length === 0) {
                announcementList.innerHTML = "<p>No announcements yet.</p>";
                return;
            }

            filteredAnnouncements.forEach(announcement => {
                let announcementDiv = document.createElement("div");
                announcementDiv.classList.add("announcement-item");
                announcementDiv.innerHTML = `
                    <p>${announcement.message}</p>
                    <small>
                        ${new Date(announcement.date).toLocaleString()} | 
                        Section: <strong>${announcement.section.toUpperCase()}</strong> | 
                        Subject: ${announcement.subject}
                    </small>
                    <button onclick="deleteAnnouncement('${announcement._id}', '${sectionName}')">
                        <img src="assets/delete.svg" alt="Delete">
                    </button>
                `;
                announcementList.appendChild(announcementDiv);
            });
        })
        .catch(error => console.error("Error loading announcements:", error));
}

function deleteAnnouncement(id, sectionName) {
    fetch(`http://localhost:3000/delete-announcement/${id}`, { method: "DELETE" })
        .then(response => response.json())
        .then(() => {
            announcementToast.error({message: "Announcement deleted successfully!",className: "announcement-toast-error"});
            loadAnnouncements(sectionName);
        })
        .catch(error => console.error("Error deleting announcement:", error));
}

/*<---------------Assignments--------------->*/

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

function createAssignment() {
    if (!db) {
        console.error("Database not opened yet.");
        return;
    }

    const title = document.getElementById('assignmentTitle').value;
    const description = document.getElementById('assignmentDesc').value;
    const fileInput = document.getElementById('assignmentFile');
    const file = fileInput.files[0];

    if (!title || !description) {
        assignmentToast.error({message: 'Please fill in both the title and description.',className: 'assignment-toast'});
          
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const fileData = event.target.result;

        const assignment = {
            id: Date.now(),
            title,
            sectionName,
            description,
            file: fileData,
            fileName: file ? file.name : null,
            submissions: []
        };

        const transaction = db.transaction(["assignments"], "readwrite");
        const store = transaction.objectStore("assignments");
        const request = store.add(assignment);

        request.onsuccess = function () {
            getAssignmentsFromDB();
        };

        request.onerror = function () {
            console.error("Error saving assignment.");
        };
    };

    if (file) {
        reader.readAsDataURL(file);
    } else {
        const assignment = {
            id: Date.now(),
            title,
            sectionName,
            description,
            file: null,
            fileName: null,
            submissions: []
        };

        const transaction = db.transaction(["assignments"], "readwrite");
        const store = transaction.objectStore("assignments");
        store.add(assignment).onsuccess = function () {
            console.log("Assignment saved without file!");
            getAssignmentsFromDB();
        };
    }
    clearAssignmentForm();
}

function getAssignmentsFromDB() {
    const transaction = db.transaction(["assignments"], "readonly");
    const store = transaction.objectStore("assignments");
    const request = store.getAll();

    request.onsuccess = function (event) {
        assignments = event.target.result;
        updateAssignmentsList();
    };

    request.onerror = function () {
        console.error("Error retrieving assignments.");
    };
}

function updateAssignmentsList() {
    const assignmentItems = document.getElementById('assignmentItems');
    assignmentItems.innerHTML = '';

    const filteredAssignments = assignments.filter(assignment => assignment.sectionName === sectionName);

    filteredAssignments.forEach(assignment => {
        const li = document.createElement('li');
        li.className = 'assignment-item';
        li.innerHTML = `${assignment.title}`;
        li.addEventListener('click', () => showAssignmentDetails(assignment.id));
        assignmentItems.appendChild(li);
    });
}

function showAssignmentDetails(id) {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    const createSection = document.getElementById('create-assignment');
    const listSection = document.getElementById('assignments-list');
    const detailsSection = document.getElementById('assignment-details');
    const info = document.getElementById('assignment-info');
    const count = document.getElementById('submitted-count');
    const submissionsList = document.getElementById('submissions-list');
    const submissionSection = document.querySelector('.assignments-submissions');

    submissionsList.innerHTML = '';

    let fileHTML = "<p>No file attached</p>";
    if (assignment.file) {
        console.log(assignment.file)
        const byteCharacters = atob(assignment.file.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });

        const fileURL = URL.createObjectURL(blob);

        fileHTML = `<a class="assignment-download" href="${fileURL}" download="${assignment.fileName}">📂 Download Assignment</a>`;
    }

    info.innerHTML = `
        <div><b>Title:</b><p>${assignment.title}</p></div>
        <div><b>Description:</b><p>${assignment.description}</p></div>
        <div><b>File:</b>${fileHTML}</div>
    `;

    const request = indexedDB.open('studentAssignmentsDB', 1);
    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['assignments'], 'readonly');
        const store = transaction.objectStore('assignments');
        const submissions = store.getAll();

        submissions.onsuccess = function () {
            const submittedAssignments = submissions.result;
            let submittedCount = 0;

            submittedAssignments.forEach(submission => {
                if (submission.section === assignment.sectionName && submission.assignmentName === assignment.title) {
                    const li = document.createElement('li');

                    const fileLink = `<a href="${submission.file}" target="_blank" download="${submission.fileName}">${submission.fileName}</a>`;

                    li.innerHTML = `<div><span><b>Roll No:</b> ${submission.rollNumber}</span>.<span><b>File:</b> ${fileLink}</span></div>`;
                    submissionsList.appendChild(li);
                    submittedCount++;
                }
            });

            count.textContent = submittedCount;
        };

        submissions.onerror = function () {
            console.error('Error fetching submissions from IndexedDB.');
        };
    };

    request.onerror = function (error) {
        console.error('Error opening IndexedDB:', error);
    };

    gsap.to([createSection, listSection], {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            createSection.style.display = 'none';
            listSection.style.display = 'none';
        }
    });

    detailsSection.style.display = 'block';
    submissionSection.style.display = 'block';
    gsap.fromTo([detailsSection, submissionSection], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });

    document.querySelector(".delete-assignments button").onclick = function () {
        deleteAssignment(assignment.id);
    };
}

function deleteAssignment(assignmentId) {
    if (!db) {
        console.error("Database not opened yet.");
        return;
    }

    const transaction = db.transaction("assignments", "readwrite");
    const store = transaction.objectStore("assignments");

    const deleteRequest = store.delete(assignmentId);

    deleteRequest.onsuccess = function () {
        console.log(` Assignment ${assignmentId} deleted successfully`);

        assignments = assignments.filter(a => a.id !== assignmentId);

        updateAssignmentsList();
        assignmentBack();
    };

    deleteRequest.onerror = function (event) {
        console.error(" Error deleting assignment:", event.target.error);
    };
}

function assignmentBack() {
    const createSection = document.getElementById('create-assignment');
    const listSection = document.getElementById('assignments-list');
    const detailsSection = document.getElementById('assignment-details');
    const submissionSection = document.querySelector('.assignments-submissions');

    gsap.to([detailsSection, submissionSection], {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            submissionSection.style.display = 'none';
            detailsSection.style.display = 'none';
            createSection.style.display = 'flex';
            listSection.style.display = 'flex';
            gsap.fromTo([createSection, listSection], { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 });
        }
    });
}

function clearAssignmentForm() {
    document.getElementById('assignmentTitle').value = '';
    document.getElementById('assignmentDesc').value = '';
    document.getElementById('assignmentFile').value = '';
}

function toggleUploadButton() {
    const title = document.getElementById('assignmentTitle').value;
    const description = document.getElementById('assignmentDesc').value;
    document.getElementById('uploadAssignment').disabled = !(title && description);
}

function AssignmentsFunction() {
    setTimeout(() => {
        // if (!db) {
        //     openDatabase(() => {
        //         getAssignmentsFromDB();
        //     });
        // } else {
        //     getAssignmentsFromDB();
        // }

        const titleInput = document.getElementById('assignmentTitle');
        const descInput = document.getElementById('assignmentDesc');

        if (titleInput && descInput) {
            titleInput.addEventListener('input', toggleUploadButton);
            descInput.addEventListener('input', toggleUploadButton);
        } else {
            console.warn("Assignment form elements not found.");
        }
    }, 100);
}