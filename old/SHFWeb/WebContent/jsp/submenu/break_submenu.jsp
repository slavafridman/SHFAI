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
	
}
function closePop()
{
	try{
		openPop.style.visibility='hidden';
	}catch(e){}
}

</SCRIPT>

</HEAD>
<BODY>
<TABLE width=88% cellpadding="0" cellspacing="0" align=right>
	<TBODY>
		<TR bgcolor="#F4C531">
			<TD
				align="right"
				nowrap
				height="20"><!--Sub menu-->
			<TABLE
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
							nowrap
							onmouseover="popVisible('popup2',1)"
							onmouseout="popVisible('popup2',0);"
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
										src="/shf/images/clock.gif"
										width="14"
										height="14"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">הפסקות</TD>
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
							width="100%"
							cellspacing="1"
							cellpadding="1"
							class="subMenu">
							<TBODY>
						<shf:security activity="shift_search">
								<TR>
									<TD class="subMenuButtonText" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('');">תפריט 1</TD>
								</TR>
								</shf:security>
						
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						<shf:security activity="shift_inforce_view">
						<TD style="font-size: 11px; color:a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup3',1)"
							onmouseout="popVisible('popup3',0);"
							onclick="popVisible('popup3',0);"
							dir="rtl"
							height="14">
						</TD>
						</shf:security>
										
					</TR>
				</TBODY>
				
			</TABLE>
			<!--Sub menu--></TD>
		
		</TR>
	</TBODY>
</TABLE>


<TABLE width=100% cellpadding="0" cellspacing="0" align=right>
	<TBODY>
		<TR bgcolor="#f4c531">
			<TD
				align="right"
				nowrap
				height="20"><!--Sub menu-->
			<TABLE
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
							nowrap
							dir="ltr"
							height="14">
							<jsp:include page="left_side_menu.jsp"></jsp:include>
						</TD>
						
					</TR>
				</TBODY>
				
			</TABLE>
			<!--Sub menu--></TD>
		
		</TR>
	</TBODY>
</TABLE>
</BODY>
</HTML>
