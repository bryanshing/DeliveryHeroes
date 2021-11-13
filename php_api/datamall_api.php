<?php

// DataMall APIs
// https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf
//  Carpark (Malls + Blocks)
//  - http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
//  -- "AccountKey" : "xiel9A8oTo6vilri+6ukrQ=="

header("Access-Control-Allow-Origin: *");

$options = [
    "http" => [
        "header" => "AccountKey: xiel9A8oTo6vilri+6ukrQ=="
    ]
];

$content = stream_context_create($options);

$data = file_get_contents("http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2",false,$content);

$data_arr = json_decode($data,true);
$new_data = json_encode($data_arr['value'],true);


echo($new_data);



?>