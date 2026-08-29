/* =========================================================
   SPOTFIX HOME.JS
   Handles:
   - Map
   - GPS
   - 5–25 km range
   - Issue filtering
   - Report modal
   - Photo preview
   - Basic navigation
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const REPORT_KEY = "spotFixReports";
const SESSION_KEY = "spotFixSession";


/* =========================================================
   DEFAULT LOCATION
   Delhi is used until the user provides their location.
========================================================= */

const DEFAULT_LOCATION = {
    lat: 28.6139,
    lng: 77.2090
};


/* =========================================================
   APP STATE
========================================================= */

let map = null;
let userMarker = null;
let radiusCircle = null;

let issueMarkers = [];

let userLatitude = DEFAULT_LOCATION.lat;
let userLongitude = DEFAULT_LOCATION.lng;

let selectedRadius = 10000; // 10 km

let selectedPhoto = "";


/* =========================================================
   GET CURRENT USER
========================================================= */

function getSession() {

    try {

        return JSON.parse(
            localStorage.getItem(SESSION_KEY)
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   REPORT STORAGE
========================================================= */

function getReports() {

    try {

        const savedReports =
            JSON.parse(
                localStorage.getItem(REPORT_KEY)
            );


        if (
            Array.isArray(savedReports) &&
            savedReports.length > 0
        ) {

            return savedReports;

        }

    } catch (error) {

        console.log(
            "Could not read saved reports."
        );

    }


    /*
       Demo reports.
       These are only here so the map/list
       isn't empty during the presentation.
    */

    const demoReports = [

        {
            id: "demo-1",

            type: "Pothole",

            title: "Pothole on MG Road",

            description:
                "Large pothole affecting traffic.",

            lat: 28.6255,

            lng: 77.2099,

            status: "Pending",

            timestamp:
                Date.now() -
                (2 * 60 * 60 * 1000),

            image: "",

            reporterEmail:
                "demo@spotfix.app"

        },


        {
            id: "demo-2",

            type: "Garbage",

            title: "Garbage Overflow",

            description:
                "Public bin is overflowing.",

            lat: 28.6079,

            lng: 77.2147,

            status: "In Progress",

            timestamp:
                Date.now() -
                (4 * 60 * 60 * 1000),

            image: "",

            reporterEmail:
                "demo@spotfix.app"

        },


        {
            id: "demo-3",

            type: "Streetlight",

            title:
                "Streetlight Not Working",

            description:
                "Streetlight is not turning on at night.",

            lat: 28.6182,

            lng: 77.1938,

            status: "Resolved",

            timestamp:
                Date.now() -
                (24 * 60 * 60 * 1000),

            image: "",

            reporterEmail:
                "demo@spotfix.app"

        }

    ];


    localStorage.setItem(
        REPORT_KEY,
        JSON.stringify(demoReports)
    );


    return demoReports;

}


function saveReports(reports) {

    localStorage.setItem(
        REPORT_KEY,
        JSON.stringify(reports)
    );

}


/* =========================================================
   DISTANCE CALCULATION
========================================================= */

function calculateDistanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const earthRadius = 6371;


    const latitudeDifference =
        (lat2 - lat1) *
        Math.PI /
        180;


    const longitudeDifference =
        (lng2 - lng1) *
        Math.PI /
        180;


    const a =
        Math.sin(
            latitudeDifference / 2
        ) ** 2 +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(
            longitudeDifference / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


/* =========================================================
   TIME DISPLAY
========================================================= */

function timeAgo(timestamp) {

    const difference =
        Date.now() -
        Number(timestamp);


    const minutes =
        Math.floor(
            difference / 60000
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `${days}d ago`;

}


/* =========================================================
   FORMAT DISTANCE
========================================================= */

function formatDistance(distance) {

    if (distance < 1) {

        return `${Math.round(
            distance * 1000
        )} m`;

    }


    return `${distance.toFixed(1)} km`;

}


/* =========================================================
   INITIALIZE MAP
========================================================= */

function initializeMap() {

    if (typeof L === "undefined") {

        console.error(
            "Leaflet was not loaded."
        );

        return;

    }


    map =
        L.map("map")
            .setView(
                [
                    userLatitude,
                    userLongitude
                ],
                12
            );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "© OpenStreetMap contributors"

        }
    ).addTo(map);


    /*
       User marker
    */

    userMarker =
        L.marker(
            [
                userLatitude,
                userLongitude
            ]
        ).addTo(map);


    userMarker.bindPopup(
        "<strong>Your location</strong>"
    );


    /*
       Radius circle
    */

    radiusCircle =
        L.circle(
            [
                userLatitude,
                userLongitude
            ],
            {

                radius: selectedRadius,

                color: "#2855ff",

                fillColor: "#2855ff",

                fillOpacity: 0.08,

                weight: 2

            }
        ).addTo(map);


    refreshIssues();


    /*
       Leaflet sometimes needs a resize
       after the page finishes rendering.
    */

    setTimeout(
        function() {

            map.invalidateSize();

        },
        200
    );

}


/* =========================================================
   CLEAR EXISTING ISSUE MARKERS
========================================================= */

function clearIssueMarkers() {

    issueMarkers.forEach(
        function(marker) {

            map.removeLayer(marker);

        }
    );


    issueMarkers = [];

}


/* =========================================================
   REFRESH MAP + ISSUE LIST
========================================================= */

function refreshIssues() {

    if (!map) {

        return;

    }


    const reports =
        getReports();


    /*
       Calculate distance from user
       and keep only reports inside
       selected range.
    */

    const visibleReports =
        reports
            .map(
                function(report) {

                    return {

                        ...report,

                        distance:
                            calculateDistanceKm(
                                userLatitude,
                                userLongitude,
                                Number(report.lat),
                                Number(report.lng)
                            )

                    };

                }
            )
            .filter(
                function(report) {

                    return (
                        report.distance <=
                        selectedRadius / 1000
                    );

                }
            )
            .sort(
                function(a, b) {

                    return (
                        a.distance -
                        b.distance
                    );

                }
            );


    /*
       Remove old markers.
    */

    clearIssueMarkers();


    /*
       Add visible markers.
    */

    visibleReports.forEach(
        function(report) {

            const marker =
                L.marker(
                    [
                        report.lat,
                        report.lng
                    ]
                ).addTo(map);


            marker.bindPopup(`
                <strong>
                    ${escapeHtml(report.title)}
                </strong>
                <br>
                ${escapeHtml(report.type)}
                <br>
                ${formatDistance(report.distance)}
                away
                <br>
                ${escapeHtml(report.status)}
            `);


            issueMarkers.push(marker);

        }
    );


    /*
       Update issue cards.
    */

    renderIssueList(
        visibleReports
    );


    updateRangeText();

}


/* =========================================================
   RANGE
========================================================= */

function setupRangeButtons() {

    const buttons =
        document.querySelectorAll(
            ".range-option"
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    selectedRadius =
                        Number(
                            button.dataset.radius
                        );


                    /*
                       Active button
                    */

                    buttons.forEach(
                        function(item) {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }
                    );


                    /*
                       Resize map circle
                    */

                    radiusCircle.setRadius(
                        selectedRadius
                    );


                    /*
                       Refresh issues
                    */

                    refreshIssues();


                    /*
                       Zoom map to selected range
                    */

                    map.fitBounds(
                        radiusCircle.getBounds(),
                        {

                            padding: [
                                10,
                                10
                            ],

                            maxZoom:
                                selectedRadius <= 5000
                                    ? 13
                                    : 12

                        }
                    );

                }
            );

        }
    );

}


