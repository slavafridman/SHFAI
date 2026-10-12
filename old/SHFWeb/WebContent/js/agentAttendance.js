// agentBreaks.js

/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/


/*  Yuval - 19.10.09
function exitShift(shiftEnd){
	alert(shiftEnd)
	var now = new Date();
	var minuteBefor = (shiftEnd - now)/1000/60;
	var parameter = 350;
	if  ( (minuteBefor <= parameter) ) 
	{
		alert("aaaa");
		var accept=window.confirm("הינך עומד לצאת לפני הזמן המותר, האם אתה בטוח שברצונך לצאת מהמשמרת ");
		if(accept) document.earlyExitShiftForm.submit();
		else return;
	}	
	else 
	{
		alert("zzzz");
		var accept=window.confirm("האם אתה בטוח שברצונך לצאת מהמשמרת ");
		if(accept) document.exitShiftForm.submit();
		else return;
	}
}	
*/

function exitShift(maxInactive,lastAccess){
	Stamp = new Date().getTime();
	if(Stamp-lastAccess>=maxInactive*1000 + 10000){
		alert("פעולתך לא נקלטה במערכת, נא לחזור על הפעולה שוב אחרי שהמערכת תבצע כניסה מחדש");
		window.top.document.location="/shf/login.do";
		return;
	}
	
	var accept=window.confirm("האם אתה בטוח שברצונך לצאת מהמשמרת ");
	if(accept) document.exitShiftForm.submit(); else return;
}

function earlyExitShift(){
	var temp= " שם מאשר: " + document.exitShiftForm.manager.value + " - "  + document.exitShiftForm.remark.value ;
	
	var accept=window.confirm("האם אתה בטוח שברצונך לצאת מוקדם מהמשמרת ");
	if(accept) { 
		document.exitShiftForm.remark.value = temp;
		document.exitShiftForm.submit(); 
	}
	else {
		return;
	}
}	

function exitToBreak(num,maxInactive,lastAccess){
	Stamp = new Date().getTime();
	if(Stamp-lastAccess>=maxInactive*1000 + 5000){ //5 seconds buffer
		alert("פעולתך לא נקלטה במערכת, נא לחזור על הפעולה שוב אחרי שהמערכת תבצע כניסה מחדש");
		window.top.document.location="/shf/login.do";
		return;
	}
	var accept=window.confirm("האם אתה בטוח שברצונך לצאת להפסקה ");
	if(accept) document.getElementById("exitToBreakForm"+num).submit();
	//document.exitToBreakForm.submit();
}

function backFromBreak(num,maxInactive,lastAccess){
	Stamp = new Date().getTime();
	if(Stamp-lastAccess>=maxInactive*1000 + 10000){
		alert("פעולתך לא נקלטה במערכת, נא לחזור על הפעולה שוב אחרי שהמערכת תבצע כניסה מחדש");
		window.top.document.location="/shf/login.do";
		return;
	}
	//Yuval fix bug - 
	document.getElementById("btBackFromBreak"+num).disabled = "disabled";
	document.getElementById("backFromBreakForm"+num).submit();
}