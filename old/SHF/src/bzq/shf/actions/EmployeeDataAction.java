/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
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

import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.EmployeeEventBean;
import bzq.shf.bean.ShfBaseBean;
import bzq.shf.forms.EmployeeActivitiesForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EmployeeInforceListForm;
import bzq.shf.forms.EmployeeListForm;
import bzq.shf.model.EmployeeDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeDataAction extends BaseAction{

	private Logger logger = Logger.getLogger(EmployeeDataAction.class);
	
	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		String param=(String)parameters.get("param");
		ActionForward result=null;
		EmployeeDataForm employeeForm=null;
		EmployeeDataModel employeeData=null;
		try{
			if(param.equals("card")){				
				employeeForm=(EmployeeDataForm)form;
				
				Logger privacyLogger = Logger.getLogger("PrivacyLogger");
				privacyLogger.info("Start VIEW EMPLOYEE CARD for emp_id " + employeeForm.getEmployeeId());		// do not remove, must log
				
				employeeData=new EmployeeDataModel(employeeForm);
				employeeData.populate();
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("list_param")){
				ShfBaseBean baseBean=(ShfBaseBean)form;
				if(baseBean.getAllowedActivities().contains("card_search")){
					employeeForm=(EmployeeListForm)form;
					EmployeeListForm storedEmployeeForm = (EmployeeListForm)request.getSession().getAttribute("employeeForm");
					if(storedEmployeeForm==null){
						employeeData=new EmployeeDataModel(employeeForm);
						employeeData.setFormDefaults();
					}
					else{
						((EmployeeListForm)employeeForm).copyForm(storedEmployeeForm);
					}
					
					result=mapping.findForward("success");
					request.setAttribute("employeeData",employeeForm);
				}
				else if(baseBean.getAllowedActivities().contains("card_view")){
					employeeForm=(EmployeeDataForm)form;
					employeeData=new EmployeeDataModel(employeeForm);
					employeeData.getMyId();
					employeeData.populate();
					result=mapping.findForward("success_agent");
					request.setAttribute("employeeData",employeeForm);
				}
				else{
					result=mapping.findForward("security");
				}
				
			}
			else if(param.equals("list_result")){
				employeeForm=(EmployeeListForm)form;
				Logger privacyLogger = Logger.getLogger("PrivacyLogger");
				privacyLogger.info("Start SEARCH EMPLOYEE CARD");		// do not remove, must log
				request.getSession().setAttribute("employeeForm", employeeForm);
				employeeData=new EmployeeDataModel(employeeForm);
				Vector employees=employeeData.populateEmployeeList();
				request.setAttribute("employees",employees);
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("activities_param")){
				employeeForm=(EmployeeDataForm)form;
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("shifts_param")){
				employeeForm=(EmployeeActivitiesForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				employeeData.setActivitiesDefaults();
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("shifts_results")){
				employeeForm=(EmployeeActivitiesForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				Vector shifts=employeeData.populateActivities();
				request.setAttribute("shifts",shifts);
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("exceptions")){
				employeeForm=(EmployeeActivitiesForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				Vector vec=employeeData.populateExceptions();
				request.setAttribute("exceptions",vec);
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			
			//////////////////////////
			
			else if(param.equals("events")){
				employeeForm=(EmployeeDataForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				request.setAttribute("events",employeeData.populateEvents());
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("event_cancel")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
						
				EmployeeEventBean eventForm=(EmployeeEventBean)form;
				eventForm.setEventType(eventForm.getSerType());
				employeeData=new EmployeeDataModel(eventForm);
				employeeData.cancelEvent();
				
				employeeForm=new EmployeeDataForm();
				employeeForm.setEmployeeId(eventForm.getEmployee_id());
				result=mapping.findForward("success");
				request.setAttribute("employeeDataForm",employeeForm);
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.deleteSecceeded"));
				saveErrors(request,actionErrors);
			}
			else if(param.equals("add_event")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
						
				EmployeeEventBean eventForm=(EmployeeEventBean)form;
				employeeData=new EmployeeDataModel(eventForm);
				
				
				try{
					employeeData.addEvent();
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
				}
				
				employeeForm=new EmployeeDataForm();
				employeeForm.setEmployeeId(eventForm.getEmployee_id());
				result=mapping.findForward("success");
				request.setAttribute("employeeDataForm",employeeForm);
			}
			
			/////////////////////////////
			
			else if(param.equals("education")){
				employeeForm=(EmployeeDataForm)form;
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("courses")){
				employeeForm=(EmployeeDataForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				employeeData.populateCourses();
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("skills")){
				employeeForm=(EmployeeDataForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				Vector skills=employeeData.populateSkills(-1);
				result=mapping.findForward("success");
				request.setAttribute("skills",skills);
				request.setAttribute("employeeData",employeeForm);
			}
			else if(param.equals("inforce_result")){
				EmployeeInforceListForm employeeInforce=(EmployeeInforceListForm)form;
				employeeData=new EmployeeDataModel(employeeInforce);
				employeeData.populateEployeeInforce();
				result=mapping.findForward("success");
				request.setAttribute("employeeData",employeeInforce);
			}
			else if(param.equals("taxi")){
				employeeForm=(EmployeeDataForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				employeeData.populateTaxiOrders();
				result=mapping.findForward("success");
			}
			
			/////////////////////////
			
			
			else if(param.equals("team_members")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
				employeeForm=(EmployeeListForm)form;
				((EmployeeListForm)employeeForm).setJob("00");
				String moked=SHFTableUtils.getParentUnitNameOf(((EmployeeListForm)employeeForm).getTeam()[0]);
				((EmployeeListForm)employeeForm).setMoked(moked);
				employeeData=new EmployeeDataModel(employeeForm);
				Vector employees=employeeData.populateEmployeeList();
//				if ( employees.size()>0 ){
//					System.out.println("emp size @Action: "+employees.size());
//				}
				request.setAttribute("employees",employees);
				result=mapping.findForward("success");
			}
			else if(param.equals("shifts_switch")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
				employeeForm=(EmployeeActivitiesForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				Vector shifts=employeeData.getShiftsForSwitch();
				request.setAttribute("shifts",shifts);
				result=mapping.findForward("success");
			}
			else if ("updateSMS".equals(param)) {
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
				employeeData = new EmployeeDataModel((EmployeeDataForm)form);
				try {
					employeeData.updateSMS();
					response.setStatus(HttpServletResponse.SC_OK);
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.generalSuccessMsg"));
					saveErrors(request,actionErrors);
				} catch (Exception e) {
					response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					saveErrors(request,actionErrors);
					result=mapping.findForward("fail");
				}
				result=mapping.findForward("success");
			}
			else if(param.equals("export")){
				employeeForm=(EmployeeListForm)form;
				employeeData=new EmployeeDataModel(employeeForm);
				Vector employees=employeeData.populateEmployeeList();
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=employee_table.xls");
				logger.info("exporting employee list to excell");
				
				PrintWriter out = response.getWriter();
				if(employees!=null){
					EmployeeBean emp=null;
					out.print("תעודת זהות"+"\t");
					out.print("שם"+"\t");
					out.print("מוקד"+"\t");
					out.print("תפקיד"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("צוות"+"\t");
					out.print("אחוז משרה"+"\t");
					out.print("מועבר ל SAP"+"\n");
					
					
					
					for(int i=0;i<employees.size();i++){
						emp=(EmployeeBean)employees.get(i);
						out.print(emp.getIdNumber() +"\t");
						out.print(emp.getFname()+" "+emp.getLname() +"\t");
						out.print(SHFTableUtils.getUnitName(SHFTableUtils.getMokedCodeOf(emp.getOrgUnitId())) +"\t");
						out.print(SHFTableUtils.getJobName(Integer.parseInt(emp.getJobId()))+"\t");
						out.print(SHFTableUtils.getInnerJobName(emp.getInnerJobId())+"\t");
						out.print(SHFTableUtils.getUnitName(emp.getOrgUnitId())+"\t");
						out.print(emp.getJobTime() +"\t");
						out.print((("1".equals(emp.getOptional1()))?"כן":"לא"));
						
						out.print("\n");
					}
				}
				out.close();
			}
			
		}catch(ShfException e){
			saveErrors(request,e.getErrors());
			result=mapping.findForward("fail");
		}
		
		return result;
	}

}
