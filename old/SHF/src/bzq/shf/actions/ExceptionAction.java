/*
 * Created on 01/04/2009
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

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.ExceptionSearchBean;
import bzq.shf.forms.EmployeeActivitiesForm;
import bzq.shf.forms.EmployeeExceptionForm;
import bzq.shf.forms.ExceptionSearchForm;
import bzq.shf.model.ExceptionDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ExceptionAction extends BaseAction{

	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
		ActionForward result=null;
		String param=(String)parameters.get("param");
		ExceptionDataModel exception=null;
		
		try{
		
			if(param.equals("param")){
				ExceptionSearchForm exceptionForm =(ExceptionSearchForm)form;
				ExceptionSearchForm storedExceptionForm = (ExceptionSearchForm)request.getSession().getAttribute("exceptionForm");
				if(storedExceptionForm==null){
					exception=new ExceptionDataModel(exceptionForm);
					exception.setFormDefaults();
				}else{
					exceptionForm.copyForm(storedExceptionForm);
				}
				result=mapping.findForward("success");
				request.setAttribute("exceptionForm", exceptionForm);
			}
			else if(param.equals("result")){
				ExceptionSearchForm exceptionForm =(ExceptionSearchForm)form;
				request.getSession().setAttribute("exceptionForm", exceptionForm);
				exception=new ExceptionDataModel(exceptionForm);
				Vector exception_list=exception.populateAllExceptions();
				result=mapping.findForward("success");
				request.setAttribute("exceptions", exception_list);
				request.setAttribute("exceptionForm", exceptionForm);
			}
			else if(param.equals("showRemarkDialog")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				
				EmployeeExceptionForm employeeExceptionForm=(EmployeeExceptionForm)form;
				
				request.setAttribute("employeeExceptionForm", employeeExceptionForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("addRemark")){
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache"); 
				EmployeeExceptionForm exceptionForm=(EmployeeExceptionForm)form;
				exception=new ExceptionDataModel(exceptionForm);
				exception.addRemark();
				result=mapping.findForward("success");
			}
			else if(param.equals("export")){
				ExceptionSearchForm exceptionForm =(ExceptionSearchForm)form;
				exception=new ExceptionDataModel(exceptionForm);
				Vector exception_list=exception.populateAllExceptions();
				response.setContentType("application/msexcel");
				response.setHeader("Content-Disposition","atachment;filename=exception_table.xls");
				logger.info("exporting exceptions list to excell");
				
				PrintWriter out = response.getWriter();
				if(exception_list!=null){
					AgentDayBean day=null;
					out.print("יום"+"\t");
					out.print("תאריך"+"\t");
					out.print("שם"+"\t");
					out.print("שעת התחלה"+"\t");
					out.print("שעת סיום"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("צוות"+"\t");
					out.print("סוג פעילות"+"\t");
					out.print("הערה"+"\n");
					
					ExceptionSearchBean exp=null;
					for(int i=0;i<exception_list.size();i++){
						exp=(ExceptionSearchBean)exception_list.get(i);
						out.print(SHFUtils.getDayOfWeek(exp.getStartTime())+ "\t");
						out.print(BaseConvert.dateToString(exp.getStartTime(), "dd/MM/yyyy") + "\t");
						out.print(exp.getFullName() + "\t");
						out.print(BaseConvert.dateToString(exp.getStartTime(), "HH:mm") + "\t");
						out.print(BaseConvert.dateToString(exp.getEndTime(), "HH:mm") + "\t");
						out.print(SHFTableUtils.getInnerJobName(exp.getInnerJob()) + "\t");
						out.print(SHFTableUtils.getUnitName(exp.getTeam()) + "\t");
						if(exp.getStateType()==SHFConstants.DAY_TYPE_TIMEOFF){
							out.print(SHFTableUtils.getTimeoffName(String.valueOf(exp.getTimeoffType())) + "\t");
						}else{
							out.print(SHFTableUtils.getExceptionName(String.valueOf(exp.getExceptionType())) + "\t");
						}
						out.print((exp.getRemark()!=null?exp.getRemark():"") + "\t");
						out.print("\n");
					}
				}
				out.close();
			}
			else if(param.equals("cancel_param")){
				EmployeeExceptionForm employeeExceptionForm=(EmployeeExceptionForm)form;
				request.setAttribute("employeeExceptionForm",employeeExceptionForm);
				result=mapping.findForward("success");
			}
			else if(param.equals("cancel")){
				EmployeeExceptionForm exceptionForm=(EmployeeExceptionForm)form;
				//cancel exception from manage exceptions
				logger.info("cancel exception of day "+exceptionForm.getAgentDayId()+" at "+exceptionForm.getFrom()+" by:"+exceptionForm.getUserFirstName()+" "+exceptionForm.getUserLastName());
				try {
					exceptionForm.setStartTime(BaseConvert.stringToDate(exceptionForm.getFrom(),"ddMMyyyyHHmm"));
				} catch (ConvertException e) {
					logger.error(e.getMessage());
					throw new ShfException(new ActionError("shf.error.general"));
				}
				ExceptionDataModel exceptionDataModel=new ExceptionDataModel(exceptionForm);
				exceptionDataModel.deleteException();
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.deleteSecceeded"));
				saveErrors(request,actionErrors);
				result=mapping.findForward("success");
			}
			
			else if(param.equals("cancel_exception")){
				EmployeeExceptionForm exceptionForm=(EmployeeExceptionForm)form;
				//cancel exception from employee card
				logger.info("deleting partial exception of day "+exceptionForm.getAgentDayId()+" at "+exceptionForm.getStartTime());
				String startTime=request.getParameter("from");
				
				try {
					exceptionForm.setStartTime(BaseConvert.stringToDate(startTime,"dd/MM/yyyy-HH:mm"));
				} catch (ConvertException e) {
					logger.error(e.getMessage());
					throw new ShfException(new ActionError("shf.error.general"));
				}
				ExceptionDataModel exceptionDataModel=new ExceptionDataModel(exceptionForm);
				exceptionDataModel.deleteException();	
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.deleteSecceeded"));
				saveErrors(request,actionErrors);
				
				EmployeeActivitiesForm employeeData=new EmployeeActivitiesForm();
				employeeData.setEmployeeId(Integer.parseInt(exceptionForm.getEmployeeId()));
				request.setAttribute("employeeData",employeeData);			
				result=mapping.findForward("success");
			}
			
		
		}
		catch(ShfException e){
			saveErrors(request,e.getErrors());
			result=mapping.findForward("fail");
		}
		return result;
	}

}
