mapboxgl.accessToken = "pk.eyJ1Ijoianktd29uZyIsImEiOiJja3VwcjR2ODEwMTFtMndxOXE3bzM2cXBtIn0.SOsLNe6fzXq9IrkwQzlepQ"

const firebaseConfig = {
    apiKey: "AIzaSyCv55Nudy8CCXpWds9NDmYyC5J4vcbeOV0",
    authDomain: "deliveryheroes-wad2.firebaseapp.com",
    databaseURL: "https://deliveryheroes-wad2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "deliveryheroes-wad2",
    storageBucket: "deliveryheroes-wad2.appspot.com",
    messagingSenderId: "487402659992",
    appId: "1:487402659992:web:97475744455e661ec2b0ed",
    measurementId: "G-5BRXTY0D7C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

function show_modal() {
    let modal = document.getElementById("attribute_modal")
    if (modal.style.display === "none") {
      modal.style.display = "block"
    }
    else{
      modal.style.display = "none"
    }
}

function api_attribute() {
    var today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var dd = String(today.getDate());
    var mm = String(monthNames[today.getMonth()]);
    var yyyy = String(today.getFullYear());
    
    today = dd + ' ' + mm + ' ' + yyyy;
    attribution.innerHTML = `
    Contains information from Coordinates Converter - 3414(SVY21) to 4326(WGS84) API, 
    accessed on ${today} from OneMap
    which is made available under the terms of the Singapore 
    Open Data Licence version 1.0 https://www.onemap.gov.sg/legal/opendatalicence.html 

    <br><br> 

    Contains information from Carpark Availability API, HDB Carpark <br> Information, Carpark Rates (Major Shopping Malls, Attractions
    <br> and Hotels) accessed on ${today} from DataGov
    which is <br> made available under the terms of the Singapore 
    Open Data <br> Licence version 1.0 https://data.gov.sg/open-data-licence

    <br><br>

    Contains information from Carpark Availability API
    accessed on <br> ${today} from LTA DataMall
    which is made available <br> under the terms of the Singapore 
    Open Data Licence version 1.0 https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpen <br> DataLicence.html`

}

function find_position(obj){
    var curtop = 0;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    return [curtop];
    }
}

async function extract_CarparkHDB_firebase() {
    var full_database_CARPARKS_HDB = firebase.database().ref('fullDB_Carparks');
    let snapshot = await full_database_CARPARKS_HDB.once('value')
    let final_result = await snapshot.val()
    return Promise.resolve(final_result)
}

async function get_data_gov_available_lots() {
    let hdb_carparks_data = []
    let carpark_name_array = await extract_CarparkHDB_firebase()
    let tzoffset = (new Date()).getTimezoneOffset() * 60000
    let localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1).split('.')[0].replace(/:/g, '%3A')
    let url = "https://api.data.gov.sg/v1/transport/carpark-availability?date_time=" + localISOTime
    let response = await axios.get(url)
    for (const carpark of carpark_name_array.data) {
        for (const data_item of response.data.items[0].carpark_data) {
            if (carpark.car_park_no == data_item.carpark_number) {
                new_carpark_object = {"type": "Feature",
                                    "geometry":{
                                        "type": "Point",
                                        "coordinates": carpark.coordinates
                                        },
                                    "properties": {
                                        "CarParkID": carpark.car_park_no,
                                        "Name": carpark.address,
                                        "AvailableLots": data_item.carpark_info[0].lots_available,
                                        "TotalLots" : data_item.carpark_info[0].total_lots,
                                        }
                                    }
                                    hdb_carparks_data.push(new_carpark_object)
            }
        }
    }
    return Promise.resolve(hdb_carparks_data)
}

