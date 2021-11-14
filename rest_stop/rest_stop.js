let app = Vue.createApp({
    data(){
        return{
            submit: false,
            details: false,
            all_rest_stops: [],
            image_url: "",
            rest_stop_name: "",
            address: "",
            post_code: "",
            desc: "",
            offers: [],
            long: 0,
            lat: 0,
            current_coord: [],
            sorted_data: [],
            sorted: false, 
            filter_check: [],
            filter_results: [],
            filtered: false,
            rsname_error:false,
            rsadd_error: false,
            rspost_error: false,
            rsimage_error: false,
            rsdesc_error: false,
            rsoffers_error: false,
            attribution: ""
        }
    },

    created: async function(){
        // Firebase connecting messages
        this.api_attribute()
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

        var all_reststops = firebase.database().ref('all_reststops');

        // PULLING DATA FROM FIREBASE
        let snapshot = await all_reststops.once('value')
        if (snapshot.exists()) {
            this.all_rest_stops = await snapshot.val()
        }
        else {
            console.log('The read failed');
        }

        //console.log(this.all_rest_stops);

        if (sessionStorage.getItem("all_carpark")) {
            setInterval(function () {
                sessionStorage.setItem("all_carpark_time",Number(sessionStorage.getItem("all_carpark_time")) + 1)
                // console.log(sessionStorage.getItem("all_carpark_time"))
            },1000)
            if (Number(sessionStorage.getItem("all_carpark_time")) > 60) {
                sessionStorage.removeItem("all_carpark_time")
                sessionStorage.removeItem("all_carpark")
                all_carpark = await get_all_carparks()
                sessionStorage.setItem("all_carpark",JSON.stringify(all_carpark))
                sessionStorage.setItem("all_carpark_time", 0)
            }
        }
        else{
            all_carpark = await get_all_carparks()
            sessionStorage.setItem("all_carpark",JSON.stringify(all_carpark))
            sessionStorage.setItem("all_carpark_time",0)
            setInterval(function () {
                sessionStorage.setItem("all_carpark_time",Number(sessionStorage.getItem("all_carpark_time")) + 1)
                //console.log(sessionStorage.getItem("all_carpark_time"))
            },1000)
        }
        if (sessionStorage.getItem("current_position")) {
            this.current_coord = JSON.parse(sessionStorage.getItem("current_position"))
            this.sortByDistance()
        }
        else{
            navigator.geolocation.getCurrentPosition(function(position){
                sessionStorage.setItem("current_position",JSON.stringify([position.coords.longitude,position.coords.latitude]))
            })
            var get_curr_location = setInterval(function () {
                if (sessionStorage.getItem("current_position")){
                    this.current_coord = JSON.parse(sessionStorage.getItem("current_position"))
                    this.sortByDistance()
                    clearInterval(get_curr_location)
                }
            }.bind(this),1000)
        }
    },


    methods: {
        initMap(){
            const input = document.getElementById("pac-input");
            const searchBox = new google.maps.places.SearchBox(input);
            //console.log(searchBox.getPlaces())
            var coordinates= []
        
            searchBox.addListener("places_changed", () => {
                const places = searchBox.getPlaces();
            
                places.forEach((place) => {
                    coordinates.push(place.geometry.location.lng())
                    coordinates.push(place.geometry.location.lat())
                    this.current_coord = coordinates
                    this.sortByDistance()
                })
            })
        },

        sortByDistance(){
            this.sorted = true
            let data = this.all_rest_stops
            
            const options = { units: "kilometers" }
            var new_data = JSON.parse(JSON.stringify(data))
            new_data = Object.values(new_data)


            new_data.forEach(date => {
                var curr = JSON.parse(JSON.stringify(this.current_coord))
                Object.defineProperty(date, "distance", {
                    value: turf.distance(curr,date.geometry, options),
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            });
            
            new_data.sort(function (a, b) {
                if (a.distance > b.distance) {
                    return 1;
                }
                if (a.distance < b.distance) {
                    return -1;
                }
                return 0; // a must be equal to b
            });

            this.sorted_data = new_data
            if (this.filter_check.length > 0) {
                this.check_filter()    
            }
        },

        cancel_create_rest_stop(){
            if (this.submit == false){
                this.submit = true
            }
            else{
                this.submit= false
                this.image_url = ""
                this.rest_stop_name = ""
                this.address = ""
                this.post_code = ""
                this.desc = ""
                this.offers = []
                this.rsname_error=false
                this.rsadd_error= false
                this.rspost_error= false
                this.rsimage_error= false
                this.rsdesc_error= false
                this.rsoffers_error= false
            }
            
            
        },
        show_details(){
            if (this.details ==false){
                this.details= true
            }else{
                this.details = false
            }

        },

        newRestStop(){
            //console.log("==== newRestStop() START =====");

            var checker= false
            if (this.rest_stop_name == ''){
                this.rsname_error = true
                checker = true
            }
            else{
                this.rsname_error = false
            }
            if (this.address == ''){
                this.rsadd_error = true                
                checker = true
            }
            else{
                this.rsadd_error = false
            }
            if (this.post_code == ''){
                this.rspost_error = true
            }
            else{
                this.rspost_error = false
            }
            if (this.desc == ''){
                this.rsdesc_error = true
                checker = true
            }
            else{
                this.rsdesc_error = false
            }
            if (this.image_url == ''){
                this.rsimage_error = true
                checker = true
            }
            else{
                this.rsimage_error = false
            }
            if (this.offers.length === 0) {
                this.rsoffers_error = true
                checker = true
            }
            else{
                this.rsoffers_error = false
            }
                
            if (!checker){
                    // postal code variable
                    var postalCode = this.post_code;

                    // postal code variable
                    var postalCode = this.post_code;

                    let api_endpoint = `https://developers.onemap.sg/commonapi/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y`;

                    // call API to get long and latitude
                    axios.get(api_endpoint)
                    .then(response => {
                        var searchObject = response.data.results[0];


                        var all_reststops = firebase.database().ref('all_reststops');

                        var all_reststops_json = JSON.parse(JSON.stringify(this.all_rest_stops));
                        var newindex = Object.keys(all_reststops_json).length+1;


                        var newRestStopFirebase = firebase.database().ref('all_reststops/r' + newindex);
                        newRestStopFirebase.once('value').then((snapshot) => {
                                // add new reststop data to firebase
                                firebase.database().ref('all_reststops/r' + newindex).set({
                                    reststop_image: this.image_url,
                                    reststop_name: this.rest_stop_name, 
                                    reststop_address: this.address, 
                                    reststop_postal: this.post_code, 
                                    reststop_desc: this.desc,
                                    reststop_offers: this.offers,
                                    geometry: {
                                        "type": "Point",
                                        "coordinates": [Number(searchObject.LONGITUDE),Number(searchObject.LATITUDE),]
                                    },
                                    
                                }, function(error) {
                                    if (error) {
                                        console.log("== new rest stop input failed!!! ===");
                                    }
                                });


                                // update the list to reflect new rest stop input
                                all_reststops.once('value').then((snapshot) => {
                                    if(snapshot.exists()) {
                                        this.all_rest_stops = snapshot.val();
                                        if (this.sorted) {
                                            this.sortByDistance()
                                        }
                                        else if (this.filtered) {
                                            this.check_filter()
                                        }
                                    }
                                    else {
                                        console.log('The read failed');
                                    }
                                });

                                // empty and reset the user's input on the form
                                this.image_url = '';
                                this.rest_stop_name = '';
                                this.address = '';
                                this.post_code = ''; 
                                this.desc = '';
                                this.offers = [];
                                this.submit= false
                            

                        });

                        
                    })
                    .catch(error => {
                        console.log( error.message )
                    })


            }

        },

        select(coordinates) {
            window.open(`http://www.google.com/maps/place/${String(coordinates[1])},${String(coordinates[0])}`, '_blank')
        },
        
        check_filter(){
            this.filter_results = []
            if (this.filter_check.length !== 0) {
                if (this.sorted_data.length !== 0) {
                    for (const reststop in JSON.parse(JSON.stringify(this.sorted_data))) {
                        let check_offers = true
                        for (const filter_offer of this.filter_check) {
                            if (! JSON.parse(JSON.stringify(this.sorted_data[reststop]['reststop_offers'])).includes(filter_offer)) {
                                check_offers = false
                            }
                        }
                        if (check_offers) {
                            this.filter_results.push(JSON.parse(JSON.stringify(this.sorted_data[reststop])))
                        }
                    }
                    //sort
                    let data = this.filter_results
        
                    const options = { units: "kilometers" }
                    var new_data = JSON.parse(JSON.stringify(data))
                    new_data = Object.values(new_data)
        
        
                    new_data.forEach(date => {
                        var curr = JSON.parse(JSON.stringify(this.current_coord))
                        Object.defineProperty(date, "distance", {
                            value: turf.distance(curr,date.geometry, options),
                            writable: true,
                            enumerable: true,
                            configurable: true,
                        });
                    });
                    
                    new_data.sort(function (a, b) {
                        if (a.distance > b.distance) {
                            return 1;
                        }
                        if (a.distance < b.distance) {
                            return -1;
                        }
                        return 0; // a must be equal to b
                    });
        
                    this.filter_results = new_data
                }
                else{
                    for (const reststop in JSON.parse(JSON.stringify(this.all_rest_stops))) {
                        let check_offers = true
                        for (const filter_offer of this.filter_check) {
                            if (! JSON.parse(JSON.stringify(this.all_rest_stops[reststop]['reststop_offers'])).includes(filter_offer)) {
                                check_offers = false
                            }
                        }
                        if (check_offers) {
                            this.filter_results.push(JSON.parse(JSON.stringify(this.all_rest_stops[reststop])))
                        }
                    }
                }
                
                this.sorted = false
                this.filtered = true
            }
            else{
                this.filtered = false
                if (this.sorted_data.length !== 0) {
                    this.sorted = true
                }
            }
        },


        // upload image function
        UploadAndReturnURL(){
            const client = filestack.init('A3OKMHVWCQTJckrjfxIfHz');
            const options = {
              accept: ["image/*"],
              onFileUploadFinished: file => {
                  this.image_url = file.url;
              }
            };
            
            client.picker(options).open();
        },
        auto_scroll_when_search(){
            window.scroll({top:this.find_position(document.getElementById("vue_app")),behavior:"smooth"})
        },
        find_position(obj){
            var curtop = 0;
            if (obj.offsetParent) {
                do {
                    curtop += obj.offsetTop;
                } while (obj = obj.offsetParent);
            return [curtop];
            }
        },
        api_attribute(){
            var today = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var dd = String(today.getDate());
            var mm = String(monthNames[today.getMonth()]);
            var yyyy = String(today.getFullYear());
      
            today = dd + ' ' + mm + ' ' + yyyy;
            this.attribution = `Contains information from OneMap REST APIs - Search accessed on ${today} from OneMap which is made available under the terms of the Singapore Open Data Licence version 1.0 https://www.onemap.gov.sg/legal/opendatalicence.html`
        }


    },
    computed: {

    },
})



app.mount("#vue_app")

