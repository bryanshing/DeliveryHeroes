//console.log("==== connected to weather.js =======");

const weather = Vue.createApp({

    data() {
        return  {
            forecastData: [],
            selectedWeatherforecast: "",
            returnForecast: "",
            update_time: "",
            update_date: "",
            start: "",
            end: "",
            toady: "",
            area_weather: "",
            search_results_arr: [],
            attribution: "",
            attribute_modal: false
        }
    },

    created: async function() {
        //console.log("=== calling API and storing into Vue instance 'weather' ===");

        let tzoffset = (new Date()).getTimezoneOffset() * 60000;
        let localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1).split('.')[0].replace(/:/g, '%3A');

        let api_endpoint = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=' + localISOTime;

        axios.get(api_endpoint)
        .then(response => {
            //console.log( response.data.items[0].forecasts )

            // Assign response.data.records (Array) to
            // 'people' data property
            this.forecastData = response.data.items[0].forecasts;

            update = response.data.items[0].update_timestamp.split("T");
            this.update_date = update[0];
            update_time = update[1].split("+");
            this.update_time = update_time[0];

            start = response.data.items[0].valid_period.start;
            start = start.split("T");
            this.today  = start[0];

            start = start[1].split("+");
            this.start = start[0];

            end = response.data.items[0].valid_period.end;
            end = end.split("T");
            end = end[1].split("+");
            this.end = end[0];
            
        })
        .catch(error => {
            console.log( error.message )
        })
        if (sessionStorage.getItem("all_carpark")) {
            setInterval(function () {
                sessionStorage.setItem("all_carpark_time",Number(sessionStorage.getItem("all_carpark_time")) + 1)
                //console.log(sessionStorage.getItem("all_carpark_time"))
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
        this.api_attribute()
    },

    methods: {
        getForecast(){
            //console.log("===== getForecast() START ======");
            for (const key in this.forecastData) {
                if (Object.hasOwnProperty.call(this.forecastData, key)) {
                    const element = this.forecastData[key];
                    //console.log(element);
                    if (element.area == this.selectedWeatherforecast){
                        this.returnForecast = element.forecast;
                    }
                }
            }
            //console.log("===== getForecast() END ======");
        },
        search_bar(){
            this.search_results_arr = []
            var input_bar = this.area_weather
            var all_area = this.forecastData

            for (const place of all_area) {
                if (JSON.parse(JSON.stringify(place.area)).substr(0,input_bar.length).toLowerCase() == input_bar.toLowerCase()) {
                    this.search_results_arr.push(JSON.parse(JSON.stringify(place.area)))
                }
            }
            if (input_bar.length === 0) {
                this.search_area_str = ""
                this.search_results_arr = []
                this.returnForecast = ""
            }
        },
        link_to_forecast(area){
            this.selectedWeatherforecast = area.currentTarget.id
            this.area_weather = area.currentTarget.id
            this.search_results_arr = []
            this.getForecast()
        },
        auto_scroll_when_search(){
            //document.getElementById("weather").children[0].scrollIntoView({behavior:"smooth"})
            window.scroll({top:this.find_position(document.getElementById("weather")),behavior:"smooth"})
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
        show_modal() {
            if (this.attribute_modal ==false){
                this.attribute_modal= true
            }else{
                this.attribute_modal = false
            }
        },
        api_attribute(){
            var today = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var dd = String(today.getDate());
            var mm = String(monthNames[today.getMonth()]);
            var yyyy = String(today.getFullYear());
      
            today = dd + ' ' + mm + ' ' + yyyy;
            this.attribution = `Contains information from 2-hour Weather Forecast API accessed on ${today} from DataGov, NEA which is made available under \n the terms of the Singapore Open Data Licence version 1.0 https://data.gov.sg/open-data-licence`
        }
    }
})

weather.component('weather-animation', {
    props: ['forecast'],

    template: `
            <p
                class="my-2">
                <lottie-player :src="imageGIF"  background="transparent"  speed="1"  style="width: 100px; height: 100px;" class="object-contain mx-auto" loop  autoplay>
                </lottie-player>
                {{ warningText }}
            </p>
    `,

    computed: {
        imageGIF(){
            console.log("==== imageGIF running=====");
            if (this.forecast.includes('Cloudy')){
                return "https://assets3.lottiefiles.com/packages/lf20_1eaisi3u.json";
            } else if (this.forecast.includes('Thundery')){
                return "https://assets10.lottiefiles.com/packages/lf20_ystgjqv4.json";
            }  else if (this.forecast == 'Showers' || this.forecast.includes('Rain')) {
                return "https://assets7.lottiefiles.com/packages/lf20_bn1ldors.json";
            }

        },

        warningText(){
            console.log("==== warningText Running =====");

            if (this.forecast.includes('Cloudy')){
                return "Cloudy weather! You will be fine. Stay safe and ride safely!";

            } else if (this.forecast == 'Heavy Thundery Showers with Gusty Winds'){

                return "Please find shelter immediately! It is not safe to ride right now. Always look out for your own safety first!"

            } else if (this.forecast == 'Heavy Thundery Showers'){

                return "Thunderstorms and rain ahead! Seek shelter immediately or refrain from riding right now. Your safety is most important!"

            } else if (this.forecast == 'Thundery Showers') {
                return "Take a break, find shelter or bring a raincoat - Thundery showers are ahead. Be careful and ride safely!"

            } else if (this.forecast == 'Showers' || this.forecast.includes('Rain')) {
                return "Oh dear! Bring an umbrella or a raincoat. Be careful and ride safely!"
            }
        }
    }

})

weather.mount("#weather");

function startTime() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('timetext').innerHTML =  h + ":" + m + ":" + s;
  setTimeout(startTime, 1000);
}

function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}



        