async function get_data_mall_available_lots() {
    let data_mall_info = []
    let carpark_rates = await get_mall_carpark_rates()
    let url = "../php_api/datamall_api.php"
    await axios.get(url)
    .then (response => {
        for (const carpark of response.data) {
            if (carpark.Area.length > 1) {
                let location = carpark.Location.split(" ").reverse()
                let new_carpark = {"type": "Feature",
                                    "geometry":{
                                        "type": "Point",
                                        "coordinates": [parseFloat(location[0]),parseFloat(location[1])]
                                    },
                                    "properties": {
                                        "CarParkID": carpark.CarParkID,
                                        "Name": carpark.Development,
                                        "AvailableLots": carpark.AvailableLots,
                                    },
                                }
                for (const rate of carpark_rates) {
                    if (rate.carpark.split(' ').join("").toLowerCase() == carpark.Development.split(' ').join("").toLowerCase() || (rate.carpark.toLowerCase()).includes(carpark.Development.toLowerCase()) || (carpark.Development.toLowerCase()).includes(rate.carpark.toLowerCase()) || (carpark.Development.toLowerCase()).includes(rate.carpark.split(' ').join("").toLowerCase())) {
                        new_carpark["properties"]['saturday_rate'] = rate.saturday_rate
                        new_carpark["properties"]['sunday_publicholiday_rate'] = rate.sunday_publicholiday_rate
                        new_carpark["properties"]["weekdays_rate_1"] = rate.weekdays_rate_1
                    }
                }
                data_mall_info.push(new_carpark)
            }
        }
    })
    .catch(error => {
        console.log(error.message)
    })
    return Promise.resolve(data_mall_info)
}

async function get_mall_carpark_rates() {
    let final_records = []
    let url = "https://data.gov.sg/api/action/datastore_search?resource_id=85207289-6ae7-4a56-9066-e6090a3684a5&limit=357"
    await axios.get(url)
    .then (response => {
        final_records = response.data.result.records
    })
    .catch(error => {
        console.log(error.message)
    })
    return Promise.resolve(final_records)
}

async function get_all_carparks() {
    let final_carpark_data = { "type": "FeatureCollection", "features": [] }
    let datamall_data = await get_data_mall_available_lots()
    let hdb_data = await get_data_gov_available_lots()
    Array.prototype.push.apply(final_carpark_data["features"],datamall_data)
    Array.prototype.push.apply(final_carpark_data["features"],hdb_data)
    return Promise.resolve(final_carpark_data)
}

function createMarker(map,carpark){
    
    const mark = document.createElement("div")
    mark.classList = ("marker", "cursor-pointer")
    mark.id = `marker-${carpark.properties.CarParkID}`

    if (carpark.properties.AvailableLots < 20){
        mark.innerHTML = "<img style='width:30px; height:30px;' src='../images/red_parking.png'></img>"
    }

    else if (carpark.properties.AvailableLots < 50){
        mark.innerHTML = "<img style='width:30px; height:30px;' src='../images/yellow_parking.png'></img>"
    }

    else{
        mark.innerHTML = "<img style='width:30px; height:30px; ' src='../images/green_parking.png'></img>"
    }
    
    new mapboxgl.Marker(mark, { offset: [0, -23] })
        .setLngLat(carpark.geometry.coordinates)
        .addTo(map);

    mark.addEventListener('click', (e) => {
        /* Fly to the point */
        go_to_carpark(map,carpark)
        /* Close all other popups and display popup for clicked store */
        createPopUp(map,carpark)
        /* Highlight listing in sidebar */
        const activeItem = document.getElementsByClassName('active');
        e.stopPropagation()
        if (activeItem[0]) {
        activeItem[0].classList.remove('active')
        }
        const listing = document.getElementById(
        `indiv-${carpark.properties.CarParkID}`
        )
        listing.classList.add('active');
    });
    
}

