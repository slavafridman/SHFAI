// shiftjs.js
//

function returnResults(data, ioArgs, isPotential){
	var result = data;
	if( result.match("success") == null )
		{
		top.frMsgBar.location.href="/shf/msgBar.do";
		}
	else
		{
		document.location='/shf/replace/searchForCandidate.do?'+selectedRow+(isPotential ? '&switchPotential=true' : "");
   		}
	
}
//function returnResultsPotential(data, ioArgs){
//	var result = data;
//	if( result.match("success") == null )
//		{
//		top.frMsgBar.location.href="/shf/msgBar.do";
//		}
//	else
//		{
//		alert("success !!!");
//		//document.location='/shf/replace/searchForCandidatePotential.do?'+selectedRow;
//   		}
//	
//}

function catchError(data) {
	
}

function checkShiftForSwitch( isPotential ){

	var actionUrl = "/shf/replace/checkForChangeShift.do?"+selectedRow; 
	
//	dojo.xhrPost({url:actionUrl,load:returnResults(isPotential),error:catchError,handleAs:'text'});
	dojo.xhrPost({	
					url:actionUrl,
					load:function( data, ioArgs ){
						returnResults(data, ioArgs, isPotential);
					},
					error:catchError,
					handleAs:'text'
				});
	
//	alert("XXXXXXX = " + selectedRow);
//	alert(selectedRow);
//	var xmlHttp;
//	try{  
//		xmlHttp=new XMLHttpRequest();  
//	}
//	catch (e){  
//		try{    
//			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
//		}catch (e){    
//			try{      
//				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
//			}catch (e){      
//				alert("Your browser does not support AJAX!");      
//				return;      
//			}    
//		}  
//	}
//	xmlHttp.onreadystatechange=function(){
//		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
//			alert("YYYYY = " + xmlHttp.status);
//			alert(xmlHttp.responseText.match("success"));
//			if( xmlHttp.responseText.match("success") == null )
//				{
//				top.frMsgBar.location="/shf/msgBar.do";
//				}
//			else
//				{
//				document.location='/shf/replace/searchForCandidate.do?'+selectedRow;
//	       		}
// 			}
//	}
//	alert("ZZZZZ = "+selectedRow);
//	xmlHttp.open("GET","/shf/replace/checkForChangeShift.do?"+selectedRow);
//	xmlHttp.send(null);	
}
function checkShiftForSwitchPotentials(){
	var actionUrl = "/shf/replace/checkForChangeShift.do?"+selectedRow; 
	dojo.xhrPost({url:actionUrl,load:returnResultsPotential,error:catchError,handleAs:'text'});
}
function viewCancelShiftRemarkDialog(empid){
	
}

function checkShiftForCancel(empid){
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
			document.getElementById("cancelPopupDiv").style.display='';
			document.getElementById("cancelPopupDiv").innerHTML=xmlHttp.responseText;
 		}
	}
	xmlHttp.open("GET","/shf/shift/shiftCancelRemarkDialog.do?"+selectedRow+"&employeeId="+empid);
	xmlHttp.send(null);	
}

function checkShiftForCancelForReduce(empid){
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
			//alert(xmlHttp.responsetext.match("success"));
			if( xmlHttp.responseText.match("success") == null ){
				top.frMsgBar.location="/shf/msgBar.do";
			}else{
				if(!empid>0){
					document.location="/shf/shift/searchResult.do?"+selectedRow;
					}
				else {
					document.location="/shf/employee/getShiftsParam.do?employeeId="+empid;
					}
				//alert("befor");	
				//top.frMsgBar.document.getElementById('messageBarArea').innerHtml = "jhfjjhf";	
				//alert("after  : "+ top.frMsgBar.document.getElementById('messageBarArea').innerHtml );
	       	}
 		}
	}
	xmlHttp.open("GET","/shf/shift/checkForCancelShift.do?"+selectedRow);
	xmlHttp.send(null);	
}

function deleteFromRepositories(){
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
				return;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
		}
	}
	xmlHttp.open("GET","/shf/shift/deleteFromRepositories.do?"+selectedRow);
	xmlHttp.send(null);
}

