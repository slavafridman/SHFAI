<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ page import="bzq.shf.utils.SHFConstants"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
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

<TABLE width=100% cellpadding="0" cellspacing="0" align=right>
	<TBODY>
		<TR bgcolor="#F4C531">
			
			<TD
				align="right"
				nowrap
				height="20">
				<!--Sub menu-->
				<TABLE
				border="0"
				cellspacing="0"
				cellpadding="0"
				height="16">
				<TBODY>
					<TR>	
						<TD width="130"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup1',1)"
							onmouseout="popVisible('popup1',0);"
							onclick="popVisible('popup1',0);"
							dir="rtl"
							height="14">
							<CENTER>
							<TABLE border="0" cellpadding="0" cellspacing="0">
								<TBODY>
								<TR>
									<TD width="18" height="14">
										<IMG border="0" src="/shf/images/book.gif"
										width="14" height="14" hspace="0" vspace="0" align="middle"></TD>
									<TD class="upmenuButtonText" valign="middle"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">טבלאות מערכת</TD>
								</TR>
								</TBODY>
							</TABLE>
							</CENTER>
							<DIV
							id="popup1"
							class="popup"
							style="visibility:hidden ;z-index: 123;"
							onclick="popVisible(this.id,0)">
							<TABLE width="140px"
							border="0"
							cellspacing="1"
							cellpadding="1"
							class="subMenu">
							<TBODY>
								<shf:security activity="admin_system_tables">
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.LATE_REASON%>')"
										><%=SHFConstants.LATE_TABLE%></TD>
								</TR>
								</shf:security>
								<shf:security activity="admin_system_tables">
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.MISSING_REASON%>')"
										><%=SHFConstants.MISSING_TABLE%></TD>
								</TR>
								</shf:security>
								<shf:security activity="admin_system_tables">
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventType&type=<%=SHFConstants.EVENT_TYPE%>')"
										><%=SHFConstants.EVENT_TYPE_TABLE%></TD>
								</TR>
								</shf:security>
								<shf:security activity="admin_system_tables">
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.CHANGE_SHIFT_REASON%>')"
										><%=SHFConstants.CHANGE_SHIFT%></TD>
								</TR>
								</shf:security>
								<shf:security activity="admin_system_tables">
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.EARLY_EXIT%>')"
										><%=SHFConstants.EARLY_EXIT_TABLE%></TD>
								</TR>
								
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.CANCEL_SHIFT%>')"
										><%=SHFConstants.CANCEL_SHIFT_TABLE%></TD>
								</TR>
								
								<TR>
									<TD height="15"
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=SHFConstants.CANCEL_SHIFT%>')"
										><%=SHFConstants.CANCEL_SHIFT_TABLE%></TD>
								</TR>
								</shf:security>	
								
								<shf:security activity="admin_activity_view">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/viewActivityAim.do?action=findActivityAim')">עדכון נתוני יעדי שיחה</TD>
								</TR>
								</shf:security>							
								<shf:security activity="admin_skill_view">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=updateSkills')">מיומנויות</TD>
								</TR>
								</shf:security>
								<shf:security activity="completions_types_view">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin.do?action=viewCompletionsTypes')">השלמות</TD>
								</TR>
								</shf:security>
								<shf:security activity="admin_inner_jobs">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/manageInnerJobs.do?action=view')">תפקידים בפועל</TD>
								</TR>
								</shf:security>
								
								<shf:security activity="manage_buildings">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/manageBuildings.do?action=view')"><%=SHFConstants.BUILDINGS_TABLE %></TD>
								</TR>
								</shf:security>
								
								<shf:security activity="actual_job">
								<TR>
									<TD height="15" class="subMenuButtonText" align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/viewActualJob.do?action=showActualJob')">מיפוי תפקידים נציג/בכיר</TD>
										
								</TR>
								</shf:security>
								
							</TBODY>
							
						</TABLE>
						</DIV>
						</TD>
						
						<TD style="font-size: 11px; color:a4a477">|</TD>
						
						<TD
							width="110"
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
										class="upmenuButtonText" valign="middle"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">פרמטרים</TD>
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
								<shf:security activity="admin_param_view">
								<TR>
									<TD
										width="100%"
										height="15"
										nowrap
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/viewMokedParameters.do');">פרמטרי מערכת</TD>
									
								</TR>
								</shf:security>
								<shf:security activity="admin_shfsp_view">
								<TR>
									<TD
										width="100%"
										height="15"
										nowrap
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/admin/viewSPParameters.do');">פרמטרי ממשק SP</TD>
									
								</TR>
								</shf:security>
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						<TD style="font-size: 11px; color:a4a477">|</TD>
						<TD
							width="110"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup3',1)"
							onmouseout="popVisible('popup3',0);"
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
										src="/shf/images/options.png"
										width="14"
										height="14"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD
										class="upmenuButtonText" valign="middle"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">אפשרויות</TD>
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
							width="100%"
							cellspacing="1"
							cellpadding="1"
							class="subMenu">
								<TBODY>
									<shf:security activity="opt_shfsp">
									<TR>
										<TD
											width="100%"
											height="15"
											nowrap
											class="subMenuButtonText"
											align="center"
											valign="middle"
											onmouseover="this.className='subMenuButtonTextOver'"
											onmouseout="this.className='subMenuButtonText'"
											onclick="javascript:navigate('/shf/admin/optShfSpView.do');">דגל חירום להפסקות</TD>
										
									</TR>
									</shf:security>
								</TBODY>
								</TABLE>
							
							</DIV>
							
						</TD>
						
						
						<TD style="padding-left:10px;"
							width="100%"
							align="left"
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