function createPopUp(map,currentFeature) {
    const d = new Date()
    var color_choice
    var isWeekend = d.getDay()%6==0;
    
    if (currentFeature.properties.AvailableLots < 20){
        color_choice = "#DC2626"
    }

    else if (currentFeature.properties.AvailableLots < 50){
        color_choice = "#F59E0B"
    }

    else{
        color_choice = "#047857"
    }

    let html_template = `<h2 style="background:${color_choice}">${currentFeature.properties.Name}</h2>
                            <h4>Available Lots:</h4>
                                <p>${currentFeature.properties.AvailableLots}</p>
                            `

    if (currentFeature.properties.saturday_rate !== undefined && isWeekend == true){
        if (currentFeature.properties.saturday_rate.includes("Same as")){
            html_template += `
                        <h4>Weekday Rate</h4>
                        <p>${currentFeature.properties.weekdays_rate_1}</p>
                        
                        `
        }

        html_template += `
                        <h4>Weekend Rate</h4>
                        <p>${currentFeature.properties.saturday_rate}</p>
                        
                        `
    }

    if (currentFeature.properties.weekdays_rate_1 !== undefined && isWeekend == false){
        html_template += `
                        <h4>Weekday Rate</h4>
                        <p>${currentFeature.properties.weekdays_rate_1}</p>
                        
                        `
    } 

    if (currentFeature.properties.Name.includes("Blk")){
        html_template += `
                        <h4>Grace Parking Period:</h4>
                        <p>20 minutes</p> 
        `
    }   

    html_template += `
            <button class="text-blue-600 underline mb-4 ml-2 p-2 mt-2" onclick="select(${String(currentFeature.geometry.coordinates[1])},${String(currentFeature.geometry.coordinates[0])})">
            View on Google Maps
            </button>
    `
    // Check if there is already a popup on the map and if so, remove it 
    const popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) popUps[0].remove()

    const popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(html_template)
        .addTo(map);
}

function go_to_carpark(map,currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 14
    });
}

function select(coordinate1,coordinate2){
    window.open(`http://www.google.com/maps/place/${coordinate1},${coordinate2}`, '_blank')
}

function buildLocationList(map,all_carpark,check_sorted) {
    const carparks = document.getElementsByClassName('carparks')[0];
    var data = all_carpark.features

    if (check_sorted == true){
        data = all_carpark.features.slice(0,50)
    }
    
    for (carpark of data) {
        createMarker(map,carpark)

        // create div and ad class and id
        const indiv = document.createElement("div")
        indiv.id = `indiv-${carpark.properties.CarParkID}`;
        // indiv.className = 'item';
        indiv.classList.add("item")
        
        // add title
        const carpark_name = document.createElement("div")
        // carpark_name.className = "title"
        carpark_name.classList.add("title","flex", "justify-between", "content-center", "text-sm", "lg:text-base")
        // carpark_name.innerText = carpark.properties.Name 
        
        carpark_name.innerHTML = `
                <span>${carpark.properties.Name}</span>`

        if (check_sorted){
            carpark_name.innerHTML += `<span style="padding-top: 0.1em; padding-bottom: 0.1rem" class="text-xs text-gray-800 text-right w-28">${carpark.properties.distance.toFixed(2)} km</span>`
        }
        
        // bg-gray-200 rounded-full
        if (carpark.properties.AvailableLots < 20){
            carpark_name.style.color = "#DC2626"
        }

        else if (carpark.properties.AvailableLots < 50){
            carpark_name.style.color = "#F59E0B"
        }

        else{
            carpark_name.style.color = "#047857"
        }
    
        indiv.appendChild(carpark_name)
        carparks.appendChild(indiv)

        indiv.addEventListener('click', function () {
            window.scroll({top:find_position(document.getElementById("geocoder"))})
            for (const carpark of data) {
                if (this.id === `indiv-${carpark.properties.CarParkID}`) {
                    go_to_carpark(map,carpark)
                    createPopUp(map,carpark)
                }
            }
            const activeItem = document.getElementsByClassName('active');
            if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            this.classList.add('active');
        }); 

    }
}

