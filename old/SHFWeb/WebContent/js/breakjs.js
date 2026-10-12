// breakjs.js

function viewBreak(agentDay){
	//document.getElementById('myExceptionsDiv').style.display='';
	//document.getElementById('myExceptionsDiv').innerHTML='<span width=100% align=center><img align=center src=/shf/images/wait.gif></span>';
	var xmlHttp;
	try{ 
		xmlHttp=new XMLHttpRequest(); 
	}catch (e){ 
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
		if (xmlHttp.readyState==4 ) {
			document.getElementById('myExceptionsDiv').style.display='';
			document.getElementById('myExceptionsDiv').innerHTML= xmlHttp.responseText;
		}
		else{
			document.getElementById('myExceptionsDiv').innerHTML='';
			document.getElementById('myExceptionsDiv').style.display='none';
		}
	}
	xmlHttp.open("GET","/shf/break/breakForShift.do?agentDayId="+agentDay);
	xmlHttp.send(null); 
}
	
	
function checkBreak(dayId, breakStartTime, breakEndTime, employeeId, duration){
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
			if( xmlHttp.responseText.length>200 )
				{
				document.location="/shf/break/goForChangeBreak.do?startTime="+breakStartTime+"&agentDayId="+dayId+"&endTime="+breakEndTime+"&employeeId="+employeeId+"&isNewCandidate=1&duration="+duration;
				}
			else
				{
				top.frMsgBar.location="/shf/msgBar.do";
	       		}
 			}
	}
	xmlHttp.open("GET","/shf/break/checkForChangeBreak.do?agentDayId="+dayId+"&startTime="+breakStartTime);
	xmlHttp.send(null);	
}

function changeBreaksNumber(formName){
	var num=formName.breaksNumber.value;
	if(num==1){
		document.getElementById("break1").style.display=''; 
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}else if(num==2){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='none';
	}else if(num==3){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='';
	}else{
		document.getElementById("break1").style.display='none';
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}
}