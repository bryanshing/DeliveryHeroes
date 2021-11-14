//console.log("=== connected to messages.js ====");

const encourage = Vue.createApp({

    data() {
        return  {
            messages_list: [],
            newuser: "",
            inputmessage: "",
            image_url: "",
            nameerror: false,
            messageerror: false,
            imageerror: false, 
            newindex: '',
            submit: false,
        }
    },

    created: function() {
        // Firebase connecting messages
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

        var all_messages = firebase.database().ref('all_messages');

        // PULLING DATA FROM FIREBASE
        all_messages.once('value').then((snapshot) => {
            if(snapshot.exists()) {
                for (let i = Object.keys(snapshot.val()).length; i > 0; i--) {
                    let message = "m" + i
                    this.messages_list.push(snapshot.val()[message])
                }
                //console.log(JSON.parse(JSON.stringify(this.messages_list)))
            }
            else {
                console.log('The read failed');
            }
        });

        let cardsScrollWidth = Infinity
        window.addEventListener('load', function() {
            setInterval(function() {
                if (document.getElementById('cards').scrollLeft !== cardsScrollWidth) {
                    document.getElementById('cards').scrollLeft++
                }
            }, 50);
        });
 
    },

    methods: {
        newMessage(){
            //console.log("==== newMessage() START =====");

            var newMessageObj = {name: this.newuser, message: this.inputmessage, image: this.image_url};
            // var check = newMessageObj == "" || newMessageObj.message == ""
            var check = false;

            if (newMessageObj.name == ""){
                this.nameerror = true
                check = true
            }
            else{
                this.nameerror = false
            }
            if (newMessageObj.message == ""){
                this.messageerror = true
                check = true
            }
            else{
                this.messageerror = false
            }
            if (newMessageObj.image == ""){
                this.imageerror = true
                check = true
            }
            else{
                this.imageerror = false
            }
           
             
            if(!check) {
                //firebase version
                var all_messages = firebase.database().ref('all_messages');  

                var all_messages_json = JSON.parse(JSON.stringify(this.messages_list));
                // console.log(all_messages_json);
                // console.log(Object.keys(all_messages_json).length);
                var newindex = Object.keys(all_messages_json).length+1;
                
                var newmessage = firebase.database().ref('all_messages/m' + newindex);
                newmessage.once('value').then((snapshot) => {
                    if(snapshot.exists()) {
                        alert("This name has already been taken! Try another one!");
                    }
                    else {
                        // add new message data to firebase
                        firebase.database().ref('all_messages/m' + newindex).set({
                            name: newMessageObj.name,
                            message: newMessageObj.message,
                            image: newMessageObj.image
                        }, function(error) {
                            if (error) {
                                console.log("== new user message input failed!!! ===");
                            }
                        });

                        // update the list to reflect new input
                            all_messages.once('value').then((snapshot) => {
                                if(snapshot.exists()) {
                                    this.messages_list = []
                                    for (let i = Object.keys(snapshot.val()).length; i > 0; i--) {
                                        let message = "m" + i
                                        this.messages_list.push(snapshot.val()[message])
                                    }
                                }
                                else {
                                    console.log('The read failed');
                                }
                            });
                    }
                });
                this.submit = false
                this.newuser = ""
                this.inputmessage = ""
                this.image_url = ""
            }      

        },
        cancel_create_message(){
            if (this.submit == false){
                this.submit = true
            }
            else{
                this.submit= false
                this.newuser = ""
                this.inputmessage = ""
                this.image_url = ""
                this.nameerror= false
                this.messageerror= false
                this.imageerror= false
            }
        },

        UploadAndReturnURL(){
            const client = filestack.init('A3OKMHVWCQTJckrjfxIfHz');
            const options = {
              accept: ["image/*"],
              onFileUploadFinished: file => {
                  //console.log(file.url);
                  this.image_url = file.url;
                  //console.log(this.image_url);
              }
            };
            
            client.picker(options).open();
        }
    },

    computed: {
        
    }
})

encourage.component('encourage', {
    props: ['src', 'entry'],

    template: `<div class="bg-white shadow-md border border-gray-200 rounded-lg max-w-sm mb-5 w-64 md:w-72 h-96">
            <img class="rounded-t-lg h-1/3 object-cover w-full" :src="entry.image" alt="">
            <div class="p-5 h-2/3 overflow-y-auto">
                <h5 class="text-gray-900 font-bold text-2xl tracking-tight mb-2">{{ entry.name }}</h5>
            
                <p class="font-normal text-gray-700 mb-3 ">{{ entry.message }}</p>
            </div>
        </div>`
})

encourage.mount("#encourage");