function sortByDistance(map,selectedPoint,all_carpark,check_sorted) {
    const options = { units: "kilometers" };

    if (check_sorted){
        all_carpark.features.forEach(function (data) {
            Object.defineProperty(data.properties, "distance", {
                value: turf.distance(selectedPoint, data.geometry, options),
                writable: true,
                enumerable: true,
                configurable: true,
            });
        });

        all_carpark.features.sort(function (a, b) {
            if (a.properties.distance > b.properties.distance) {
                return 1;
            }
            if (a.properties.distance < b.properties.distance) {
                return -1;
            }
            return 0; // a must be equal to b
        });
    }

    const listings = document.getElementsByClassName("carparks")[0];
    while (listings.firstChild) {
        listings.removeChild(listings.firstChild);
    }

    const marking = document.getElementsByClassName("mapboxgl-marker")
    while (marking.length > 0){
        marking[0].remove()
    }
    
    const pop_up = document.getElementsByClassName("mapboxgl-popup")
    while (pop_up.length > 0){
        pop_up[0].remove()
    }

    buildLocationList(map,all_carpark,check_sorted);
}

async function lets_build(current_point,check_sorted) {

    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: current_point,
        zoom: 12,
        scrollZoom: false
    })

    let all_carpark
    if (sessionStorage.getItem("all_carpark")) {
        setInterval(function () {
            sessionStorage.setItem("all_carpark_time",Number(sessionStorage.getItem("all_carpark_time")) + 1)
        },1000)
        if (Number(sessionStorage.getItem("all_carpark_time")) > 60) {
            sessionStorage.removeItem("all_carpark_time")
            sessionStorage.removeItem("all_carpark")
            all_carpark = await get_all_carparks()
            sessionStorage.setItem("all_carpark",JSON.stringify(all_carpark))
        }
        all_carpark = JSON.parse(sessionStorage.getItem("all_carpark"))
    }
    else{
        all_carpark = await get_all_carparks()
        sessionStorage.setItem("all_carpark",JSON.stringify(all_carpark))
        sessionStorage.setItem("all_carpark_time",0)
        setInterval(function () {
            sessionStorage.setItem("all_carpark_time",Number(sessionStorage.getItem("all_carpark_time")) + 1)
        },1000)
    }

    var get_curr_location = setInterval(function(){
        if (sessionStorage.getItem("current_position")){
            current_point = JSON.parse(sessionStorage.getItem("current_position"))
            sortByDistance(map,current_point,all_carpark,true);
            new mapboxgl.Marker()
                .setLngLat(current_point)
                .addTo(map)
    
            map.flyTo({
                center: current_point,
                zoom: 14
            })

            clearInterval(get_curr_location)
        }
    },1000)

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: mapboxgl, // Set the mapbox-gl instance
    });

    geocoder.on("result", function (ev) {
        const searchResult = ev.result.geometry;
        sortByDistance(map,searchResult,all_carpark,true);
        new mapboxgl.Marker()
                .setLngLat(searchResult.coordinates)
                .addTo(map);
        
        map.flyTo({
            center: searchResult.coordinates,
            zoom: 14
        })
        
    });

    const zoom_button = new mapboxgl.NavigationControl();
    map.addControl(zoom_button, 'top-left');

    map.on('load', ()=> {
        map.addSource('places', {
            type: 'geojson',
            data: all_carpark
        });
        map.resize();
    })

    sortByDistance(map,current_point,all_carpark,check_sorted);

    document.getElementById('geocoder').appendChild(geocoder.onAdd(map))
    document.getElementById("geocoder").children[0].children[1].addEventListener("click",function () {
        window.scroll({top:find_position(document.getElementById("geocoder").children[0].children[1]),behavior:"smooth"})
    })
}

// Get current position 
var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

if (sessionStorage.getItem("current_position")){
    lets_build(JSON.parse(sessionStorage.getItem("current_position")),true)
}
else{
    lets_build([103.8361, 1.3040],false)
    navigator.geolocation.getCurrentPosition(success)
}

function success (current_position){
    var current_point = [current_position.coords.longitude,current_position.coords.latitude]
    sessionStorage.setItem("current_position",JSON.stringify(current_point))
}