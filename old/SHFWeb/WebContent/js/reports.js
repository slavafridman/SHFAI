// reports.js

// newFunction
function approveReport(agentDay) {
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
			document.getElementById("approveLinkTD"+agentDay).innerHTML="אושר";
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/approveReport.do?agentDayId="+agentDay);
	xmlHttp.send(null);	
}