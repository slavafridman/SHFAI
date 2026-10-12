// author : morad zeidan
//-----------------------

function  mouseclick(obj,action,target,isgrid){
	var arr=document.getElementById("mytabsdiv").getElementsByTagName("a");
	var i=0;
	for(i=0;i<arr.length;i++){
		arr[i].className="mytabsbutton";
	}
	obj.className="mytabsbuttonclick";
	document.getElementById(action).submit();
}


function drawTabs(headers,actions,target){
	var i;
	for(i=0;i<headers.length;i++){
		document.write("<a onclick=mouseclick(this,'"+actions[i]+"','"+target+"','"+actions[i][2]+"'); class='mytabsbutton'>"+headers[i]+"</a>");
	}
}

