//console.log("==== connected to navbar.js =======");

const navbar = Vue.createApp({

})

navbar.component('navigation-bar', {
    props:["main_link","carpark_link","reststop_link","is_home","is_carpark","is_reststop"],
    template: `
        <nav class="nav flex flex-wrap items-center justify-between px-4 pt-4 mb-4">
            <div class="flex flex-no-shrink items-center mr-6 py-3 text-grey-darkest">
                <h1 class="text-xl md:text-2xl tracking-wide ml-2">Delivery Heroes</h1>
            </div>
    
            <input class="menu-btn hidden" type="checkbox" id="menu-btn">
            <label class="menu-icon block cursor-pointer md:hidden px-2 py-4 relative select-none" for="menu-btn">
                <span class="navicon bg-grey-darkest flex items-center relative"></span>
            </label>
    
            <ul id="menu" class="menu border-b md:border-none flex justify-end list-reset m-0 w-full md:w-auto">
                <li class="border-t md:border-none">
                    <a :href=main_link class="block md:inline-block px-2 py-3 md:pb-1 no-underline text-grey-darkest text-sm md:text-lg hover:text-grey-darker" :style=is_home>Home</a>
                </li>
        
                <li class="border-t md:border-none">
                    <a :href=carpark_link class="block md:inline-block px-2 py-3 md:pb-1 no-underline text-grey-darkest text-sm md:text-lg hover:text-grey-darker" :style=is_carpark>Carpark</a>
                </li>
        
                <li class="border-t md:border-none">
                    <a :href=reststop_link class="block md:inline-block px-2 py-3 md:pb-1 no-underline text-grey-darkest text-sm md:text-lg hover:text-grey-darker" :style=is_reststop>Rest Stops</a>
                </li>
            </ul>
        </nav>
    `
})

navbar.mount("#navbar");

