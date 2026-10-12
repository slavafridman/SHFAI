<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>submenu.jsp</TITLE>

<SCRIPT>
var openPop=null;
function popVisible(pop,over)
{ 
	thePop=document.getElementById(pop);
	if(thePop.style.visibility=='hidden')
	{
		try{
		openPop.style.visibility='hidden';
		}catch(e)
		{}
		thePop.style.visibility='visible';
		openPop=thePop;
	}else{
		if(over==0 && openPop!=null){
			thePop.style.visibility='hidden';
			openPop=null;
		}
	}
	/*sels=document.getElementsByTagName("select");
	for(i=0;i<sels.length;i++){
		sels[i].style.visibility='hidden';
	}*/
}
function closePop()
{
	try{
		openPop.style.visibility='hidden';
	}catch(e){}
	/*sels=document.getElementsByTagName("select");
	for(i=0;i<sels.length;i++){
		sels[i].style.visibility='visible';
	}*/
}

function moveSelectedShift(){
	try{
		moveShift();
	}catch(e){
		alert("פעולה זו אפשרית אך ורק ממסך תפעול משמרות");
	}
}

function cancelSelectedShift(){
	try{
		cancelShift(0);
	}catch(e){
		alert("פעולה זו אפשרית אך ורק ממסך תפעול משמרות");
	}
}

function forceSwitchSelectedShift(){
	try{
		forceSwitchShift();
	}catch(e){
		alert("פעולה זו אפשרית אך ורק ממסך תפעול משמרות");
	}
}

function switchSelectedShift(){
	try{
		switchShift();
	}catch(e){
		alert("פעולה זו אפשרית רק ממסך משמרת שלי או תפעול משמרות");
	}
}
</SCRIPT>