/* =========================================================
   UPDATE RANGE LABELS
========================================================= */

function updateRangeText() {

    const km =
        selectedRadius / 1000;


    document.getElementById(
        "rangeLabel"
    ).textContent =
        `${km} km`;


    document.getElementById(
        "issuesTitle"
    ).textContent =
        `Issues within ${km} km`;

}


/* =========================================================
   RENDER ISSUE LIST
========================================================= */

function renderIssueList(
    reports
) {

    const list =
        document.getElementById(
            "issueList"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    list.innerHTML = "";


    /*
       Nothing in range
    */

    if (reports.length === 0) {

        list.hidden = true;

        emptyState.hidden = false;

        return;

    }


    list.hidden = false;

    emptyState.hidden = true;


    /*
       Create cards
    */

    reports.forEach(
        function(report) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "issue-card";


            let imageHTML;


            if (report.image) {

                imageHTML = `
                    <img
                        src="${report.image}"
                        alt="${escapeHtml(report.type)} issue"
                        class="issue-image"
                    >
                `;

            }

            else {

                imageHTML = `
                    <div
                        class="issue-image issue-image-fallback"
                    >
                        ${
                            report.type === "Pothole"
                                ? "🕳️"
                                : report.type === "Garbage"
                                    ? "🗑️"
                                    : report.type === "Streetlight"
                                        ? "💡"
                                        : "✦"
                        }
                    </div>
                `;

            }


            card.innerHTML = `
                ${imageHTML}

                <div class="issue-details">

                    <div class="issue-title-row">

                        <div class="issue-title">
                            ${escapeHtml(
                                report.title
                            )}
                        </div>

                        <span
                            class="status ${
                                getStatusClass(
                                    report.status
                                )
                            }"
                        >
                            ${escapeHtml(
                                report.status
                            )}
                        </span>

                    </div>


                    <div class="issue-type">

                        ${escapeHtml(
                            report.type
                        )}

                    </div>


                    <div class="issue-meta">

                        📍
                        ${formatDistance(
                            report.distance
                        )}
                        away
                        ·
                        ${timeAgo(
                            report.timestamp
                        )}

                    </div>

                </div>
            `;


            list.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    if (
        status === "In Progress"
    ) {

        return "progress";

    }


    if (
        status === "Resolved"
    ) {

        return "resolved";

    }


    return "pending";

}


/* =========================================================
   LOCATION
========================================================= */

function useCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        showInfo(
            "Location unavailable",
            "<div class='info-item'>Your browser does not support GPS.</div>"
        );

        return;

    }


    const button =
        document.getElementById(
            "locationButton"
        );


    button.textContent = "…";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLatitude =
                position.coords.latitude;


            userLongitude =
                position.coords.longitude;


            /*
               Move user marker
            */

            userMarker.setLatLng(
                [
                    userLatitude,
                    userLongitude
                ]
            );


            /*
               Move circle
            */

            radiusCircle.setLatLng(
                [
                    userLatitude,
                    userLongitude
                ]
            );


            /*
               Center map
            */

            map.setView(
                [
                    userLatitude,
                    userLongitude
                ],
                13
            );


            /*
               Recalculate issue distances
            */

            refreshIssues();


            button.textContent = "◎";

        },


        function(error) {

            console.log(
                "Location error:",
                error
            );


            button.textContent =
                "◎";


            showInfo(
                "Location",
                "<div class='info-item'>Location permission was unavailable, so the demo location is still being used.</div>"
            );

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                60000

        }

    );

}


