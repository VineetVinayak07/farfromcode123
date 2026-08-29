// ========================================
// CIVICEYE AI JAVASCRIPT
// ========================================


// DEFAULT LOCATION
// New Delhi coordinates are used initially.
// The location changes when the user presses
// "Use My Location".

let userLatitude = 28.6139;
let userLongitude = 77.2090;

let map;
let userMarker;
let radiusCircle;


// ========================================
// INITIALIZE MAP
// ========================================

function initializeMap() {

    map = L.map("map").setView(
        [userLatitude, userLongitude],
        15
    );


    // OpenStreetMap tiles

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }
    ).addTo(map);


    // User marker

    userMarker = L.marker(
        [userLatitude, userLongitude]
    ).addTo(map);

    userMarker.bindPopup(
        "<b>You are here</b>"
    );


    // Radius circle

    radiusCircle = L.circle(
        [userLatitude, userLongitude],
        {
            radius: 1000,
            color: "#1260e8",
            fillColor: "#1260e8",
            fillOpacity: 0.08
        }
    ).addTo(map);


    // Civic issue markers

    createIssueMarkers();
}


// ========================================
// ISSUE MARKERS
// ========================================

function createIssueMarkers() {

    const issues = [

        {
            lat: userLatitude + 0.003,
            lng: userLongitude + 0.002,
            title: "Pothole on MG Road",
            type: "Pothole"
        },

        {
            lat: userLatitude - 0.002,
            lng: userLongitude + 0.003,
            title: "Garbage Overflow",
            type: "Garbage"
        },

        {
            lat: userLatitude + 0.001,
            lng: userLongitude - 0.004,
            title: "Streetlight Not Working",
            type: "Streetlight"
        }

    ];


    issues.forEach(issue => {

        let marker = L.marker([
            issue.lat,
            issue.lng
        ]).addTo(map);


        marker.bindPopup(`
            <b>${issue.title}</b>
            <br>
            Issue type: ${issue.type}
        `);

    });
}


// ========================================
// GET USER LOCATION
// ========================================

function getUserLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by your browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;


            // Move map

            map.setView(
                [userLatitude, userLongitude],
                16
            );


            // Move marker

            userMarker.setLatLng([
                userLatitude,
                userLongitude
            ]);


            // Move radius

            radiusCircle.setLatLng([
                userLatitude,
                userLongitude
            ]);


            userMarker
                .bindPopup("<b>Your current location</b>")
                .openPopup();


            alert(
                "Your location has been detected!"
            );

        },


        function(error) {

            alert(
                "Unable to get your location. Please allow location permission."
            );

        }

    );
}


// ========================================
// CHANGE RADIUS
// ========================================

function changeRadius() {

    const radius =
        document.getElementById("radius").value;


    radiusCircle.setRadius(
        Number(radius)
    );
}


// ========================================
// REPORT MODAL
// ========================================

function openReport() {

    document
        .getElementById("reportModal")
        .classList.add("show");
}


function closeReport() {

    document
        .getElementById("reportModal")
        .classList.remove("show");
}


// ========================================
// SUBMIT REPORT
// ========================================

function submitReport() {

    const type =
        document.getElementById("issueType").value;

    const description =
        document.getElementById("description").value;


    if (description.trim() === "") {

        alert(
            "Please describe the issue."
        );

        return;
    }


    saveReport(type, description);


    alert(
        "Report submitted successfully!\n\n" +
        "Issue: " + type
    );


    closeReport();


    document.getElementById(
        "description"
    ).value = "";
}


// ========================================
// CATEGORY SELECTION
// ========================================

function selectIssue(issue) {

    document.getElementById(
        "issueType"
    ).value = issue;


    openReport();
}


// ========================================
// VIEW ALL CATEGORIES
// ========================================

function showAllCategories() {

    alert(
        "Categories:\n\n" +
        "• Potholes\n" +
        "• Garbage\n" +
        "• Streetlights\n" +
        "• Water Leakage\n" +
        "• Broken Roads\n" +
        "• Traffic Signals\n" +
        "• Other"
    );
}


// ========================================
// VIEW ALL ISSUES
// ========================================

function showAllIssues() {

    alert(
        "Showing all reported civic issues."
    );
}


// ========================================
// BOTTOM NAVIGATION
// ========================================

