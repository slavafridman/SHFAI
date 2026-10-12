<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="activityAimForm" class="bzq.shf.forms.ActivityAimForm"	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<html>
<head>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255" import="bzq.shf.utils.SHFTableUtils"%>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<meta http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<meta name="GENERATOR" content="IBM WebSphere Studio">
<meta http-equiv="Content-Style-Type" content="text/css">
<link href="../theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<script language="JavaScript">

function setChoice(choice) {
	//document.getElementById("rb_value").value = choice;
	var checked =document.getElementById("rb_moked").checked;
	
	if (choice=="moked") {
		document.getElementById("rb_moked").checked="checked";
		
		
	} else {
		document.getElementById("rb_activity").checked="checked";

	}
}

function updateActivity(){
       if (isNaN(document.forms['activityAimForm'].defult.value * 1)){
                alert(" ערך ברירת המחדל חייב להיות נומרי");
                return false;
        } 
	
		for (var i=0; i<24; i++) {
    	   for (var j=0; j<7; j++) {
    	  		if (isNaN(document.getElementById("activityAimArrayValue"+i+j).value * 1)){
                   	alert("  ערך יעד התור חייב להיות נומרי");
                	document.getElementsByName("activityAimArrayValue"+i+j)[0].focus();
					document.getElementsByName("activityAimArrayValue"+i+j)[0].select();
                	return false;
                }	
                if(document.getElementById("activityAimArrayValue"+i+j).value > 3600  ){
					alert("מספר הדקות אינו יכול לעלות על 3600");
					document.getElementsByName("activityAimArrayValue"+i+j)[0].focus();
					document.getElementsByName("activityAimArrayValue"+i+j)[0].select();
					return false;	
                	
             	}
            }
        }
       
        document.forms['activityAimForm'].activityAim.value="";
        for (var j=0; j<7; j++) { 
     	    for (var i=0; i<24; i++) {
    	
		  		var str= document.getElementById("activityAimArrayValue"+i+j).value;
		  	 	var defultValue=document.forms['activityAimForm'].defult.value;
		   		if(str==""){
						  str="0";
					}
			  	if (defultValue!=""){
						str=defultValue;
				}	
				document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+str;
		   		if(i<23){
		    	document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+";";
		    	}
		     }	
		     if(j<6){
			    document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+",";
			 }
		 }
	if (document.forms['activityAimForm'].mode.value =="insert"){
		if (document.getElementById("rb_moked").checked) {
		var x = document.getElementsByName("moked");
		var y = document.getElementsByName("activity");
			if(x[0].value == -1){
				alert("נא לבחור מוקד");
				return false;
			}
			if(y[0].value == ""){
				alert("נא לבחור תור");
				return false;
			}
		}
	}
	document.forms['activityAimForm'].action="/shf/admin/saveActivityAim.do";
	document.forms['activityAimForm'].submit();

}

function delActivity(){
	if (document.forms['activityAimForm'].mode.value =="insert"){
		   alert("ניתן למחוק רק יעדים לתור קיים");
		   return false;
		} 
	if(!(confirm("? למחוק תור זה"))){
		return false;
	}
	
	document.forms['activityAimForm'].action="/shf/admin/deleteActivityAim.do";
	document.forms['activityAimForm'].submit();
	}	
function setDefaults(theValue){
	    
		 if (isNaN(document.forms['activityAimForm'].defult.value * 1)){
                alert(" ערך ברירת המחדל חייב להיות נומרי");
                            return false;
        }
		for (var i=0; i<24; i++) {
			for (var j=0; j<7; j++) {
				document.getElementById("activityAimArrayValue"+i+j).value=theValue.value;
			}
		}
	}
	
</script>
<title>update_activity_aim_param.jsp</title>
<shf:reloadErrors></shf:reloadErrors>
</head>
<%String moked=activityAimForm.getMoked(); %>
<body>
	<form name="activityAimForm" method="post">
		<html:hidden property="activityAim" name="activityAimForm" value=""></html:hidden>
 		<html:hidden property="mode" name="activityAimForm"></html:hidden> 
 		<html:hidden property="activityType" name="activityAimForm"></html:hidden>