/* =========================================================
   REPORT MODAL
========================================================= */

function openReport(
    issueType = "Pothole"
) {

    document.getElementById(
        "issueType"
    ).value =
        issueType;


    document.getElementById(
        "description"
    ).value =
        "";


    document.getElementById(
        "issuePhoto"
    ).value =
        "";


    document.getElementById(
        "photoPreview"
    ).innerHTML =
        "";


    document.getElementById(
        "photoPreview"
    ).hidden =
        true;


    selectedPhoto = "";


    document.getElementById(
        "reportModal"
    ).hidden =
        false;


    document.getElementById(
        "locationTitle"
    ).textContent =
        "Use my current location";


    document.getElementById(
        "locationSubtitle"
    ).textContent =
        `${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)} currently selected`;

}


function closeReport() {

    document.getElementById(
        "reportModal"
    ).hidden =
        true;

}


/* =========================================================
   PHOTO
========================================================= */

function setupPhotoUpload() {

    document.getElementById(
        "issuePhoto"
    ).addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files?.[0];


            if (!file) {

                selectedPhoto = "";

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showInfo(
                    "Photo",
                    "<div class='info-item'>Please choose an image file.</div>"
                );

                event.target.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function() {

                    selectedPhoto =
                        reader.result;


                    document.getElementById(
                        "photoPreview"
                    ).innerHTML = `
                        <img
                            src="${selectedPhoto}"
                            alt="Selected report photo"
                        >
                    `;


                    document.getElementById(
                        "photoPreview"
                    ).hidden =
                        false;

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   SUBMIT REPORT
========================================================= */

function submitReport() {

    const type =
        document.getElementById(
            "issueType"
        ).value;


    const description =
        document.getElementById(
            "description"
        ).value
        .trim();


    if (!description) {

        showInfo(
            "Missing description",
            "<div class='info-item'>Please describe the issue before submitting.</div>"
        );

        return;

    }


    const session =
        getSession();


    const newReport = {

        id:
            `report-${Date.now()}`,

        type:
            type,

        title:
            `${type} reported`,

        description:
            description,

        lat:
            userLatitude,

        lng:
            userLongitude,

        status:
            "Pending",

        timestamp:
            Date.now(),

        image:
            selectedPhoto,

        reporterEmail:
            session?.email || ""

    };


    const reports =
        getReports();


    reports.unshift(
        newReport
    );


    saveReports(
        reports
    );


    /*
       Close report modal
    */

    closeReport();


    /*
       Reset fields
    */

    document.getElementById(
        "description"
    ).value = "";

    document.getElementById(
        "issuePhoto"
    ).value = "";

    selectedPhoto = "";


    /*
       Refresh map and list
    */

    refreshIssues();


    /*
       Tell user it worked
    */

    showInfo(
        "Report submitted",
        "<div class='info-item'>Your issue has been added to the map and the issue list.</div>"
    );

}


/* =========================================================
   BASIC INFORMATION MODAL
========================================================= */

function showInfo(
    title,
    content
) {

    document.getElementById(
        "infoTitle"
    ).textContent =
        title;


    document.getElementById(
        "infoContent"
    ).innerHTML =
        content;


    document.getElementById(
        "infoModal"
    ).hidden =
        false;

}


function closeInfo() {

    document.getElementById(
        "infoModal"
    ).hidden =
        true;

}


/* =========================================================
   MENU / INFO BUTTONS
========================================================= */

function setupButtons() {


    /*
       Report button
    */

    document.getElementById(
        "reportButton"
    ).addEventListener(
        "click",
        function() {

            openReport();

        }
    );


    /*
       Category buttons
    */

    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        openReport(
                            button.dataset.type
                        );

                    }
                );

            }
        );


    /*
       Location button
    */

    document.getElementById(
        "locationButton"
    ).addEventListener(
        "click",
        useCurrentLocation
    );


    /*
       Close report
    */

    document.getElementById(
        "closeReport"
    ).addEventListener(
        "click",
        closeReport
    );


    /*
       Report modal backdrop
    */

    document.getElementById(
        "modalBackdrop"
    ).addEventListener(
        "click",
        closeReport
    );


    /*
       Submit
    */

    document.getElementById(
        "submitReport"
    ).addEventListener(
        "click",
        submitReport
    );


    /*
       Info modal
    */

    document.getElementById(
        "closeInfo"
    ).addEventListener(
        "click",
        closeInfo
    );


    document
        .querySelector(
            "[data-close-info]"
        )
        .addEventListener(
            "click",
            closeInfo
        );


    /*
       Menu
    */

    document.getElementById(
        "menuButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Menu",
                `
                <div class="info-list">

                    <div class="info-item">
                        🏠 Home
                    </div>

                    <div class="info-item">
                        🗺️ Explore the map
                    </div>

                    <div class="info-item">
                        📊 My Reports
                    </div>

                    <div class="info-item">
                        👤 Profile
                    </div>

                </div>
                `
            );

        }
    );


    /*
       Notifications
    */

    document.getElementById(
        "notificationButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Notifications",
                `
                <div class="info-list">

                    <div class="info-item">
                        ✅ A sample issue was resolved.
                    </div>

                    <div class="info-item">
                        📍 New issues are available in your selected range.
                    </div>

                    <div class="info-item">
                        🤝 Thanks for helping your community.
                    </div>

                </div>
                `
            );

        }
    );


    /*
       View all categories
    */

    document.getElementById(
        "viewAllCategories"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Issue Categories",
                `
                <div class="info-list">

                    <div class="info-item">
                        🕳️ Pothole
                    </div>

                    <div class="info-item">
                        🗑️ Garbage
                    </div>

                    <div class="info-item">
                        💡 Streetlight
                    </div>

                    <div class="info-item">
                        💧 Water leakage
                    </div>

                    <div class="info-item">
                        🛣️ Broken road
                    </div>

                    <div class="info-item">
                        🚦 Traffic signal
                    </div>

                    <div class="info-item">
                        ✦ Other
                    </div>

                </div>
                `
            );

        }
    );


    /*
       View all issues
    */

    document.getElementById(
        "viewAllIssues"
    ).addEventListener(
        "click",
        function() {

            const count =
                document.querySelectorAll(
                    ".issue-card"
                ).length;


            showInfo(
                "Issues in this range",
                `
                <div class="info-item">
                    ${count}
                    issue${count === 1 ? "" : "s"}
                    currently visible within
                    ${selectedRadius / 1000}
                    km.
                </div>
                `
            );

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        const page =
                            button.dataset.nav;


                        document
                            .querySelectorAll(
                                ".nav-item"
                            )
                            .forEach(
                                function(item) {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );


                        if (
                            page === "home"
                        ) {

                            window.scrollTo(
                                {
                                    top: 0,
                                    behavior:
                                        "smooth"
                                }
                            );

                        }


                        if (
                            page === "map"
                        ) {

                            document
                                .querySelector(
                                    ".map-section"
                                )
                                .scrollIntoView(
                                    {
                                        behavior:
                                            "smooth"
                                    }
                                );

                        }


                        if (
                            page === "reports"
                        ) {

                            showMyReports();

                        }


                        if (
                            page === "profile"
                        ) {

                            showProfile();

                        }

                    }
                );

            }
        );

}


