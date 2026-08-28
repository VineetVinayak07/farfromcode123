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


    else if (page === "reports") {

        alert(
            "My Reports\n\n" +
            "You currently have 3 reports."
        );

    }


    else if (page === "profile") {

        alert(
            "Citizen Profile\n\n" +
            "Welcome to CivicEye AI!"
        );

    }

}


// ========================================
// MENU
// ========================================

function openMenu() {

    alert(
        "CivicEye AI Menu\n\n" +
        "Home\n" +
        "Map\n" +
        "My Reports\n" +
        "Notifications\n" +
        "Profile"
    );
}


// ========================================
// START APPLICATION
// ========================================

window.onload = function() {

    initializeMap();

};