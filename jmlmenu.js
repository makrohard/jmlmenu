/*
jmlMenu  v0.1 alpha
Open and close dropdown menu, combines hover and click events.
* Looks for <ul class="menu"> and scans menu structure.
* Stores menu elements in object and writes the adress to <li> + <button> and <a> elements
* Writes inline styles, to overwrite css hover
=> Developed to minimize DOM access while using. Needs time for initial scan and memory to store elements.   

The MIT License (MIT)

(c) 2016 Johannes Loose, johannes@35007.de

*/

window.addEventListener('click', function () { // global click handler to close menu
  if (jmlmenu.currentlyopen.length > 0) {
    jmlmenu.currentlyopen = jmlmenu.openmenu('');
  }
});


// * * * * * * * * * * * * * * * * * * *
// * * * * * Menu Constructor * * * * *
// * * * * * * * * * * * * * * * * * * 

function JmlMenu () {
	'use strict';
  this.menuelements = initmenu(); // store menu elements
  this.currentlyopen = ''; // store address of currently open menu
  
  function initmenu() {
    var mainul =  document.getElementsByClassName('menu'); // get main ul
    if (!(mainul[0] || mainul[0].nodeName !== 'UL')) return false; // <ul class="menu"> not found'
    mainul[0].addEventListener('click', function (event) {event.stopPropagation();}); // prevent menuclosing 
    //store menu elements
    var menu = { 
      depth : 0, // nesting count
      position : [-1], // position array
      element : {} 
    };       
    menu = processul(mainul[0], menu);     
    return menu.element;       
  }

  // parses ul/li structure recursively
  function processul(ulelem, menu) {
    var elems = ulelem.childNodes;
    var myelem = '';
    var myelemlength = '';
    var element = {};
        
    getlis(elems).forEach(function (myli) {
      element = { };
      myelem = myli.childNodes;
      myelemlength = myelem.length;
      if (menu.position[menu.depth] === undefined) menu.position[menu.depth] = -1; // create new position if needed
      menu.position[menu.depth]++; // increase position
      doli(myli, menu); // do things for li
      for (var i = 0; i < myelemlength; i++) { // loop elements in li
        switch(myelem[i].nodeName) {
          case 'BUTTON':
            if (element.button === undefined) { //use only first button in li
              dobutton(myelem[i], menu); // do things
             }
            break;
          case 'A': 
            if (element.button === undefined) { // same for links
              dobutton(myelem[i], menu);
             }
            break;
          case 'UL': // make sublist
            if (element.ul === undefined) {
              element.ul = myelem[i];
              doul(myelem[i], menu);
             }
            break;
          case '#text' : // do nothing for textnode
            break;
          default:
            doother(myelem[i], menu); // do things on every other element            
        }
      } // end elements loop
      if (element.ul !== undefined) { // if ul has been found in li        
        menu.element['K' + menu.position.join('-')] = element; // put element in object
        menu.depth++; // increase menu depth
        processul(element.ul, menu); // *** recursive call
        menu.depth--; // reduce depth
      }
    }); // end li foreach
  menu.position.pop(); // reduce position
  return menu;
  }
  
  // do things on <li>
  function doli(myli, menu) {
    myli.setAttribute('data-position', menu.position.join('-')); // write position to element
    myli.addEventListener("mouseenter", function(event) { jmlmenu.hover(event, 'block'); }); // add hover listener     
    myli.addEventListener("mouseleave", function(event) { jmlmenu.hover(event, 'none'); });
  }
  
  // do things on <ul>
  function doul(myul, menu) {
     myul.style.display ='none'; // hide uls with inline style to overwrite css hover
  }
  
  // do things on <button> or <a>
  function dobutton(mybutton, menu) {
    mybutton.setAttribute('data-position',menu.position.join('-'));
    mybutton.addEventListener('click', function (event) {jmlmenu.click(event);}); // add click listener
  }
  
  // do things on every other element in li, except #textnodes (nothing, so far)
  function doother(myelem, menu) {
    //myelem.setAttribute('data-position',menu.position.join('-'));
  }

  // get li elems from nodelist
  function getlis(elems) {
    var elemslength = elems.length;
    var lielems = [];
    for (var i = 0; i < elemslength; i++) {
      if (elems[i].nodeName === 'LI') {
        lielems.push(elems[i]);
      }
    }
    return lielems;
  }  
}

// * * * * * * * * * * * * * * * * * * * *
// * * * * * Menu Prototype  * * * * * *
// * * * * * * * * * * * * * * * * * * 
JmlMenu.prototype = {
  constructor : JmlMenu,
  
  hover : function (event, style) {
    if (this.menuelements.hasOwnProperty(('K'+ event.target.dataset.position)) && 
        this.menuelements[('K'+ event.target.dataset.position)].hasOwnProperty('ul') &&
        this.currentlyopen.length < event.target.dataset.position.length) {
      this.menuelements[('K'+ event.target.dataset.position)].ul.style.display = style;
    }
  },
  
  click : function (event) {    
    if (this.menuelements.hasOwnProperty(('K'+ event.target.dataset.position)) && 
        this.menuelements[('K'+ event.target.dataset.position)].hasOwnProperty('ul')) {
      this.currentlyopen =  this.openmenu(event.target.dataset.position);   
    }
  },
  
  // closes currently open menu, opens new menu
  openmenu : function (menutoopen) {
    var toopen = menutoopen.split('-'); // convert address string to array
    var isopen = this.currentlyopen.split('-');
    var toopenlevel = '';
    var isopenlevel = '';
    var depth = toopen.length > isopen.length ? toopen.length : isopen.length;
    var ret = menutoopen;

    for (var i = 0; i < depth; i++) { // loop menu depths
       if (i < toopen.length) { // get position string for menu to open
        toopenlevel = i > 0 ? toopenlevel += ('-' + toopen[i]) : toopenlevel += (toopen[i]);
       } else {
         toopenlevel = '';
       }
       if (i < isopen.length) { // get position string for menu to close
        isopenlevel = i > 0 ? isopenlevel += ('-' + isopen[i]) : isopenlevel += (isopen[i]);
       } else {
         isopenlevel = '';
       }       
       if (toopenlevel !== isopenlevel) { // close old level, open new
         if (isopenlevel.length > 0) this.menuelements[('K'+ isopenlevel)].ul.style.display = 'none';
         if (toopenlevel.length > 0) this.menuelements[('K'+ toopenlevel)].ul.style.display = 'block';         
       } else { // toogle
        if (i === depth -1 && isopenlevel.length > 0) { 
          if(this.menuelements[('K'+ isopenlevel)].ul.style.display === 'block') {
            this.menuelements[('K'+ isopenlevel)].ul.style.display = 'none';
            toopen.pop();
            ret = toopen.join('-');
          } else {
            this.menuelements[('K'+ isopenlevel)].ul.style.display = 'block';
          }
        }}               
    }
    return ret;    
  }
};

// make instance of Menu
var jmlmenu = new JmlMenu();