/* =========================================================
   MY REPORTS
========================================================= */

function showMyReports() {

    const session =
        getSession();


    if (!session) {

        return;

    }


    const reports =
        getReports().filter(
            function(report) {

                return (
                    report.reporterEmail ===
                    session.email
                );

            }
        );


    if (reports.length === 0) {

        showInfo(
            "My Reports",
            `
            <div class="info-item">
                📋 You have not submitted any reports yet.
            </div>
            `
        );

        return;

    }


    const reportList =
        reports
            .slice(0, 5)
            .map(
                function(report) {

                    return `
                        <div class="info-item">
                            ${escapeHtml(report.type)}
                            —
                            ${escapeHtml(report.status)}
                        </div>
                    `;

                }
            )
            .join("");


    showInfo(
        "My Reports",
        `
        <div class="info-list">

            <div class="info-item">
                📊
                ${reports.length}
                report${reports.length === 1 ? "" : "s"}
                submitted.
            </div>

            ${reportList}

        </div>
        `
    );

}


/* =========================================================
   PROFILE
========================================================= */

function showProfile() {

    const session =
        getSession();


    showInfo(
        "Profile",
        `
        <div class="info-list">

            <div class="info-item">
                👤
                ${escapeHtml(
                    session?.name || "Citizen"
                )}
            </div>

            <div class="info-item">
                ✉️
                ${escapeHtml(
                    session?.email || "—"
                )}
            </div>

            <div class="info-item">
                🗺️
                Current range:
                ${selectedRadius / 1000}
                km
            </div>

            <div class="info-item">
                🌱
                Spot it. Fix it.
            </div>

            <div class="info-item">
                <button
                    id="logoutButton"
                    class="text-button"
                    type="button"
                >
                    Log out
                </button>
            </div>

        </div>
        `
    );


    setTimeout(
        function() {

            const logoutButton =
                document.getElementById(
                    "logoutButton"
                );


            if (
                logoutButton
            ) {

                logoutButton.addEventListener(
                    "click",
                    function() {

                        localStorage.removeItem(
                            SESSION_KEY
                        );


                        window.location.href =
                            "index.html";

                    }
                );

            }

        },
        0
    );

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   START HOME
========================================================= */

function startHome() {

    const session =
        getSession();


    /*
       If there is no login session,
       go back to login.
    */

    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       Show user name
    */

    document.getElementById(
        "userName"
    ).textContent =
        session.name
            .split(" ")[0];


    /*
       Start everything
    */

    initializeMap();

    setupRangeButtons();

    setupPhotoUpload();

    setupButtons();

    setupNavigation();

}


document.addEventListener(
    "DOMContentLoaded",
    startHome
);