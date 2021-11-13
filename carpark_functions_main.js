async function get_data_mall_available_lots() {
    let data_mall_info = []
    let carpark_rates = await get_mall_carpark_rates()
    let url = "http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
    await axios.get(url,{
        headers: {
          "AccountKey": "xiel9A8oTo6vilri+6ukrQ=="
        }
    })
    .then (response => {
        console.log(response.data)
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
        //console.log(response.data.result.records)
        final_records = response.data.result.records
    })
    .catch(error => {
        console.log(error.message)
    })
    return Promise.resolve(final_records)
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

async function get_all_carparks() {
    let final_carpark_data = { "type": "FeatureCollection", "features": [] }
    let datamall_data = await get_data_mall_available_lots()
    let hdb_data = await get_data_gov_available_lots()
    Array.prototype.push.apply(final_carpark_data["features"],datamall_data)
    Array.prototype.push.apply(final_carpark_data["features"],hdb_data)
    return Promise.resolve(final_carpark_data)
}