function navigate(page) {

    if (page === "home") {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    else if (page === "map") {

        document
            .getElementById("map")
            .scrollIntoView({
                behavior: "smooth"
            });

    }


}


// ========================================
// MENU
// ========================================

function openMenu() {

    alert(
        "Spot-fix Menu\n\n" +
        "Home\n" +
        "Map\n" +
        "My Reports\n" +
        "Notifications\n" +
        "Profile"
    );
}


// ========================================
// REPORT STORAGE (shared across pages)
// ========================================

const REPORTS_KEY = "spotfixReports";

const CATEGORY_ICON = {
    Pothole: "⚠️",
    Garbage: "🗑️",
    Streetlight: "💡",
    Other: "🛠️"
};

const CATEGORY_CLASS = {
    Pothole: "pothole",
    Garbage: "garbage",
    Streetlight: "streetlight",
    Other: "other"
};


function getSavedReports() {

    try {

        const raw = localStorage.getItem(REPORTS_KEY);

        return raw ? JSON.parse(raw) : [];

    } catch (err) {

        return [];
    }
}


function saveReport(type, description) {

    const reports = getSavedReports();

    reports.unshift({
        id: Date.now(),
        type: type,
        description: description,
        createdAt: new Date().toISOString(),
        status: "pending"
    });

    localStorage.setItem(
        REPORTS_KEY,
        JSON.stringify(reports)
    );
}


// ========================================
// MY REPORTS PAGE
// ========================================

function renderMyReportsPage() {

    const list = document.getElementById("justSubmittedList");
    const empty = document.getElementById("justSubmittedEmpty");

    if (!list) return;

    const reports = getSavedReports();

    if (reports.length === 0) {

        if (empty) empty.style.display = "block";

        return;
    }

    if (empty) empty.style.display = "none";

    list.innerHTML = reports.map(buildReportCardHTML).join("");
}


function buildReportCardHTML(report) {

    const icon = CATEGORY_ICON[report.type] || CATEGORY_ICON.Other;
    const iconClass = CATEGORY_CLASS[report.type] || CATEGORY_CLASS.Other;

    const statusLabel =
        report.status === "resolved" ? "Resolved" :
        report.status === "progress" ? "In Progress" :
        "Pending";

    return (
        '<div class="issue-card">' +
            '<div class="issue-thumb-icon ' + iconClass + '">' + icon + '</div>' +
            '<div class="issue-info">' +
                '<div class="issue-title">' + report.type + ' Report</div>' +
                '<div class="issue-meta">' + escapeHTML(report.description) + '</div>' +
            '</div>' +
            '<div class="issue-right">' +
                '<span class="status ' + report.status + '">' + statusLabel + '</span>' +
                '<small>' + timeAgo(report.createdAt) + '</small>' +
            '</div>' +
        '</div>'
    );
}


function timeAgo(isoString) {

    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return mins + "m ago";

    const hours = Math.floor(mins / 60);

    if (hours < 24) return hours + "h ago";

    const days = Math.floor(hours / 24);

    return days + "d ago";
}


function escapeHTML(str) {

    const div = document.createElement("div");

    div.textContent = str;

    return div.innerHTML;
}


// ========================================
// PROFILE PAGE
// ========================================

const AVATAR_KEY = "spotfixAvatar";


function renderProfilePage() {

    const avatarEl = document.getElementById("avatarPreview");

    if (!avatarEl) return;

    const savedAvatar = localStorage.getItem(AVATAR_KEY);

    if (savedAvatar) {

        setAvatarImage(savedAvatar);
    }

    const countEl = document.getElementById("reportsCount");

    if (countEl) {

        countEl.textContent = getSavedReports().length;
    }
}


function handleAvatarChange(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function() {

        localStorage.setItem(AVATAR_KEY, reader.result);

        setAvatarImage(reader.result);
    };

    reader.readAsDataURL(file);
}


function setAvatarImage(dataUrl) {

    const avatarEl = document.getElementById("avatarPreview");

    if (!avatarEl) return;

    avatarEl.style.backgroundImage = "url(" + dataUrl + ")";

    avatarEl.classList.add("has-image");
}


function profileAction(label) {

    alert(label + "\n\nThis feature is coming soon.");
}


function signOut() {

    const confirmed = confirm("Sign out of Spot-fix?");

    if (confirmed) {

        location.href = "index.html";
    }
}


// ========================================
// STATUS BAR CLOCK
// ========================================

function updateStatusClock() {

    const el = document.getElementById("statusTime");

    if (!el) return;

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    el.textContent = hours + ":" + minutes;
}


// ========================================
// START APPLICATION
// ========================================

window.onload = function() {

    if (document.getElementById("map")) {

        initializeMap();
    }

    renderMyReportsPage();
    renderProfilePage();

    updateStatusClock();
    setInterval(updateStatusClock, 15000);

};