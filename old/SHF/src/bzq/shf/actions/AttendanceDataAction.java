/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.EmployeeEventBean;
import bzq.shf.bean.ShfBaseBean;
import bzq.shf.forms.AttendanceDataForm;
import bzq.shf.forms.AttendanceSearchForm;
import bzq.shf.forms.EmployeeArriveForm;
import bzq.shf.model.AttendanceDataModel;
import bzq.shf.model.EmployeeDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.ShiftLateException;
import bzq.utils.BaseConvert;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AttendanceDataAction extends BaseAction{
	
	private Logger logger = Logger.getLogger(AttendanceDataAction.class);
	
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		String param=(String)parameters.get("param");
		ActionForward result=null;
		//HttpSession session=request.getSession();
		AttendanceDataForm attendanceForm=null;
		AttendanceDataModel attendance=null;
		response.setHeader("Cache-Control","no-cache");
		response.setHeader("Pragma","no-cache"); 
				
		try{
			if(param.equals("param")){
				ShfBaseBean baseBean=(ShfBaseBean)form;
				if(baseBean.getAllowedActivities().contains("attend_agent")){
					result=mapping.findForward("goto_agent");
				}else if(baseBean.getAllowedActivities().contains("attend_search")){
					result=mapping.findForward("goto_search");
				}else{
					result=mapping.findForward("security");
				}
			}
			
			else if(param.equals("param_agent")){
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.currentAgentDay();
//				attendance.currentAgentDayFromChange();
//				if(attendanceForm.getEmpIdNumber()==null){
//					attendance.currentAgentDayFromDay();
//				}
				
				attendance.currentAgentDayFromDay();
				
				attendance.checkChangeAgentDay(attendanceForm.getAgentDayId());
				if(attendanceForm.getNewEmpIdNumber()!=null) {
					attendanceForm=(EmployeeArriveForm)form;
					attendance.currentAgentDayFromChange();
				}
				
				
				Vector myBreaks=null;
				myBreaks=attendance.getAgentDayExceptions(attendanceForm.getAgentDayId(),SHFConstants.STATE_BREAK);
				request.setAttribute("agentDayBreaks",myBreaks);
				
				
				if(attendanceForm.getEmpIdNumber()==null){
					attendanceForm.setWmEmpIdNumber(attendanceForm.getUserId().substring(0,8));
				}
				if(attendanceForm.getLocked()>0)
					result= mapping.findForward("fail_locked");
				else
					result= mapping.findForward("success");
					
				
			}
			
			else if(param.equals("param_search")){
				attendanceForm=(AttendanceSearchForm)form;
				AttendanceSearchForm storedAttendanceForm = (AttendanceSearchForm)request.getSession().getAttribute("attendanceForm");
				if(storedAttendanceForm==null){
					attendance=new AttendanceDataModel(attendanceForm);
					attendance.setFormDefaults();
				}else{
					((AttendanceSearchForm)attendanceForm).copyForm(storedAttendanceForm);
				}
				result=mapping.findForward("success");
			}
			
			else if(param.equals("result")){
				attendanceForm=(AttendanceSearchForm)form;
				
				request.getSession().setAttribute("attendanceForm",attendanceForm);
				
				attendance=new AttendanceDataModel(attendanceForm);
				Vector vec=attendance.populateAttendanceList();
				request.setAttribute("shifts_list",vec);
				result=mapping.findForward("success");
			}
			
			else if(param.equals("add_event")){
				attendanceForm=(EmployeeArriveForm)form;
				Vector missDayIdVec = new Vector();
//				Yuval
				attendance=new AttendanceDataModel(attendanceForm);
				EmployeeArriveForm employeeArriveForm = new EmployeeArriveForm();
				employeeArriveForm = (EmployeeArriveForm)form;
				if (employeeArriveForm.getEventType() == SHFConstants.MISSING_REASON) {
					missDayIdVec = attendance.getAllShiftBetween(employeeArriveForm.getMissDateStart(), employeeArriveForm.getMissDateEnd(), employeeArriveForm);
					for (int i=0;i<missDayIdVec.size();i++) {
						employeeArriveForm.setAgentDayId( Long.parseLong(missDayIdVec.get(i).toString()));
						attendance=new AttendanceDataModel((AttendanceDataForm)employeeArriveForm);
						attendance.addEvent();
					}
				} else
				{
// end - Yuval				
					attendance=new AttendanceDataModel(attendanceForm);
					attendance.addEvent();
				}
				
			}
			
			else if(param.equals("removeMissing")){
				attendanceForm=(EmployeeArriveForm)form;
				logger.info("starting cancel missing of "+attendanceForm.getAgentDayId()+" By "+attendanceForm.getUserFirstName()+" "+attendanceForm.getUserLastName());
				AttendanceDataModel.cancelMissing(attendanceForm.getAgentDayId());
				result=mapping.findForward("success");
			}
			
			else if(param.equals("station_agent")){
				//attendanceForm=(EmployeeArriveForm)session.getAttribute("currentAgentDay");
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				try{
					attendance.registerStation();
				}catch(ShiftLateException e){
					attendanceForm.setLateMinutes(SHFUtils.getMinutesBetween(attendanceForm.getShiftStart(),new Date()));
					attendance.addLate();
				}
				//TODO yuval 

					EmployeeArriveForm empArriveForm = new EmployeeArriveForm(); 
					empArriveForm  =  (EmployeeArriveForm)form;
				if (empArriveForm.getAgentMood() > 0) {
					int entryCode = 1; //TODO make it constant
					attendance.addEntryMood(empArriveForm.getAgentMood(), entryCode);
				}
				result=mapping.findForward("success");
			}
			
			else if(param.equals("agent_exit")){
				
				
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.currentAgentDay();
				
				long endTime=0;
				long now=0;
				int num=0;
				//Yuval
				if(attendanceForm.getShiftEnd()!=null ){
					if(attendanceForm.getSiteId()!=null){
						String moked=SHFTableUtils.getUnitCodeOfSite(attendanceForm.getSiteId());
						String maxExitBeforEnd=SHFParameters.getMaxToExitBeforEndShift(moked).getValue();
						num=Integer.parseInt(maxExitBeforEnd);
						endTime = attendanceForm.getShiftEnd().getTime();
						now = new Date().getTime();
					}
				}
				
				if ( ((endTime - now)/1000/60) > num) {
					((EmployeeArriveForm)attendanceForm).setApproveManager(attendance.populateApproveManager());
					result=mapping.findForward("earlyExit");
				}
				else {
					try{

						EmployeeArriveForm empArriveForm = new EmployeeArriveForm(); 
						empArriveForm  =  (EmployeeArriveForm)form;
						int entryCode = 2; //TODO make it constant
						if (empArriveForm.getAgentMood() > 0) {
							attendance.addEntryMood(empArriveForm.getAgentMood(), entryCode);
						}
						attendance.exitStation();
					}catch(ShfException e){
						saveErrors(request,e.getErrors());
					}/*finally{
						session.setAttribute("currentAgentDay",attendanceForm);
					}*/
					result=mapping.findForward("success");
				}
			}

			else if(param.equals("EarlyExit")){
				EmployeeEventBean eventForm=(EmployeeEventBean)form;
				
				attendanceForm=new EmployeeArriveForm();
				attendanceForm.setAgentDayId(eventForm.getEmployee_day_id());
				attendanceForm.setUserFirstName(eventForm.getUserFirstName());
				attendanceForm.setUserLastName(eventForm.getUserLastName());
				attendanceForm.setUserId(eventForm.getUserId());
				attendance=new AttendanceDataModel(attendanceForm);
				
				/*
				write an event 
				*/
				EmployeeDataModel employeeData=null;
				
				
				employeeData=new EmployeeDataModel(eventForm);
				try{
					employeeData.addEvent();
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
				}
				
				try{
					int entryCode = 2; //TODO make it constant
					if (eventForm.getAgentMood() > 0) {
						attendance.addEntryMood(eventForm.getAgentMood(), entryCode);
					}
					
					attendance.exitStation();

				}catch(ShfException e){
					saveErrors(request,e.getErrors());
				}
				
				result=mapping.findForward("success");
			}
			
			else if(param.equals("station")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				try{
					attendance.registerStation();
					result=mapping.findForward("success");
				}catch(ShiftLateException e){
					request.setAttribute("source","station");
					result=mapping.findForward("late");
				}	
			}
			
			else if(param.equals("cancel_station")){
				
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.cancelRegisterStation();
				result=mapping.findForward("success");
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.cancelStationSucceeded"));
				saveErrors(request,actionErrors);
			}
			
			else if(param.equals("exit")){
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.exitStation();
			}
			
			else if(param.equals("cancel_exit")){
				
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.cancelExitStation();
				result=mapping.findForward("success");
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.cancelExitStationSucceeded"));
				saveErrors(request,actionErrors);
			}
			
			else if(param.equals("viewLate")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.populateAttendance();
				result=mapping.findForward("success");
			}
			
			else if(param.equals("viewMissing")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.populateAttendance();			
				result=mapping.findForward("success");
			}
			
			else if(param.equals("stage")){
				Vector vec=null;
				try{
					attendanceForm=(EmployeeArriveForm)form;
					attendance=new AttendanceDataModel(attendanceForm);
					if(((EmployeeArriveForm)attendanceForm).getAttendanceValue()>0){
						vec=attendance.checkReports();
						if(vec!=null){
							result=mapping.findForward("report");
							request.setAttribute("reports",vec);
						}
						attendance.registerStage();
						
					}else{
						attendance.undoRegisterStage();
					}
					
				}
				catch(ShiftLateException e){
					request.setAttribute("source","stage");
					result=mapping.findForward("late");
				}
			}
			
			else if(param.equals("approve_report")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.approveReport();
			}
			
			else if(param.equals("cancel_report")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				attendance.cancelReport();
			}
			
			else if(param.equals("flag")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				try{
					attendance.doFlag();
					result=mapping.findForward("success");
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.flagAdded"));
					saveErrors(request,actionErrors);
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
					result=mapping.findForward("fail");
				}
				return result;
			}
			
			else if(param.equals("cancel_flag")){
				attendanceForm=(AttendanceDataForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				try{
					attendance.removeFlag();
					result=mapping.findForward("success");
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.cancelFlag"));
					saveErrors(request,actionErrors);
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
					result=mapping.findForward("fail");
				}
	
			}
			else if(param.equals("setTadreech")){
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				try{
					attendance.setTadreech();
					if(attendanceForm.getTadreech()==0)
						logger.info("User "+attendanceForm.getUserId()+" removed tadreech for "+attendanceForm.getAgentDayId());
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
					result=mapping.findForward("fail");
				}
				
			}
			else if(param.equals("export")){
				attendanceForm=(EmployeeArriveForm)form;
				attendance=new AttendanceDataModel(attendanceForm);
				Vector shifts=attendance.populateAttendanceList();
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=attendance_table.xls");
				logger.info("exporting attendance list to excell");
				
				PrintWriter out = response.getWriter();
				if(shifts!=null){
					AgentDayBean day=null;
					out.print("תדריך"+"\t");
					out.print("נוכח"+"\t");
					out.print("שם"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("צוות"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("תור"+"\t");
					out.print("החלפה"+"\t");
					out.print("תגבור"+"\t");
					out.print("שינוי"+"\t");
					out.print("חיסור"+"\t");
					out.print("כניסה"+"\t");
					out.print("יציאה"+"\t");
					out.print("הערה"+"\n");
					
					
					for(int i=0;i<shifts.size();i++){
						day=(AgentDayBean)shifts.get(i);
						out.print((day.getTadreech()==1?"כן":"לא"));
						out.print("\t");
						out.print((day.getStageArrivalTime()!=null?"כן":"לא"));
						out.print("\t");
						out.print(day.getFullName());
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftStart(),"HH:mm"));
						out.print("\t");
						out.print(BaseConvert.dateToString(day.getShiftEnd(),"HH:mm"));
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(day.getOrgUnitCode()));
						out.print("\t");
						out.print(SHFTableUtils.getInnerJobName(day.getInnerJobId()) );
						out.print("\t");
						out.print(SHFTableUtils.getActivityNamesExport(day.getShiftActivity()) );
						out.print("\t");
						out.print((day.getNewEmpIdNumber()!=null?"כן":"לא") );
						out.print("\t");
						out.print(day.getShiftSource().startsWith("f")?"כן":"לא");
						out.print("\t");
						if(day.getNewShiftStart()!=null || day.getNewShiftEnd()!=null)
							out.print(SHFUtils.getLengthFormat(day.getShiftLengthChange()));
						else
							out.print("לא");
						out.print("\t");
						out.print((day.getMissingReasonId()>0?SHFTableUtils.getEventReasonName(String.valueOf(day.getMissingReasonId())):"") );
						out.print("\t");
						out.print((day.getStationArrivalTime()!=null?BaseConvert.dateToString(day.getStationArrivalTime(),"HH:mm"):"") );
						out.print("\t");
						out.print((day.getStationExitTime()!=null?BaseConvert.dateToString(day.getStationExitTime(),"HH:mm"):"") );
						out.print("\t");
						out.print((day.getRemark()==null?"":day.getRemark()) );
						out.print("\t");
						out.print("\n");
					}
				}
				out.close();
			}
			
			
		}
		catch(ShfException e){
			saveErrors(request,e.getErrors());
			result=mapping.findForward("fail");
		}
		request.setAttribute("attendanceForm",attendanceForm);
		return result;
	}

}