<table height="100%" width="100%" cellpadding="0" cellspacing="0"
	dir=rtl>

	<tr>
		<td valign="top" ><jsp:include page="submenu/admin_submenu.jsp" /></td>
	</tr>
	<tr>
		<td valign="top" style="height: 700; padding: 7px 7px 7px 7px">
		<fieldset class=info style="padding: 7px 7px 7px 7px;"><legend>עדכון
		יעד שיחה לתור</legend>


		
		<table height="100%" width="100%">
			<tr>
				<!-- td class=header>אגף:</td>
				<td><shf:unitselect tablename="unitCode" name="orgUnit"
					type="E01" style="font-size:12px;" selectedName="activityAimForm" /></td-->
				
				<%if(  activityAimForm.getMode().equals("insert") ){ %> <%-- Insert new Activity Aim --%>
				<TD>
						<% 
									 if (activityAimForm.getRbChoice()==null) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							>
						<%} else {
										 if (activityAimForm.getRbChoice().equals("activity")) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							>
						<%} else { %> <input id="rb_activity" type="radio" name="rbChoice"
							value="activity"
							>
						<%} %> <%} %>
				</TD>
				<td class="header" nowrap="nowrap" width="60">תור ארצי:</td>
				<td width="50"><bzq:select style="width:140px;font-size:10px;"
					tablename="virtualActivityCode" name="virtualActivity"
					selectedName="activityAimForm" selectedProperty="virtualActivity"></bzq:select>
				</td>
				<td width="50"></td>
				
				<%---- START ---------------------------------------------- Igal 5.2013     --%>
				
				<TD>
						<% if (activityAimForm.getRbChoice()!=null) { %>
								<%if (("moked").equals(activityAimForm.getRbChoice())) { %>
						<input id="rb_moked" type="radio" name="rbChoice" 
							checked="checked" value="moked" onclick="" >
								<%} else { %> <input id="rb_moked" type="radio" name="rbChoice"
							value="moked"  onclick=""  > <%} %>
						<%} else { %>
						<input id="rb_moked" type="radio" name="rbChoice" value="moked"
							 onclick=""  >
						<%} %>
						</TD>
				
				<td class="header" nowrap="nowrap" width="30">מוקד:</td>
				<td width="50"></td>
				
				<td>
				<shf:unitselect tablename="unitCode" name="moked" logic="onchange=setActivities(this,0,'','activityAim');setChoice('moked');"
				 type="G01" style="width:175px;font-size:10px;" emptySelection="yes"/>
				</td>
				<td width="20"></td>
				
				<TD class=header width="25" >תור:</TD>
				<td width="50"></td>
				
				<TD id="activityAjaxResult">
				<%if(moked==null||moked.equals("-1")){ %>
					<shf:localActivitySelectTag tablename="activityCode" name="activity"
					logic=" disabled " style="width:160px;font-size:10px;" />
				<%}else { %>
					<shf:localActivitySelectTag tablename="activityCode" name="activity"
					moked="<%=moked%>" style="width:160px;font-size:10px;" />
				<%}%>
				</TD>
				<td width="20"></td>
				
				
				<%----- END ---------------------------------------------      --%>
				
				<%}else { %> <%-- update Activity Aim --%>
				<td class="header" nowrap="nowrap" width="60">תור:</td>  
				<td width="128">
				<%if("".equals(SHFTableUtils.getVirtualActivityName(activityAimForm.getVirtualActivity()))) { %>
				<%=SHFTableUtils.getActivityName(activityAimForm.getVirtualActivity()) %>
				<%} else { %>
				<%=SHFTableUtils.getVirtualActivityName(activityAimForm.getVirtualActivity()) %>
				<%} %>
				</td>
				<html:hidden property="virtualActivity" name="activityAimForm"></html:hidden>
				<%}%>
				<td width="100"></td>

				<td class="header" nowrap="nowrap" width="80">ברירת מחדל:</td>
				<td width="50"><html:text property="defult"
					name="activityAimForm" style="font-size:12px;" maxlength="4"
					value="" onblur="setDefaults(this);"></html:text></td>
					<td width="300"></td>
			</tr>
		</table>
		
		<div  style="width:100%;height:450px;overflow:auto;border :solid 1px silver;">
		<table width=100% dir="ltr" cellspacing="0">
							<thead>
								<tr bgcolor="white">
									
									<th class="headerAdm" width="12%">יום שבת</th>
									<th class="headerAdm" width="12%">יום ששי</th>
									<th class="headerAdm" width="12%">יום חמישי</th>
									<th class="headerAdm" width="12%">יום רביעי</th>
									<th class="headerAdm" width="12%">יום שלישי</th>
									<th class="headerAdm" width="12%">יום שני</th>
									<th class="headerAdm" width="12%">יום ראשון</th>
									<th class="headerAdm" width="12%">שעה</th>
									
								</tr>
							</thead>
							<tbody>
								
							</tbody>
		</table>
		<table width="100%" dir="ltr" cellspacing="0" >
			<%for(int i=0;i<24;i++){
			%>
			<tr>
			
			<%	
			for(int j=0;j<7;j++){
			%>
			<td class="data"  align="center" width="12%" style="border-left:1px silver solid;" >
			<input type=text style="border-left:1px silver solid;border-right:1px silver solid; " 
			size=4  maxlength=4 name=activityAimArrayValue id=activityAimArrayValue<%=i%><%=j%> value=<%if(!activityAimForm.getActivityAimArray()[j][i].equals("0")){%><%=activityAimForm.getActivityAimArray()[j][i]%><%}%>>
			</td>
			<%}%>
			<TD class="data"  width="12%" align="center" style="border-left:1px silver solid;">
			<%
       		 if(i<10){
			%>
			0<%=i%>:00
			<%}else{%>
			<%=i%>:00
			<%}%></TD>
			</tr>
			<%}%>	
									
		</table>				
		</div>					
		</fieldset>
		</td>
		</tr>
		
	
	<tr>
		<td colspan=5>
		<button onclick="javascript:navigate('/shf/admin/viewActivityAim.do')">חזרה</button>
		&nbsp;
		<button onclick="updateActivity();">שמור</button>
		&nbsp;
		<button onclick="delActivity();">מחק תור</button>
		&nbsp;</td>
	</tr>
</table>
<script type="text/javascript">


</script></form>
</body>

</html>