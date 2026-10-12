// right_menu.js

var menuskin = "right_menu_skin"; // skin0, or skin1
var display_url = 0; // Show URLs in status bar?

function showmenuie5(row) {
	//if(row>0){
		//trmouseclick(row);
		var rightedge = document.body.clientWidth-event.clientX;
		var bottomedge = document.body.clientHeight-event.clientY;
		if (rightedge < ie5menu.offsetWidth)
		ie5menu.style.left = document.body.scrollLeft + event.clientX - ie5menu.offsetWidth;
		else
		ie5menu.style.left = document.body.scrollLeft + event.clientX;
		if (bottomedge < ie5menu.offsetHeight)
		ie5menu.style.top = document.body.scrollTop + event.clientY - ie5menu.offsetHeight;
		else
		ie5menu.style.top = document.body.scrollTop + event.clientY;
		ie5menu.style.visibility = "visible";
	//}
	return false;
}

function hidemenuie5() {
	ie5menu.style.visibility = "hidden";
}

function highlightie5() {
	if (event.srcElement.className == "right_menu_items") {
		event.srcElement.style.backgroundColor = "highlight";
		event.srcElement.style.color = "white";
		if (display_url)
		window.status = event.srcElement.url;
    }
}

function lowlightie5() {
	if (event.srcElement.className == "right_menu_items") {
		event.srcElement.style.backgroundColor = "";
		event.srcElement.style.color = "black";
		window.status = "";
    }
}

function jumptoie5() {
	if (event.srcElement.className == "right_menu_items") {
		if (event.srcElement.getAttribute("target") != null)
		window.open(event.srcElement.url, event.srcElement.getAttribute("target"));
		else
		window.location = event.srcElement.url;
    }
}