</HEAD>
<BODY>
<TABLE width="100%" cellpadding="0" cellspacing="0" align="right">
	<TBODY>
		<TR bgcolor="#F4C531">
			<TD
				align="right"
				nowrap="nowrap"
				height="20"><!--Sub menu-->
			<TABLE
				width="100%"
				border="0"
				cellspacing="0"
				cellpadding="0"
				height="16">
				<TBODY>
					<TR>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap="nowrap"
							onmouseover="popVisible('popup2',1);document.getElementById('maintd2').className='upmenuButtonTextOver';"
							onmouseout="popVisible('popup2',0);document.getElementById('maintd2').className='upmenuButtonText';"
							onclick="popVisible('popup2',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/view.gif"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD id="maintd2"
										class="upmenuButtonText"
										>הצגה</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup2"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							cellspacing="0"
							cellpadding="0" style="border: 1px silver solid;"
							onmouseover="document.getElementById('maintd2').className='upmenuButtonTextOver'"
							onmouseout="document.getElementById('maintd2').className='upmenuButtonText'">
							<TBODY>
								
								
								<shf:security activity="shift_current">
								<TR>
									<TD width="80px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/currentParam.do');">מצב עדכני</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="shift_search">
								<TR>
									<TD width="90px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/searchParam.do');">תפעול משמרות</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="shift_myshifts">
								<TR>
									<TD width="90px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/myShiftParam.do');">המשמרת שלי</TD>
								</TR>	
								</shf:security>
								
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						<TD style="font-size: 11px; color: a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap="nowrap"
							onmouseover="popVisible('popup3',1);document.getElementById('maintd3').className='upmenuButtonTextOver';"
							onmouseout="popVisible('popup3',0);document.getElementById('maintd3').className='upmenuButtonText';"
							onclick="popVisible('popup3',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/add.gif"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD id="maintd3"
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">הוספה</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup3"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							cellspacing="0"
							cellpadding="0" style="border: 1px silver solid;"
							onmouseover="document.getElementById('maintd3').className='upmenuButtonTextOver'"
							onmouseout="document.getElementById('maintd3').className='upmenuButtonText'">
							
							<TBODY>
								
								
								<shf:security activity="shift_inforce_update">
								<TR>
								<TD width="130px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/addInforceReqParam.do');">הוסף משמרת לתגבור</TD>
									
								</TR>
								</shf:security>
								<shf:security activity="shift_inforce_view">
								<TR>
								<TD width="130px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/inforceShift.do?mode=populate');">מאגר משמרות לתגבור</TD>		
								</TR>
								</shf:security>
								<shf:security activity="shift_inforce_agent">
								<TR>
								<TD width="130px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/inforceSearchOptionals.do');">הוסף משמרת</TD>
								</TR>
								</shf:security>
								
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						
						<TD style="font-size: 11px; color: a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap="nowrap"
							onmouseover="popVisible('popup4',1);document.getElementById('maintd4').className='upmenuButtonTextOver';"
							onmouseout="popVisible('popup4',0);document.getElementById('maintd4').className='upmenuButtonText';"
							onclick="popVisible('popup4',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/delete-16.gif"
										width="14"
										height="14"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD id="maintd4"
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">מחיקה</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup4"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							cellspacing="0"
							cellpadding="0" style="border: 1px silver solid;"
							onmouseover="document.getElementById('maintd4').className='upmenuButtonTextOver'"
							onmouseout="document.getElementById('maintd4').className='upmenuButtonText'">
							
							<TBODY>
								
								
								<shf:security activity="reduce_update">
								<TR>
									<TD width="155px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/reduce/addUpdateReduceShiftReq.do?mode=insert');">הוסף בקשת צמצום משמרות</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="shift_cancel">
								<TR>
									<TD width="155px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:cancelSelectedShift();">ביטול משמרת לעובד</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="reduce_update">
								<TR>
									<TD width="155px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/reduce/reduceShiftReq.do');">מאגר משמרות לצמצום</TD>
								</TR>	
								</shf:security>
								<shf:security activity="reduce_agent">
								<TR>	
									<TD width="100px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/reduce/reduceShiftReqOptions.do');">צמצום משמרות</TD>
								</TR>	
								</shf:security>
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						
						<TD style="font-size: 11px; color: a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap="nowrap"
							onmouseover="popVisible('popup5',1);document.getElementById('maintd5').className='upmenuButtonTextOver';"
							onmouseout="popVisible('popup5',0);document.getElementById('maintd5').className='upmenuButtonText';"
							onclick="popVisible('popup5',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/update.gif"
										
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD id="maintd5"
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">עדכון</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup5"
							class="popup"
							style="visibility: hidden;"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							cellspacing="0"
							cellpadding="0" style="border: 1px silver solid;"
							onmouseover="document.getElementById('maintd5').className='upmenuButtonTextOver'"
							onmouseout="document.getElementById('maintd5').className='upmenuButtonText'">
							
							<TBODY>
								
								
								<shf:security activity="addShiftTimeChange">
								<TR>
									<TD width="180px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/addShiftTimeChangeParam.do');">הוסף בקשת שינוי משמרת המוני</TD>
								</TR>
								</shf:security>
								<shf:security activity="shift_update">
									<TR>
									<TD width="115px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:moveSelectedShift();">שינוי משמרת לעובד</TD>
										</TR>
								</shf:security>
								<shf:security activity="addShiftTimeChange">
								<TR>
									<TD width="125px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/viewShiftTimeChangeRequests.do');">מאגר משמרות לשינוי</TD>
									</TR>	
								</shf:security>
								
								<shf:security activity="agentShiftTimeChange">
								<TR>
									<TD width="110px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/viewAgentChangeRequests.do');">שינוי משמרת</TD>
								</TR>
								</shf:security>
								
							</TBODY>
						</TABLE>
						
						</DIV>
						</TD>
						
						<TD style="font-size: 11px; color: a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap="nowrap"
							onmouseover="popVisible('popup6',1);document.getElementById('maintd6').className='upmenuButtonTextOver';"
							onmouseout="popVisible('popup6',0);document.getElementById('maintd6').className='upmenuButtonText';"
							onclick="popVisible('popup6',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/fswitch2.gif"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD id="maintd6"
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">החלפה</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup6"
							class="popup"
							style="visibility: hidden;"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							cellspacing="0"
							cellpadding="0" style="border: 1px silver solid;"
							onmouseover="document.getElementById('maintd6').className='upmenuButtonTextOver'"
							onmouseout="document.getElementById('maintd6').className='upmenuButtonText'">
							
							<TBODY>
								
								
								<shf:security activity="replace_main">
								<TR>
									<TD width="95px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:switchSelectedShift();">החלפת משמרת</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="replace_main">
								<TR>
									<TD width="135px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/shift/inforceShift.do?mode=populate');">מאגר משמרות להחלפה</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="switch_forced">	
								<TR>
									<TD width="95px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:forceSwitchSelectedShift();">החלפה מאולצת</TD>
										</TR>
								</shf:security>
								<shf:security activity="break_replace">
								<TR>
									<TD width="130px"
										nowrap="nowrap"
										class="subMenuButtonText2"
										align="right"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="javascript:navigate('/shf/break/showManageBreak.do');">מאגר הפסקות להחלפה</TD>
									</TR>	
								</shf:security>
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
					
						<TD width="100%">&nbsp;</TD>
						<TD style="padding-left: 10px;"
							align="left"
							valign="top"
							nowrap="nowrap"
							dir="ltr"
							height="14">
							<CENTER>
	<TABLE align="left"
		border="0"
		cellpadding="0"
		cellspacing="0">
		<TBODY>
			<TR>
				<TD
					class="upmenuButtonText"
					onmouseover="this.className='upmenuButtonTextOver'"
					onmouseout="this.className='upmenuButtonText'"
					onclick="javascript: goBack();">חזרה</TD>
				<TD
					width="20"
					height="16"><IMG border="0" src="/shf/images/back.gif"
					width="16"
					height="10"
					hspace="3"
					vspace="0"
					align="middle">
					</TD>										
				<TD
					width="20"
					height="16"><IMG border="0" src="/shf/images/letter.gif"
					height="10"
					style="cursor: hand;"
					hspace="3"
					vspace="0"
					align="middle"
					onclick="javascript:navigate('/shf/message/messages.do');">
				
				</TD>
				<TD
					width="20"
					height="16"><IMG border="0" src="/shf/images/about.gif"
					height="10"
					style="cursor: hand;"
					hspace="3"
					vspace="0"
					align="middle"
					onclick="window.open('/shf/jsp/about.jsp','about','width=250 , height=130 , resizable=no, scrollbars=no, toolbar=no, location=no, directories=no, status=no');">
					
				</TD>
			</TR>
		</TBODY>
	</TABLE>
</CENTER>
						</TD>
					</TR>
				</TBODY>
				
			</TABLE>
			<!--Sub menu--></TD>
			
		</TR>
	</TBODY>
</TABLE>
</BODY>
