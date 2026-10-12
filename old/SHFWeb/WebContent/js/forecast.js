// forecast.js

///////////////////
function showMissing(ind){
//Yuval Ovadia
	//alert(missData[miss]);
	document.getElementById("popupMissing").style.display='';
	var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1> ";
	data+="<TR><TD valign=top width=100% colspan=2><a href=javascript:clear_popup('popupMissing'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
	data+="<TR><TD colspan=2 class=header><b>פרטי מחסרים:</b></TD></TR>";
	//alert(missData.item.length);
	//var tMissData=missData[1];
	for (i=0;i<missData[ind].length;i++) {
		data+="<TR><TD>"+missData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
	}
	data+="<TABLE>";	
	document.getElementById("popupMissing").innerHTML=data;
}

function showLate(ind){
	//Yuval Ovadia
		
		document.getElementById("popupLate").style.display='';
		var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1>";
		data+="<TR><TD valign=top width=100% colspan=2> <a href=javascript:clear_popup('popupLate'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
		data+="<TR><TD colspan=2 class=header><b>פרטי מאחרים:</b></TD></TR>";
		//alert(missData.item.length);
		//var tMissData=missData[1];
		for (i=0;i<lateData[ind].length;i++) {
			data+="<TR><TD>"+lateData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
		}
		data+="<TABLE>";	
		document.getElementById("popupLate").innerHTML=data;
	}

function showArrivals(ind){
	//Yuval Ovadia
		//alert(lateData[ind]);
		document.getElementById("popupArrival").style.display='';
		var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1 overflow: auto>";
		data+="<TR><TD valign=top width=100% colspan=2> <a href=javascript:clear_popup('popupArrival'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
		data+="<TR><TD colspan=2 class=header><b>פרטי מגיעים:</b></TD></TR>";
		//alert(missData.item.length);
		//var tMissData=missData[1];
		for (i=0;i<arrivalData[ind].length;i++) {
			data+="<TR><TD>"+arrivalData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
		}
		data+="<TABLE>";	
		document.getElementById("popupArrival").innerHTML=data;
	}

function showFutureExit(ind){
	//Yuval Ovadia
		//alert(futureExitData[ind]);
		document.getElementById("popupfutureExit").style.display='';
		var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1 overflow: auto>";
		data+="<TR><TD valign=top width=100% colspan=2> <a href=javascript:clear_popup('popupfutureExit'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
		data+="<TR><TD colspan=2 class=header><b>פרטי יוצאים:</b></TD></TR>";
		//alert(missData.item.length);
		//var tMissData=missData[1];
		for (i=0;i<futureExitData[ind].length;i++) {
			data+="<TR><TD>"+futureExitData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
		}
		data+="<TABLE>";	
		document.getElementById("popupfutureExit").innerHTML=data;
	}

function showMarked(ind){
	//Yuval Ovadia
		//alert(futureExitData[ind]);
		document.getElementById("popupmarked").style.display='';
		var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1 overflow: auto>";
		data+="<TR><TD valign=top width=100% colspan=2> <a href=javascript:clear_popup('popupmarked'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
		data+="<TR><TD colspan=2 class=header><b>פרטי שינויים של נוכחים:</b></TD></TR>";
		//alert(missData.item.length);
		//var tMissData=missData[1];
		for (i=0;i<markedData[ind].length;i++) {
			data+="<TR><TD>"+markedData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
		}
		data+="<TABLE>";	
		document.getElementById("popupmarked").innerHTML=data;
	}

function showExceptionSHF(ind){
	//Yuval Ovadia
		//alert(futureExitData[ind]);
		document.getElementById("popupexcepSHF").style.display='';
		var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0 border=1 overflow: auto>";
		data+="<TR><TD valign=top width=100% colspan=2> <a href=javascript:clear_popup('popupexcepSHF'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
		data+="<TR><TD colspan=2 class=header><b>פרטי פעילויות:</b></TD></TR>";
		//alert(missData.item.length);
		//var tMissData=missData[1];
		for (i=0;i<excepSHFData[ind].length;i++) {
			data+="<TR><TD>"+excepSHFData[ind][i]+"&nbsp;&nbsp;&nbsp;&nbsp;</TD></TR>";
		}
		data+="<TABLE>";	
		document.getElementById("popupexcepSHF").innerHTML=data;
	}
function showCallingDetails(date,hour,activity) {
	document.getElementById('forecastExcDetailsDiv').style.display='';
	document.getElementById('forecastExcDetailsDiv').innerHTML='<span width=100% align=center><br><img align=center src=/shf/images/wait.gif></span>';
	
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("forecastExcDetailsDiv").style.display='';
			document.getElementById("forecastExcDetailsDiv").innerHTML=xmlHttp.responseText;
		}
		else{
			document.getElementById("forecastExcDetailsDiv").innerHTML='';
		}
	}
	xmlHttp.open("GET","/shf/forecast/callingResultDetails.do?date="+date+"&time="+hour+"&activity="+activity);
	xmlHttp.send(null);
}


/////////////////////
function showBreakDetails(date,hour,activity) {
	document.getElementById('forecastExcDetailsDiv').style.display='';
	document.getElementById('forecastExcDetailsDiv').innerHTML='<span width=100% align=center><br><img align=center src=/shf/images/wait.gif></span>';
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("forecastExcDetailsDiv").style.display='';
			document.getElementById("forecastExcDetailsDiv").innerHTML=xmlHttp.responseText;
		}
		else{
			document.getElementById("forecastExcDetailsDiv").innerHTML='';
		}
	}
	xmlHttp.open("GET","/shf/forecast/breakResultDetails.do?date="+date+"&time="+hour+"&activity="+activity);
	xmlHttp.send(null);	
}


////////////////////
function showExceptionDetails(date,hour,activity,exception) {
	document.getElementById('forecastExcDetailsDiv').style.display='';
	document.getElementById('forecastExcDetailsDiv').innerHTML='<span width=100% align=center><br><img align=center src=/shf/images/wait.gif></span>';
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("forecastExcDetailsDiv").style.display='';
			document.getElementById("forecastExcDetailsDiv").innerHTML=xmlHttp.responseText;
		}
		else{
			document.getElementById("forecastExcDetailsDiv").innerHTML='';
		}
	}
	xmlHttp.open("GET","/shf/forecast/exceptionResultDetails.do?date="+date+"&time="+hour+"&activity="+activity+"&exception="+exception);
	xmlHttp.send(null);	

}

////////////////////////////
function showAllExceptionDetails(date,hour,activity){
	document.getElementById('forecastExcDetailsDiv').style.display='';
	document.getElementById('forecastExcDetailsDiv').innerHTML='<span width=100% align=center><br><img align=center src=/shf/images/wait.gif></span>';
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("forecastExcDetailsDiv").style.display='';
			document.getElementById("forecastExcDetailsDiv").innerHTML=xmlHttp.responseText;
		}
		else{
			document.getElementById("forecastExcDetailsDiv").innerHTML='';
		}
	}
	xmlHttp.open("GET","/shf/forecast/exceptionAllResultDetails.do?date="+date+"&time="+hour+"&activity="+activity);
	xmlHttp.send(null);	
}